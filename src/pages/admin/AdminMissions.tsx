import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageMeta } from "@/components/PageMeta";
import { Plus, Target, Eye, Users, DollarSign, CheckCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { MissionCreateDialog } from "@/components/admin/MissionCreateDialog";

interface Mission {
  id: string;
  name: string;
  description: string | null;
  mission_type: string;
  status: string;
  budget: number | null;
  reward_per_participant: number | null;
  max_participants: number | null;
  current_participants: number | null;
  assignment_mode: string;
  evidence_type: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  merchant_id: string;
  merchants?: { name: string } | null;
}

interface ParticipationWithFighter {
  id: string;
  mission_id: string;
  fighter_id: string;
  status: string;
}

interface SubmissionSummary {
  mission_id: string;
  status: string;
}

export default function AdminMissions() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["admin-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*, merchants(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Mission[];
    },
  });

  // Fetch all participations and submissions for active missions to build stats
  const activeMissionIds = missions.filter(m => m.status === "active").map(m => m.id);

  const { data: allParticipations = [] } = useQuery({
    queryKey: ["admin-all-participations", activeMissionIds],
    queryFn: async () => {
      if (activeMissionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("mission_participations")
        .select("id, mission_id, fighter_id, status")
        .in("mission_id", activeMissionIds);
      if (error) throw error;
      return data as ParticipationWithFighter[];
    },
    enabled: activeMissionIds.length > 0,
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ["admin-all-submissions", activeMissionIds],
    queryFn: async () => {
      if (activeMissionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("submissions")
        .select("mission_id, status")
        .in("mission_id", activeMissionIds);
      if (error) throw error;
      return data as SubmissionSummary[];
    },
    enabled: activeMissionIds.length > 0,
  });

  const getMissionStats = (missionId: string) => {
    const parts = allParticipations.filter(p => p.mission_id === missionId);
    const subs = allSubmissions.filter(s => s.mission_id === missionId);
    const approved = subs.filter(s => s.status === "approved").length;
    const pending = subs.filter(s => s.status === "pending").length;
    const completed = parts.filter(p => ["approved", "paid"].includes(p.status)).length;
    return { total: parts.length, completed, pending, approved, submissionCount: subs.length };
  };

  const statusColor = getMissionStatusVariant;

  const missionTypeLabel = (t: string) => {
    const labels: Record<string, string> = { purchase: "Purchase", review: "Review", social: "Social", event: "Event", referral: "Referral", custom: "Custom" };
    return labels[t] || t;
  };

  const evidenceLabel = (t: string | null) => {
    if (!t) return "—";
    const labels: Record<string, string> = { screenshot: "Screenshot", photo: "Photo", video: "Video", link: "URL/Link", receipt: "Receipt", text: "Text" };
    return labels[t] || t;
  };

  // Dashboard stats
  const totalActive = missions.filter(m => m.status === "active").length;
  const totalBudget = missions.filter(m => m.status === "active").reduce((sum, m) => sum + (m.budget || 0), 0);
  const totalParticipants = allParticipations.length;
  const totalApproved = allSubmissions.filter(s => s.status === "approved").length;

  return (
    <AdminLayout>
      <PageMeta title="Missions | Admin" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Missions</h1>
            <p className="text-muted-foreground">Create and manage promotional missions for fighters</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Mission
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Missions</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Fighters</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{totalApproved}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Missions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : missions.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No missions yet</TableCell></TableRow>
                ) : (
                  missions.map((m) => {
                    const stats = m.status === "active" ? getMissionStats(m.id) : null;
                    const completionPct = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {m.image_url ? (
                              <img src={m.image_url} alt="" className="h-9 w-9 rounded object-cover flex-shrink-0" />
                            ) : (
                              <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span>{m.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.merchants?.name || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{missionTypeLabel(m.mission_type)}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{evidenceLabel(m.evidence_type)}</TableCell>
                        <TableCell>{m.budget ? `$${m.budget.toLocaleString()}` : "—"}</TableCell>
                        <TableCell>
                          {stats ? (
                            <div className="space-y-1 min-w-[120px]">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{stats.completed}/{stats.total} done</span>
                                <span>{stats.pending} pending</span>
                              </div>
                              <Progress value={completionPct} className="h-2" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {m.current_participants || 0}{m.max_participants ? `/${m.max_participants}` : ""} fighters
                            </span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant={statusColor(m.status)}>{m.status}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/missions/${m.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <MissionCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AdminLayout>
  );
}
