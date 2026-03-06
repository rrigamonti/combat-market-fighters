import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageMeta } from "@/components/PageMeta";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Target, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  merchant_id: string;
  merchants?: { name: string } | null;
}

interface Merchant {
  id: string;
  name: string;
}

export default function AdminMissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    instructions: "",
    merchant_id: "",
    mission_type: "custom",
    assignment_mode: "hybrid",
    budget: "",
    reward_per_participant: "",
    max_participants: "",
    start_date: "",
    end_date: "",
  });

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

  const { data: merchants = [] } = useQuery({
    queryKey: ["admin-merchants-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchants")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Merchant[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("missions").insert({
        name: values.name,
        description: values.description || null,
        instructions: values.instructions || null,
        merchant_id: values.merchant_id,
        mission_type: values.mission_type as any,
        assignment_mode: values.assignment_mode,
        budget: values.budget ? parseFloat(values.budget) : null,
        reward_per_participant: values.reward_per_participant ? parseFloat(values.reward_per_participant) : null,
        max_participants: values.max_participants ? parseInt(values.max_participants) : null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        created_by: user?.id,
        status: "draft" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Mission created as draft" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => setForm({
    name: "", description: "", instructions: "", merchant_id: "",
    mission_type: "custom", assignment_mode: "hybrid",
    budget: "", reward_per_participant: "", max_participants: "",
    start_date: "", end_date: "",
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "draft": return "secondary";
      case "closed": return "outline";
      case "paused": return "destructive";
      default: return "secondary";
    }
  };

  const missionTypeLabel = (t: string) => {
    const labels: Record<string, string> = { purchase: "Purchase", review: "Review", social: "Social", event: "Event", referral: "Referral", custom: "Custom" };
    return labels[t] || t;
  };

  return (
    <AdminLayout>
      <PageMeta title="Missions | Admin" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Missions</h1>
            <p className="text-muted-foreground">Create and manage promotional missions for fighters</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Mission
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Participants</TableHead>
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
                  missions.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          {m.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.merchants?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{missionTypeLabel(m.mission_type)}</Badge></TableCell>
                      <TableCell className="text-sm capitalize">{m.assignment_mode}</TableCell>
                      <TableCell>{m.budget ? `$${m.budget.toLocaleString()}` : "—"}</TableCell>
                      <TableCell>{m.current_participants || 0}{m.max_participants ? `/${m.max_participants}` : ""}</TableCell>
                      <TableCell><Badge variant={statusColor(m.status)}>{m.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/missions/${m.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Mission</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div>
                <Label>Merchant *</Label>
                <Select value={form.merchant_id} onValueChange={(v) => setForm({ ...form, merchant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select merchant" /></SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mission Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Instructions for fighters</Label>
                <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What should fighters do?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mission Type</Label>
                  <Select value={form.mission_type} onValueChange={(v) => setForm({ ...form, mission_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assignment Mode</Label>
                  <Select value={form.assignment_mode} onValueChange={(v) => setForm({ ...form, assignment_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Admin assigns only</SelectItem>
                      <SelectItem value="open">Open for all fighters</SelectItem>
                      <SelectItem value="hybrid">Hybrid (assign + open)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Budget ($)</Label>
                  <Input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                </div>
                <div>
                  <Label>Reward/Fighter ($)</Label>
                  <Input type="number" step="0.01" value={form.reward_per_participant} onChange={(e) => setForm({ ...form, reward_per_participant: e.target.value })} />
                </div>
                <div>
                  <Label>Max Fighters</Label>
                  <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.merchant_id || !form.name}>
                Create Mission (Draft)
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
