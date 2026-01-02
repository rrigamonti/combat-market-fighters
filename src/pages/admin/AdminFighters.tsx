import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Pencil, FileText, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type FighterStatus = Database["public"]["Enums"]["fighter_status"];

interface PendingChanges {
  sport?: string;
  country?: string;
  short_bio?: string;
  submitted_at?: string;
}

const statusConfig: Record<FighterStatus, { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

const sports = [
  "MMA",
  "Boxing",
  "Muay Thai",
  "Brazilian Jiu-Jitsu",
  "Wrestling",
  "Kickboxing",
  "Karate",
  "Judo",
  "Taekwondo",
];

const countries = [
  "United States",
  "Brazil",
  "United Kingdom",
  "Ireland",
  "Russia",
  "Thailand",
  "Japan",
  "Australia",
  "Canada",
  "Mexico",
  "Netherlands",
  "France",
  "Germany",
  "Poland",
  "Other",
];

export default function AdminFighters() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FighterStatus | "all">("all");
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const [editData, setEditData] = useState({
    full_name: "",
    handle: "",
    sport: "",
    country: "",
    short_bio: "",
    app_username: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Review changes dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingFighter, setReviewingFighter] = useState<Fighter | null>(null);
  const [processingReview, setProcessingReview] = useState(false);

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

  // Open edit dialog
  function openEditDialog(fighter: Fighter) {
    setEditingFighter(fighter);
    setEditData({
      full_name: fighter.full_name,
      handle: fighter.handle,
      sport: fighter.sport,
      country: fighter.country,
      short_bio: fighter.short_bio || "",
      app_username: fighter.app_username || "",
    });
    setEditDialogOpen(true);
  }

  // Save admin edit (direct update)
  async function handleSaveEdit() {
    if (!editingFighter) return;
    
    setSavingEdit(true);
    
    const { error } = await supabase
      .from("fighters")
      .update({
        full_name: editData.full_name,
        handle: editData.handle,
        sport: editData.sport,
        country: editData.country,
        short_bio: editData.short_bio || null,
        app_username: editData.app_username || null,
      })
      .eq("id", editingFighter.id);
    
    setSavingEdit(false);
    
    if (error) {
      toast({ title: "Error saving changes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fighter updated", description: "Changes have been saved." });
      setEditDialogOpen(false);
      setEditingFighter(null);
      fetchFighters();
    }
  }

  // Open review changes dialog
  function openReviewDialog(fighter: Fighter) {
    setReviewingFighter(fighter);
    setReviewDialogOpen(true);
  }

  // Approve pending changes
  async function handleApproveChanges() {
    if (!reviewingFighter || !reviewingFighter.pending_changes) return;
    
    setProcessingReview(true);
    
    const changes = reviewingFighter.pending_changes as PendingChanges;
    
    const { error } = await supabase
      .from("fighters")
      .update({
        sport: changes.sport || reviewingFighter.sport,
        country: changes.country || reviewingFighter.country,
        short_bio: changes.short_bio !== undefined ? changes.short_bio : reviewingFighter.short_bio,
        pending_changes: null,
      })
      .eq("id", reviewingFighter.id);
    
    setProcessingReview(false);
    
    if (error) {
      toast({ title: "Error approving changes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Changes approved", description: "Fighter profile has been updated." });
      setReviewDialogOpen(false);
      setReviewingFighter(null);
      fetchFighters();
    }
  }

  // Reject pending changes
  async function handleRejectChanges() {
    if (!reviewingFighter) return;
    
    setProcessingReview(true);
    
    const { error } = await supabase
      .from("fighters")
      .update({ pending_changes: null })
      .eq("id", reviewingFighter.id);
    
    setProcessingReview(false);
    
    if (error) {
      toast({ title: "Error rejecting changes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Changes rejected", description: "Pending changes have been discarded." });
      setReviewDialogOpen(false);
      setReviewingFighter(null);
      fetchFighters();
    }
  }

  // Get pending changes object
  function getPendingChanges(fighter: Fighter): PendingChanges | null {
    if (!fighter.pending_changes) return null;
    return fighter.pending_changes as PendingChanges;
  }

  return (
    <AdminLayout>
      <PageMeta title="Manage Fighters - Admin" description="Admin panel for managing fighter applications and statuses on Combat Market." />
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
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>App Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : fighters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No fighters found
                  </TableCell>
                </TableRow>
              ) : (
                fighters.map((fighter) => {
                  const config = statusConfig[fighter.status];
                  const StatusIcon = config.icon;
                  const pendingChanges = getPendingChanges(fighter);
                  
                  return (
                    <TableRow key={fighter.id}>
                      <TableCell>
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                          {fighter.profile_image_url ? (
                            <img 
                              src={fighter.profile_image_url} 
                              alt={fighter.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                              {fighter.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{fighter.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">@{fighter.handle}</TableCell>
                      <TableCell>{fighter.sport}</TableCell>
                      <TableCell>{fighter.country}</TableCell>
                      <TableCell className="text-muted-foreground">{fighter.app_username || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={config.variant} className="gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {pendingChanges && (
                            <Badge variant="outline" className="gap-1 w-fit border-yellow-500/50 text-yellow-500">
                              <FileText className="h-3 w-3" />
                              Changes Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(fighter.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(fighter)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {pendingChanges && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                              onClick={() => openReviewDialog(fighter)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                          )}
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

      {/* Edit Fighter Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Fighter</DialogTitle>
            <DialogDescription>
              Make changes to the fighter's profile. These changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-handle">Handle</Label>
                <Input
                  id="edit-handle"
                  value={editData.handle}
                  onChange={(e) => setEditData({ ...editData, handle: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={editData.sport} onValueChange={(value) => setEditData({ ...editData, sport: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={editData.country} onValueChange={(value) => setEditData({ ...editData, country: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-username">App Username</Label>
              <Input
                id="edit-username"
                value={editData.app_username}
                onChange={(e) => setEditData({ ...editData, app_username: e.target.value })}
                placeholder="Combat Market App username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Short Bio</Label>
              <Textarea
                id="edit-bio"
                value={editData.short_bio}
                onChange={(e) => setEditData({ ...editData, short_bio: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {editData.short_bio.length}/500 characters
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Changes Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Pending Changes</DialogTitle>
            <DialogDescription>
              {reviewingFighter?.full_name} has submitted profile changes for review.
            </DialogDescription>
          </DialogHeader>
          
          {reviewingFighter && reviewingFighter.pending_changes && (
            <div className="space-y-4 py-4">
              {(() => {
                const changes = reviewingFighter.pending_changes as PendingChanges;
                const changedFields: { label: string; current: string; proposed: string }[] = [];
                
                if (changes.sport && changes.sport !== reviewingFighter.sport) {
                  changedFields.push({ label: "Sport", current: reviewingFighter.sport, proposed: changes.sport });
                }
                if (changes.country && changes.country !== reviewingFighter.country) {
                  changedFields.push({ label: "Country", current: reviewingFighter.country, proposed: changes.country });
                }
                if (changes.short_bio !== undefined && changes.short_bio !== (reviewingFighter.short_bio || "")) {
                  changedFields.push({ 
                    label: "Bio", 
                    current: reviewingFighter.short_bio || "(empty)", 
                    proposed: changes.short_bio || "(empty)" 
                  });
                }
                
                if (changedFields.length === 0) {
                  return (
                    <p className="text-muted-foreground text-center py-4">
                      No changes detected. The submitted values are the same as current.
                    </p>
                  );
                }
                
                return changedFields.map((field, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{field.label}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded bg-muted p-2 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Current</p>
                        <p className="line-clamp-3">{field.current}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 rounded bg-yellow-500/10 border border-yellow-500/20 p-2 text-sm">
                        <p className="text-xs text-yellow-500 mb-1">Proposed</p>
                        <p className="line-clamp-3">{field.proposed}</p>
                      </div>
                    </div>
                  </div>
                ));
              })()}
              
              {(reviewingFighter.pending_changes as PendingChanges).submitted_at && (
                <p className="text-xs text-muted-foreground text-center">
                  Submitted on {new Date((reviewingFighter.pending_changes as PendingChanges).submitted_at!).toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={handleRejectChanges}
              disabled={processingReview}
            >
              Reject Changes
            </Button>
            <Button 
              onClick={handleApproveChanges}
              disabled={processingReview}
            >
              {processingReview ? "Processing..." : "Approve Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}