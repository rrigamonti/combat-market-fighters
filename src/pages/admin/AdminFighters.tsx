import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type FighterStatus = Database["public"]["Enums"]["fighter_status"];

const statusConfig: Record<FighterStatus, { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

export default function AdminFighters() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FighterStatus | "all">("all");

  async function fetchFighters() {
    setLoading(true);
    let query = supabase
      .from("fighters")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error loading fighters", description: error.message, variant: "destructive" });
    } else {
      setFighters(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchFighters();
  }, [filter]);

  async function updateStatus(fighterId: string, newStatus: FighterStatus) {
    const { error } = await supabase
      .from("fighters")
      .update({ status: newStatus })
      .eq("id", fighterId);

    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Fighter status changed to ${newStatus}` });
      fetchFighters();
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">Fighters</h1>
            <p className="text-muted-foreground">Manage fighter applications and statuses</p>
          </div>

          <Select value={filter} onValueChange={(v) => setFilter(v as FighterStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : fighters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No fighters found
                  </TableCell>
                </TableRow>
              ) : (
                fighters.map((fighter) => {
                  const config = statusConfig[fighter.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={fighter.id}>
                      <TableCell className="font-medium">{fighter.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">@{fighter.handle}</TableCell>
                      <TableCell>{fighter.sport}</TableCell>
                      <TableCell>{fighter.country}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(fighter.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {fighter.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(fighter.id, "approved")}
                            >
                              Approve
                            </Button>
                          )}
                          {fighter.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => updateStatus(fighter.id, "rejected")}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
