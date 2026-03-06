import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Target, DollarSign, Calendar, Users, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Mission = Database["public"]["Tables"]["missions"]["Row"];
type Participation = Database["public"]["Tables"]["mission_participations"]["Row"];
type Submission = Database["public"]["Tables"]["submissions"]["Row"];

interface MissionWithMerchant extends Mission {
  merchants: { name: string; logo_url: string | null } | null;
}

export default function FighterMissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mission, setMission] = useState<MissionWithMerchant | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [fighter, setFighter] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submission form
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceType, setEvidenceType] = useState<string>("");

  useEffect(() => {
    if (user && id) fetchData();
  }, [user, id]);

  const fetchData = async () => {
    if (!user || !id) return;

    const { data: fighterData } = await supabase
      .from("fighters")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!fighterData) { setLoading(false); return; }
    setFighter(fighterData);

    const [missionRes, participationRes, submissionsRes] = await Promise.all([
      supabase.from("missions").select("*, merchants(name, logo_url)").eq("id", id).maybeSingle(),
      supabase.from("mission_participations").select("*").eq("mission_id", id).eq("fighter_id", fighterData.id).maybeSingle(),
      supabase.from("submissions").select("*").eq("mission_id", id).eq("fighter_id", fighterData.id).order("created_at", { ascending: false }),
    ]);

    setMission(missionRes.data as MissionWithMerchant | null);
    setParticipation(participationRes.data);
    setSubmissions(submissionsRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!fighter || !participation || !id) return;
    setSubmitting(true);

    const { error } = await supabase.from("submissions").insert({
      mission_id: id,
      participation_id: participation.id,
      fighter_id: fighter.id,
      evidence_url: evidenceUrl || null,
      evidence_notes: evidenceNotes || null,
      evidence_type: (evidenceType || null) as any,
      status: "pending",
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setSubmitting(false);
      return;
    }

    // Update participation status
    await supabase
      .from("mission_participations")
      .update({ status: "submitted" })
      .eq("id", participation.id);

    toast({ title: "Evidence Submitted", description: "Your submission is now under review." });
    setEvidenceUrl("");
    setEvidenceNotes("");
    setEvidenceType("");
    setSubmitting(false);
    fetchData();
  };

  const getSubmissionStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="border-yellow-500/20 text-yellow-500"><Clock className="mr-1 h-3 w-3" />Pending Review</Badge>;
    if (status === "approved") return <Badge variant="outline" className="border-green-500/20 text-green-500"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
    if (status === "rejected") return <Badge variant="outline" className="border-red-500/20 text-red-500"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <h1 className="font-display text-3xl">Mission Not Found</h1>
            <Link to="/missions" className="mt-4 inline-block text-primary hover:underline">← Back to Missions</Link>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = participation && ["joined", "started"].includes(participation.status);
  const hasApprovedSubmission = submissions.some((s) => s.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title={mission.name} description={mission.description || "Mission details"} noindex />
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <Link to="/missions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Missions
          </Link>

          {/* Mission Header */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              {mission.image_url ? (
                <img src={mission.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="font-display text-3xl">{mission.name}</h1>
                <p className="text-muted-foreground mt-1">{mission.merchants?.name || "Unknown brand"}</p>
              </div>
              {mission.reward_per_participant && (
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-primary">${mission.reward_per_participant}</p>
                  <p className="text-xs text-muted-foreground">reward</p>
                </div>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
              <Badge className="bg-muted text-muted-foreground">{mission.mission_type}</Badge>
              {mission.end_date && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Ends {new Date(mission.end_date).toLocaleDateString()}</span>
              )}
              {mission.max_participants && (
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{mission.current_participants || 0}/{mission.max_participants} participants</span>
              )}
            </div>

            {mission.description && (
              <p className="mt-4 text-sm">{mission.description}</p>
            )}
          </div>

          {/* Instructions */}
          {mission.instructions && (
            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-xl mb-3">Instructions</h2>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{mission.instructions}</div>
            </div>
          )}

          {/* Submit Evidence */}
          {canSubmit && !hasApprovedSubmission && (
            <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Submit Evidence
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Evidence Type</Label>
                  <Select value={evidenceType} onValueChange={setEvidenceType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="screenshot">Screenshot</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Evidence URL</Label>
                  <Input
                    placeholder="https://..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Link to your proof (social media post, photo, video, etc.)</p>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any additional context..."
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={submitting || (!evidenceUrl && !evidenceNotes)}>
                  {submitting ? "Submitting..." : "Submit Evidence"}
                </Button>
              </div>
            </div>
          )}

          {/* Completed */}
          {hasApprovedSubmission && (
            <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="font-display text-xl mt-3">Mission Complete!</h2>
              <p className="text-sm text-muted-foreground mt-1">Your submission was approved. Reward will be processed.</p>
            </div>
          )}

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-xl mb-4">Submissions</h2>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{new Date(sub.created_at).toLocaleString()}</span>
                      {getSubmissionStatusBadge(sub.status)}
                    </div>
                    {sub.evidence_url && (
                      <p className="mt-2 text-sm break-all"><a href={sub.evidence_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sub.evidence_url}</a></p>
                    )}
                    {sub.evidence_notes && <p className="mt-1 text-sm text-muted-foreground">{sub.evidence_notes}</p>}
                    {sub.review_notes && (
                      <div className="mt-2 rounded bg-muted p-2 text-sm">
                        <span className="font-medium">Review:</span> {sub.review_notes}
                      </div>
                    )}
                    {sub.payout_amount && <p className="mt-1 text-sm font-medium text-green-500">Payout: ${sub.payout_amount}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
