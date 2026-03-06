import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Mission {
  id: string;
  name: string;
  status: string;
  mission_type: string;
  budget: number | null;
  reward_per_participant: number | null;
  max_participants: number | null;
  current_participants: number | null;
  start_date: string | null;
  end_date: string | null;
}

export default function MerchantMissions() {
  const { merchantId } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("missions")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });
      setMissions((data as Mission[]) || []);
      setLoading(false);
    };
    fetch();
  }, [merchantId]);

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-green-500/10 text-green-500",
      draft: "bg-muted text-muted-foreground",
      scheduled: "bg-blue-500/10 text-blue-500",
      paused: "bg-amber-500/10 text-amber-500",
      closed: "bg-red-500/10 text-red-500",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  return (
    <MerchantLayout>
      <PageMeta title="My Missions | Combat Market" />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">My Missions</h1>
          <p className="mt-1 text-muted-foreground">
            View and track all your missions and fighter participation.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : missions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No missions yet. Contact your account manager to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {missions.map((m) => (
              <Card key={m.id} className="border-border bg-card">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground">{m.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className={statusColor(m.status)}>
                        {m.status}
                      </Badge>
                      <Badge variant="outline">{m.mission_type}</Badge>
                    </div>
                  </div>
                  {m.budget && (
                    <span className="text-sm font-medium text-muted-foreground">
                      Budget: ${Number(m.budget).toFixed(2)}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {m.current_participants || 0} / {m.max_participants || "∞"} participants
                    </div>
                    {m.reward_per_participant && (
                      <div>${Number(m.reward_per_participant).toFixed(2)} per participant</div>
                    )}
                    {m.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(m.start_date), "MMM d, yyyy")}
                        {m.end_date && ` – ${format(new Date(m.end_date), "MMM d, yyyy")}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
