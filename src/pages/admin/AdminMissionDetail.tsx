import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageMeta } from "@/components/PageMeta";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, UserPlus, Target, DollarSign, Users, CheckCircle, XCircle, Clock, Pencil } from "lucide-react";
import { MissionEditDialog } from "@/components/admin/MissionEditDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifyFighter, notifyMerchant } from "@/lib/createNotification";
import { getMissionStatusVariant } from "@/lib/missionHelpers";

export default function AdminMissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignFighterId, setAssignFighterId] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const { data: mission, isLoading } = useQuery({
    queryKey: ["admin-mission", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*, merchants(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: participations = [] } = useQuery({
    queryKey: ["admin-mission-participations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_participations")
        .select("*, fighters(full_name, handle, profile_image_url)")
        .eq("mission_id", id!)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["admin-mission-submissions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, fighters(full_name, handle)")
        .eq("mission_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: availableFighters = [] } = useQuery({
    queryKey: ["admin-available-fighters", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fighters")
        .select("id, full_name, handle")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      // Filter out already-assigned fighters
      const assignedIds = participations.map((p: any) => p.fighter_id);
      return (data || []).filter((f: any) => !assignedIds.includes(f.id));
    },
    enabled: !!id && participations !== undefined,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (newStatus === "active" && mission?.status === "draft") {
        // Use publish_mission for draft → active (reserves budget)
        const { error } = await supabase.rpc("publish_mission", {
          _mission_id: id!,
          _idempotency_key: `publish-${id}-${Date.now()}`,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("missions")
          .update({ status: newStatus as any })
          .eq("id", id!);
        if (error) throw error;

        // Release unspent budget when closing a mission
        if (newStatus === "closed" && mission) {
          const { data: approvedSubs } = await supabase
            .from("submissions")
            .select("payout_amount")
            .eq("mission_id", id!)
            .eq("status", "approved");
          const totalPaid = (approvedSubs || []).reduce(
            (sum, s) => sum + (Number(s.payout_amount) || 0), 0
          );
          const unspent = (mission.budget || 0) - totalPaid;
          if (unspent > 0) {
            await supabase.from("float_ledger").insert({
              merchant_id: mission.merchant_id,
              mission_id: id!,
              entry_type: "release" as const,
              amount: unspent,
              status: "posted" as const,
              description: `Unspent budget released for closed mission: ${mission.name}`,
              posted_at: new Date().toISOString(),
              created_by: user?.id,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mission", id] });
      toast({ title: "Mission status updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: async (fighterId: string) => {
      const { error } = await supabase.from("mission_participations").insert({
        mission_id: id!,
        fighter_id: fighterId,
        assigned_by: user?.id,
        status: "joined" as const,
      });
      if (error) throw error;
      // Update participant count
      await supabase.from("missions").update({
        current_participants: (mission?.current_participants || 0) + 1,
      }).eq("id", id!);
    },
    onSuccess: (_data, fighterId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mission-participations", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-available-fighters", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-mission", id] });
      setAssignFighterId("");
      toast({ title: "Fighter assigned" });
      // Notify fighter
      notifyFighter(fighterId, "New Mission Assigned", `You've been assigned to mission: ${mission?.name}`, "mission_assigned", `/missions/${id}`);
      // Notify merchant
      if (mission?.merchant_id) {
        notifyMerchant(mission.merchant_id, "Fighter Assigned", `A fighter has been assigned to your mission: ${mission.name}`, "fighter_joined", `/merchant/submissions`);
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ submissionId, status, participationId }: { submissionId: string; status: string; participationId: string }) => {
      const payoutAmount = status === "approved" ? mission?.reward_per_participant : null;
      const { error } = await supabase
        .from("submissions")
        .update({
          status: status as any,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          payout_amount: payoutAmount,
        })
        .eq("id", submissionId);
      if (error) throw error;

      // Update participation status
      await supabase.from("mission_participations")
        .update({ status: status === "approved" ? "approved" as const : "rejected" as const })
        .eq("id", participationId);

      // Record payout in float ledger so merchant balance is correctly debited
      if (status === "approved" && payoutAmount && mission) {
        await supabase.from("float_ledger").insert({
          merchant_id: mission.merchant_id,
          mission_id: id!,
          entry_type: "payout" as const,
          amount: payoutAmount,
          status: "posted" as const,
          description: `Payout for submission on mission: ${mission.name}`,
          reference: submissionId,
          posted_at: new Date().toISOString(),
          created_by: user?.id,
        });
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mission-submissions", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-mission-participations", id] });
      toast({ title: "Submission reviewed" });
      // Find the submission to get fighter_id
      const sub = submissions.find((s: any) => s.id === variables.submissionId);
      if (sub) {
        const statusLabel = variables.status === "approved" ? "approved ✅" : "rejected";
        notifyFighter(
          sub.fighter_id,
          `Submission ${statusLabel}`,
          `Your submission for "${mission?.name}" has been ${statusLabel}.${variables.status === "approved" && mission?.reward_per_participant ? ` Payout: $${mission.reward_per_participant}` : ""}`,
          variables.status === "approved" ? "submission_approved" : "submission_rejected",
          `/missions/${id}`
        );
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div></AdminLayout>;
  }

  if (!mission) {
    return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Mission not found</div></AdminLayout>;
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "active": case "approved": case "paid": return "default";
      case "draft": case "joined": case "started": return "secondary";
      case "closed": case "submitted": return "outline";
      case "paused": case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <AdminLayout>
      <PageMeta title={`${mission.name} | Mission Admin`} />
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/missions")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-3xl text-foreground">{mission.name}</h1>
            <p className="text-muted-foreground">
              {(mission as any).merchants?.name} · {mission.mission_type} · {mission.assignment_mode}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Select value={mission.status} onValueChange={(v) => statusMutation.mutate(v)}>
            <SelectTrigger className="w-[140px]">
              <Badge variant={statusColor(mission.status)}>{mission.status}</Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-xl font-bold">${mission.budget?.toLocaleString() || "0"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Reward/Fighter</p>
                <p className="text-xl font-bold">${mission.reward_per_participant || "0"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Fighters</p>
                <p className="text-xl font-bold">{mission.current_participants || 0}{mission.max_participants ? `/${mission.max_participants}` : ""}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-xl font-bold">{submissions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mission.image_url && (
            <Card className="md:col-span-1">
              <CardContent className="p-3">
                <img src={mission.image_url} alt={mission.name} className="w-full rounded-lg object-cover max-h-48" />
              </CardContent>
            </Card>
          )}
          <Card className={mission.image_url ? "md:col-span-2" : "md:col-span-3"}>
            <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mission.description && <p className="text-muted-foreground">{mission.description}</p>}
              {mission.instructions && (
                <div>
                  <p className="text-sm font-medium text-foreground">Instructions</p>
                  <p className="text-sm text-muted-foreground">{mission.instructions}</p>
                </div>
              )}
              {mission.evidence_type && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Proof method:</p>
                  <Badge variant="outline" className="capitalize">{mission.evidence_type}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fighter completion overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Fighter Completion Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fighters assigned yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {participations.map((p: any) => {
                  const sub = submissions.find((s: any) => s.fighter_id === p.fighter_id);
                  const isCompleted = ["approved", "paid"].includes(p.status);
                  const isSubmitted = p.status === "submitted" || sub?.status === "pending";
                  const isRejected = p.status === "rejected";

                  return (
                    <div
                      key={p.id}
                      className={`rounded-lg border p-3 text-center space-y-1 ${
                        isCompleted ? "border-primary/50 bg-primary/5" :
                        isRejected ? "border-destructive/50 bg-destructive/5" :
                        isSubmitted ? "border-yellow-500/50 bg-yellow-500/5" :
                        "border-border"
                      }`}
                    >
                      <div className="text-2xl">
                        {isCompleted ? "✅" : isRejected ? "❌" : isSubmitted ? "⏳" : "🔲"}
                      </div>
                      <p className="text-sm font-medium truncate">{p.fighters?.full_name || p.fighters?.handle || "Unknown"}</p>
                      <Badge variant={statusColor(p.status)} className="text-xs">{p.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="fighters">
          <TabsList>
            <TabsTrigger value="fighters">Assigned Fighters ({participations.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="fighters" className="space-y-4">
            {/* Assign fighter */}
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <Select value={assignFighterId} onValueChange={setAssignFighterId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select a fighter to assign" /></SelectTrigger>
                  <SelectContent>
                    {availableFighters.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>{f.full_name || f.handle || "Unnamed"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => assignMutation.mutate(assignFighterId)} disabled={!assignFighterId || assignMutation.isPending}>
                  Assign
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fighter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Assigned By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participations.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No fighters assigned yet</TableCell></TableRow>
                    ) : (
                      participations.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.fighters?.full_name || p.fighters?.handle || "Unknown"}</TableCell>
                          <TableCell><Badge variant={statusColor(p.status)}>{p.status}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(p.joined_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.assigned_by ? "Admin" : "Self-joined"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fighter</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No submissions yet</TableCell></TableRow>
                    ) : (
                      submissions.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.fighters?.full_name || s.fighters?.handle || "Unknown"}</TableCell>
                          <TableCell>
                            {s.evidence_url ? (
                              <a href={s.evidence_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View evidence</a>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.evidence_notes || "—"}</TableCell>
                          <TableCell><Badge variant={statusColor(s.status)}>{s.status}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {s.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="default" onClick={() => reviewMutation.mutate({ submissionId: s.id, status: "approved", participationId: s.participation_id })}>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => reviewMutation.mutate({ submissionId: s.id, status: "rejected", participationId: s.participation_id })}>
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <MissionEditDialog open={editOpen} onOpenChange={setEditOpen} mission={mission} />
      </div>
    </AdminLayout>
  );
}
