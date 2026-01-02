import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { CheckCircle, Clock, XCircle, ExternalLink, Pencil } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];

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

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    sport: "",
    country: "",
    short_bio: "",
  });

  useEffect(() => {
    if (user) {
      fetchFighterProfile();
    }
  }, [user]);

  const fetchFighterProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("fighters")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fighter profile.",
      });
      return;
    }

    if (data) {
      setFighter(data);
      setEditData({
        sport: data.sport,
        country: data.country,
        short_bio: data.short_bio || "",
      });
    }
  };

  const handleSave = async () => {
    if (!fighter) return;

    setSaving(true);

    const { error } = await supabase
      .from("fighters")
      .update({
        sport: editData.sport,
        country: editData.country,
        short_bio: editData.short_bio || null,
      })
      .eq("id", fighter.id);

    setSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      });
      return;
    }

    toast({
      title: "Profile Updated",
      description: "Your changes have been saved.",
    });

    setEditing(false);
    fetchFighterProfile();
  };

  const getStatusBadge = (status: Fighter["status"]) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="mr-1 h-3 w-3" /> Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <h1 className="font-display text-3xl">No Fighter Profile Found</h1>
            <p className="mt-2 text-muted-foreground">
              You don't have a fighter profile yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Fighter Dashboard" description="Manage your Combat Market fighter profile, storefront, and track your affiliate earnings." />
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary bg-muted shrink-0">
              {fighter.profile_image_url ? (
                <img 
                  src={fighter.profile_image_url} 
                  alt={fighter.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-display text-primary">
                  {fighter.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h1 className="font-display text-4xl">Fighter Dashboard</h1>
              {getStatusBadge(fighter.status)}
            </div>
          </div>

          {/* Status Message */}
          {fighter.status === "pending" && (
            <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-yellow-500">
                <strong>Your application is under review.</strong> Once approved, your Combat Market storefront will go live and you'll be able to start earning.
              </p>
            </div>
          )}

          {fighter.status === "approved" && (
            <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-500">Your storefront is live!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Share your storefront link with your fans to start earning.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={`/${fighter.handle}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Storefront
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-2xl">Your Profile</h2>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={fighter.full_name} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact support to change your name</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Handle</Label>
                    <Input value={fighter.handle} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Handle cannot be changed</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport / Discipline</Label>
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
                    <Label htmlFor="country">Country</Label>
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
                  <Label htmlFor="bio">Short Bio</Label>
                  <Textarea
                    id="bio"
                    value={editData.short_bio}
                    onChange={(e) => setEditData({ ...editData, short_bio: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editData.short_bio.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{fighter.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Handle</p>
                    <p className="font-medium">/{fighter.handle}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Sport</p>
                    <p className="font-medium">{fighter.sport}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium">{fighter.country}</p>
                  </div>
                </div>

                {fighter.short_bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="font-medium">{fighter.short_bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Storefront URL */}
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-2xl">Storefront URL</h2>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <code className="flex-1 text-sm">
                {window.location.origin}/{fighter.handle}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${fighter.handle}`);
                  toast({
                    title: "Copied!",
                    description: "Storefront URL copied to clipboard.",
                  });
                }}
              >
                Copy
              </Button>
            </div>
            {fighter.status !== "approved" && (
              <p className="mt-2 text-sm text-muted-foreground">
                Your storefront will be accessible once your application is approved.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
