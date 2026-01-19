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
import { CheckCircle, XCircle, Clock, Pencil, FileText, ArrowRight, Upload, X, Image, Plus } from "lucide-react";
import { sendNotification } from "@/lib/notifications";
import { getStorefrontUrl } from "@/lib/config";

interface Fighter {
  id: string;
  user_id: string | null;
  handle: string | null;
  full_name: string | null;
  sport: string | null;
  country: string | null;
  short_bio: string | null;
  app_username: string | null;
  profile_image_url: string | null;
  hero_image_url: string | null;
  status: "pending" | "approved" | "rejected";
  pending_changes: Record<string, unknown> | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  social_facebook: string | null;
  social_snapchat: string | null;
  created_at: string;
  updated_at: string;
}

type FighterStatus = "pending" | "approved" | "rejected";

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
    social_instagram: "",
    social_twitter: "",
    social_youtube: "",
    social_tiktok: "",
    social_facebook: "",
    social_snapchat: "",
  });
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createData, setCreateData] = useState({
    full_name: "",
    handle: "",
    sport: "",
    country: "",
    short_bio: "",
    app_username: "",
    status: "approved" as FighterStatus,
    social_instagram: "",
    social_twitter: "",
    social_youtube: "",
    social_tiktok: "",
    social_facebook: "",
    social_snapchat: "",
  });
  const [createProfileImageFile, setCreateProfileImageFile] = useState<File | null>(null);
  const [createProfileImagePreview, setCreateProfileImagePreview] = useState<string | null>(null);
  const [createHeroImageFile, setCreateHeroImageFile] = useState<File | null>(null);
  const [createHeroImagePreview, setCreateHeroImagePreview] = useState<string | null>(null);
  const [savingCreate, setSavingCreate] = useState(false);
  
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
      setFighters((data as Fighter[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchFighters();
  }, [filter]);

  async function updateStatus(fighter: Fighter, newStatus: FighterStatus) {
    const { error } = await supabase
      .from("fighters")
      .update({ status: newStatus })
      .eq("id", fighter.id);

    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Fighter status changed to ${newStatus}` });
      
      // Get fighter's email from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", fighter.user_id)
        .maybeSingle();
      
      if (profile?.email) {
        if (newStatus === "approved") {
          sendNotification({
            type: "application_approved",
            fighterEmail: profile.email,
            fighterName: fighter.full_name,
            storefrontUrl: getStorefrontUrl(fighter.handle),
          });
        } else if (newStatus === "rejected") {
          sendNotification({
            type: "application_rejected",
            fighterEmail: profile.email,
            fighterName: fighter.full_name,
          });
        }
      }
      
      fetchFighters();
    }
  }

  // Open edit dialog
  function openEditDialog(fighter: Fighter) {
    setEditingFighter(fighter);
    setEditData({
      full_name: fighter.full_name,
      handle: fighter.handle,
      sport: fighter.sport || "",
      country: fighter.country || "",
      short_bio: fighter.short_bio || "",
      app_username: fighter.app_username || "",
      social_instagram: fighter.social_instagram || "",
      social_twitter: fighter.social_twitter || "",
      social_youtube: fighter.social_youtube || "",
      social_tiktok: fighter.social_tiktok || "",
      social_facebook: fighter.social_facebook || "",
      social_snapchat: fighter.social_snapchat || "",
    });
    setHeroImageFile(null);
    setHeroImagePreview(fighter.hero_image_url || null);
    setEditDialogOpen(true);
  }

  // Generate handle from name
  function generateHandle(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Open create dialog
  function openCreateDialog() {
    setCreateData({
      full_name: "",
      handle: "",
      sport: "",
      country: "",
      short_bio: "",
      app_username: "",
      status: "approved",
      social_instagram: "",
      social_twitter: "",
      social_youtube: "",
      social_tiktok: "",
      social_facebook: "",
      social_snapchat: "",
    });
    setCreateProfileImageFile(null);
    setCreateProfileImagePreview(null);
    setCreateHeroImageFile(null);
    setCreateHeroImagePreview(null);
    setCreateDialogOpen(true);
  }

  // Handle profile image for create
  function handleCreateProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, or WebP image.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB.", variant: "destructive" });
      return;
    }

    setCreateProfileImageFile(file);
    setCreateProfileImagePreview(URL.createObjectURL(file));
  }

  // Handle hero image for create
  function handleCreateHeroImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, or WebP image.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setCreateHeroImageFile(file);
    setCreateHeroImagePreview(URL.createObjectURL(file));
  }

  // Create new fighter
  async function handleCreateFighter() {
    // Generate handle from name, or create a random one if no name provided
    let handle = createData.handle.trim();
    if (!handle && createData.full_name.trim()) {
      handle = generateHandle(createData.full_name);
    }
    if (!handle) {
      // Generate random handle if nothing provided
      handle = `fighter-${Date.now()}`;
    }

    setSavingCreate(true);

    let profileUrl: string | null = null;
    let heroUrl: string | null = null;

    // Upload profile image if provided
    if (createProfileImageFile) {
      const fileExt = createProfileImageFile.name.split(".").pop();
      const fileName = `${handle}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("fighter-avatars")
        .upload(fileName, createProfileImageFile, { upsert: true });
      
      if (uploadError) {
        toast({ title: "Error uploading profile image", description: uploadError.message, variant: "destructive" });
        setSavingCreate(false);
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from("fighter-avatars")
        .getPublicUrl(fileName);
      
      profileUrl = urlData.publicUrl;
    }

    // Upload hero image if provided
    if (createHeroImageFile) {
      const fileExt = createHeroImageFile.name.split(".").pop();
      const fileName = `${handle}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("fighter-heroes")
        .upload(fileName, createHeroImageFile, { upsert: true });
      
      if (uploadError) {
        toast({ title: "Error uploading hero image", description: uploadError.message, variant: "destructive" });
        setSavingCreate(false);
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from("fighter-heroes")
        .getPublicUrl(fileName);
      
      heroUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("fighters")
      .insert({
        full_name: createData.full_name.trim() || null,
        handle: handle || null,
        sport: createData.sport || null,
        country: createData.country || null,
        short_bio: createData.short_bio.trim() || null,
        app_username: createData.app_username.trim() || null,
        status: createData.status,
        profile_image_url: profileUrl,
        hero_image_url: heroUrl,
        social_instagram: createData.social_instagram.trim() || null,
        social_twitter: createData.social_twitter.trim() || null,
        social_youtube: createData.social_youtube.trim() || null,
        social_tiktok: createData.social_tiktok.trim() || null,
        social_facebook: createData.social_facebook.trim() || null,
        social_snapchat: createData.social_snapchat.trim() || null,
        user_id: null,
      });

    setSavingCreate(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Handle already exists", description: "Please choose a different handle.", variant: "destructive" });
      } else {
        toast({ title: "Error creating fighter", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Fighter created", description: `${createData.full_name || "New fighter"} has been added.` });
      setCreateDialogOpen(false);
      fetchFighters();
    }
  }

  // Handle hero image file selection
  function handleHeroImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, or WebP image.", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB for hero images)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setHeroImageFile(file);
    setHeroImagePreview(URL.createObjectURL(file));
  }

  // Remove hero image
  function removeHeroImage() {
    setHeroImageFile(null);
    setHeroImagePreview(null);
  }

  // Save admin edit (direct update)
  async function handleSaveEdit() {
    if (!editingFighter) return;
    
    setSavingEdit(true);
    
    let heroUrl = editingFighter.hero_image_url;
    
    // Upload hero image if a new file was selected
    if (heroImageFile) {
      setUploadingHero(true);
      const fileExt = heroImageFile.name.split(".").pop();
      const fileName = `${editingFighter.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("fighter-heroes")
        .upload(fileName, heroImageFile, { upsert: true });
      
      if (uploadError) {
        toast({ title: "Error uploading hero image", description: uploadError.message, variant: "destructive" });
        setSavingEdit(false);
        setUploadingHero(false);
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from("fighter-heroes")
        .getPublicUrl(fileName);
      
      heroUrl = urlData.publicUrl;
      setUploadingHero(false);
    } else if (heroImagePreview === null && editingFighter.hero_image_url) {
      // Hero image was removed
      heroUrl = null;
    }
    
    const { error } = await supabase
      .from("fighters")
      .update({
        full_name: editData.full_name,
        handle: editData.handle,
        sport: editData.sport,
        country: editData.country,
        short_bio: editData.short_bio || null,
        app_username: editData.app_username || null,
        hero_image_url: heroUrl,
        social_instagram: editData.social_instagram || null,
        social_twitter: editData.social_twitter || null,
        social_youtube: editData.social_youtube || null,
        social_tiktok: editData.social_tiktok || null,
        social_facebook: editData.social_facebook || null,
        social_snapchat: editData.social_snapchat || null,
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
      
      // Send notification email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", reviewingFighter.user_id)
        .maybeSingle();
      
      if (profile?.email) {
        sendNotification({
          type: "changes_approved",
          fighterEmail: profile.email,
          fighterName: reviewingFighter.full_name,
          storefrontUrl: getStorefrontUrl(reviewingFighter.handle),
        });
      }
      
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
      
      // Send notification email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", reviewingFighter.user_id)
        .maybeSingle();
      
      if (profile?.email) {
        sendNotification({
          type: "changes_rejected",
          fighterEmail: profile.email,
          fighterName: reviewingFighter.full_name,
        });
      }
      
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

          <div className="flex items-center gap-3">
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fighter
            </Button>
            
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
                              alt={fighter.full_name || "Fighter"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                              {fighter.full_name ? fighter.full_name.split(" ").map(n => n[0]).join("").slice(0, 2) : "?"}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{fighter.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{fighter.handle ? `@${fighter.handle}` : "—"}</TableCell>
                      <TableCell>{fighter.sport || "—"}</TableCell>
                      <TableCell>{fighter.country || "—"}</TableCell>
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
                              onClick={() => updateStatus(fighter, "approved")}
                            >
                              Approve
                            </Button>
                          )}
                          {fighter.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => updateStatus(fighter, "rejected")}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fighter</DialogTitle>
            <DialogDescription>
              Make changes to the fighter's profile. These changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-handle">Storefront Slug</Label>
              <Input
                id="edit-handle"
                value={editData.handle}
                onChange={(e) => setEditData({ ...editData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="url-friendly-slug"
              />
              {editData.handle && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Storefront URL:</p>
                  <p className="text-sm font-mono text-primary break-all">
                    cm.automationsuite.ai/{editData.handle}
                  </p>
                </div>
              )}
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

            {/* Hero Banner Image */}
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium">Hero Banner Image</Label>
              <p className="text-xs text-muted-foreground mb-3">Upload a banner image for the storefront (recommended: 1920x600)</p>
              
              {heroImagePreview ? (
                <div className="relative">
                  <img 
                    src={heroImagePreview} 
                    alt="Hero preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeHeroImage}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Image className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload hero image</p>
                    <p className="text-xs text-muted-foreground/70">JPG, PNG, WebP (max 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleHeroImageChange}
                  />
                </label>
              )}
            </div>

            {/* Social Media Links */}
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium">Social Media Links</Label>
              <p className="text-xs text-muted-foreground mb-3">Add social media profile URLs</p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-instagram" className="text-xs text-muted-foreground">Instagram</Label>
                  <Input
                    id="edit-instagram"
                    value={editData.social_instagram}
                    onChange={(e) => setEditData({ ...editData, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-twitter" className="text-xs text-muted-foreground">X (Twitter)</Label>
                  <Input
                    id="edit-twitter"
                    value={editData.social_twitter}
                    onChange={(e) => setEditData({ ...editData, social_twitter: e.target.value })}
                    placeholder="https://x.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-youtube" className="text-xs text-muted-foreground">YouTube</Label>
                  <Input
                    id="edit-youtube"
                    value={editData.social_youtube}
                    onChange={(e) => setEditData({ ...editData, social_youtube: e.target.value })}
                    placeholder="https://youtube.com/@channel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tiktok" className="text-xs text-muted-foreground">TikTok</Label>
                  <Input
                    id="edit-tiktok"
                    value={editData.social_tiktok}
                    onChange={(e) => setEditData({ ...editData, social_tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-facebook" className="text-xs text-muted-foreground">Facebook</Label>
                  <Input
                    id="edit-facebook"
                    value={editData.social_facebook}
                    onChange={(e) => setEditData({ ...editData, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-snapchat" className="text-xs text-muted-foreground">Snapchat</Label>
                  <Input
                    id="edit-snapchat"
                    value={editData.social_snapchat}
                    onChange={(e) => setEditData({ ...editData, social_snapchat: e.target.value })}
                    placeholder="https://snapchat.com/add/username"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || uploadingHero}>
              {uploadingHero ? "Uploading..." : savingEdit ? "Saving..." : "Save Changes"}
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
                  changedFields.push({ label: "Sport", current: reviewingFighter.sport || "(none)", proposed: changes.sport });
                }
                if (changes.country && changes.country !== reviewingFighter.country) {
                  changedFields.push({ label: "Country", current: reviewingFighter.country || "(none)", proposed: changes.country });
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

      {/* Create Fighter Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Fighter</DialogTitle>
            <DialogDescription>
              Create a new fighter profile. Only the name is required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                value={createData.full_name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCreateData({ 
                    ...createData, 
                    full_name: name,
                    handle: createData.handle || generateHandle(name)
                  });
                }}
                placeholder="Fighter's full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-handle">Storefront Slug</Label>
              <Input
                id="create-handle"
                value={createData.handle}
                onChange={(e) => setCreateData({ ...createData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="url-friendly-slug"
              />
              <p className="text-xs text-muted-foreground">Auto-generated from name. Leave blank for auto-generation.</p>
              {(createData.handle || createData.full_name) && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Storefront URL:</p>
                  <p className="text-sm font-mono text-primary break-all">
                    cm.automationsuite.ai/{createData.handle || generateHandle(createData.full_name) || "fighter-xxx"}
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={createData.sport} onValueChange={(value) => setCreateData({ ...createData, sport: value })}>
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
                <Select value={createData.country} onValueChange={(value) => setCreateData({ ...createData, country: value })}>
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
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-username">App Username</Label>
                <Input
                  id="create-username"
                  value={createData.app_username}
                  onChange={(e) => setCreateData({ ...createData, app_username: e.target.value })}
                  placeholder="Combat Market App username"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={createData.status} onValueChange={(value) => setCreateData({ ...createData, status: value as FighterStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-bio">Short Bio</Label>
              <Textarea
                id="create-bio"
                value={createData.short_bio}
                onChange={(e) => setCreateData({ ...createData, short_bio: e.target.value })}
                placeholder="Brief description of the fighter"
                rows={3}
              />
            </div>

            {/* Profile Image */}
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium">Profile Image</Label>
              <p className="text-xs text-muted-foreground mb-3">Avatar image for the fighter (max 2MB)</p>
              
              {createProfileImagePreview ? (
                <div className="relative w-24 h-24">
                  <img 
                    src={createProfileImagePreview} 
                    alt="Profile preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => { setCreateProfileImageFile(null); setCreateProfileImagePreview(null); }}
                    className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-full cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCreateProfileImageChange}
                  />
                </label>
              )}
            </div>

            {/* Hero Banner Image */}
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium">Hero Banner Image</Label>
              <p className="text-xs text-muted-foreground mb-3">Banner image for the storefront (max 5MB)</p>
              
              {createHeroImagePreview ? (
                <div className="relative">
                  <img 
                    src={createHeroImagePreview} 
                    alt="Hero preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => { setCreateHeroImageFile(null); setCreateHeroImagePreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Image className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload hero image</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCreateHeroImageChange}
                  />
                </label>
              )}
            </div>

            {/* Social Media Links */}
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium">Social Media Links</Label>
              <p className="text-xs text-muted-foreground mb-3">Add social media profile URLs</p>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="create-instagram" className="text-xs text-muted-foreground">Instagram</Label>
                  <Input
                    id="create-instagram"
                    value={createData.social_instagram}
                    onChange={(e) => setCreateData({ ...createData, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-twitter" className="text-xs text-muted-foreground">X (Twitter)</Label>
                  <Input
                    id="create-twitter"
                    value={createData.social_twitter}
                    onChange={(e) => setCreateData({ ...createData, social_twitter: e.target.value })}
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-youtube" className="text-xs text-muted-foreground">YouTube</Label>
                  <Input
                    id="create-youtube"
                    value={createData.social_youtube}
                    onChange={(e) => setCreateData({ ...createData, social_youtube: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-tiktok" className="text-xs text-muted-foreground">TikTok</Label>
                  <Input
                    id="create-tiktok"
                    value={createData.social_tiktok}
                    onChange={(e) => setCreateData({ ...createData, social_tiktok: e.target.value })}
                    placeholder="https://tiktok.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-facebook" className="text-xs text-muted-foreground">Facebook</Label>
                  <Input
                    id="create-facebook"
                    value={createData.social_facebook}
                    onChange={(e) => setCreateData({ ...createData, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-snapchat" className="text-xs text-muted-foreground">Snapchat</Label>
                  <Input
                    id="create-snapchat"
                    value={createData.social_snapchat}
                    onChange={(e) => setCreateData({ ...createData, social_snapchat: e.target.value })}
                    placeholder="https://snapchat.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFighter} disabled={savingCreate}>
              {savingCreate ? "Creating..." : "Create Fighter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
