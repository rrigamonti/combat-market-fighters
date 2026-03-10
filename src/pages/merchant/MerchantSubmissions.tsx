import { useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Submission {
  id: string;
  status: string;
  evidence_type: string | null;
  evidence_url: string | null;
  evidence_notes: string | null;
  review_notes: string | null;
  payout_amount: number | null;
  created_at: string;
  fighter_id: string;
  mission_id: string;
  fighter_name?: string;
  mission_name?: string;
}

export default function MerchantSubmissions() {
  const { merchantId } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    const fetch = async () => {
      // Get merchant's mission IDs
      const { data: missions } = await supabase
        .from("missions")
        .select("id, name")
        .eq("merchant_id", merchantId);

      if (!missions || missions.length === 0) {
        setLoading(false);
        return;
      }

      const missionIds = missions.map((m) => m.id);
      const missionMap = Object.fromEntries(missions.map((m) => [m.id, m.name]));

      const { data: subs } = await supabase
        .from("submissions")
        .select("*")
        .in("mission_id", missionIds)
        .order("created_at", { ascending: false });

      // Get fighter names
      const fighterIds = [...new Set((subs || []).map((s) => s.fighter_id))];
      const { data: fighters } = await supabase
        .from("fighters")
        .select("id, full_name")
        .in("id", fighterIds);

      const fighterMap = Object.fromEntries(
        (fighters || []).map((f) => [f.id, f.full_name || "Unknown"])
      );

      setSubmissions(
        (subs || []).map((s) => ({
          ...s,
          fighter_name: fighterMap[s.fighter_id],
          mission_name: missionMap[s.mission_id],
        }))
      );
      setLoading(false);
    };
    fetch();
  }, [merchantId]);

  const statusColor = getSubmissionStatusColor;

  return (
    <MerchantLayout>
      <PageMeta title="Submissions | Combat Market" />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Submissions</h1>
          <p className="mt-1 text-muted-foreground">
            Review evidence submitted by fighters for your missions.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((sub) => (
              <Card key={sub.id} className="border-border bg-card">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-sm text-foreground">
                      {sub.mission_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      by {sub.fighter_name} · {format(new Date(sub.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColor(sub.status)}>
                    {sub.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sub.evidence_type && (
                    <p className="text-sm text-muted-foreground">
                      Type: <span className="capitalize">{sub.evidence_type}</span>
                    </p>
                  )}
                  {sub.evidence_notes && (
                    <p className="text-sm text-foreground">{sub.evidence_notes}</p>
                  )}
                  {sub.evidence_url && (
                    <a
                      href={sub.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View evidence <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {sub.payout_amount && (
                    <p className="text-sm font-medium text-emerald-500">
                      Payout: ${Number(sub.payout_amount).toFixed(2)}
                    </p>
                  )}
                  {sub.review_notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Review: {sub.review_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
