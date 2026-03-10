import { useEffect, useState } from "react";
import { notifyMerchant } from "@/lib/createNotification";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Target, Calendar, DollarSign, Users, ChevronRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import {
  MissionWithMerchant,
  getParticipationStatusBadge,
  getMissionTypeBadge,
} from "@/lib/missionHelpers";

type Participation = Database["public"]["Tables"]["mission_participations"]["Row"];

export default function FighterMissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState<MissionWithMerchant[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [fighter, setFighter] = useState<{ id: string; full_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: fighterData } = await supabase
      .from("fighters")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!fighterData) {
      setLoading(false);
      return;
    }
    setFighter(fighterData);

    const [missionsRes, participationsRes] = await Promise.all([
      supabase
        .from("missions")
        .select("*, merchants(name, logo_url)")
        .in("status", ["active", "scheduled"])
        .order("created_at", { ascending: false }),
      supabase
        .from("mission_participations")
        .select("*")
        .eq("fighter_id", fighterData.id),
    ]);

    setMissions((missionsRes.data as MissionWithMerchant[]) || []);
    setParticipations(participationsRes.data || []);
    setLoading(false);
  };

  const getParticipation = (missionId: string) =>
    participations.find((p) => p.mission_id === missionId);

  const handleJoin = async (missionId: string) => {
    if (!fighter) return;
    setJoining(missionId);

    const { error } = await supabase.from("mission_participations").insert({
      mission_id: missionId,
      fighter_id: fighter.id,
      status: "joined",
    });

    setJoining(null);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    // Increment current_participants
    const mission = missions.find((m) => m.id === missionId);
    await supabase
      .from("missions")
      .update({ current_participants: (mission?.current_participants || 0) + 1 })
      .eq("id", missionId);

    // Notify merchant
    notifyMerchant(
      mission!.merchant_id,
      "Fighter Joined Mission",
      `${fighter.full_name || "A fighter"} joined "${mission?.name}"`,
      "mission",
      `/merchant/missions`
    );

    toast({ title: "Joined!", description: "You've joined this mission." });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const myMissions = missions.filter((m) => getParticipation(m.id));
  const availableMissions = missions.filter((m) => !getParticipation(m.id));

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Missions" description="Browse and join combat sport missions to earn rewards." noindex />
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl">Missions</h1>
          </div>

          {/* My Active Missions */}
          {myMissions.length > 0 && (
            <section className="mb-10">
              <h2 className="font-display text-2xl mb-4">My Missions</h2>
              <div className="space-y-3">
                {myMissions.map((mission) => {
                  const participation = getParticipation(mission.id)!;
                  return (
                    <Link
                      key={mission.id}
                      to={`/missions/${mission.id}`}
                      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{mission.name}</h3>
                          {getMissionTypeBadge(mission.mission_type)}
                          {getParticipationStatusBadge(participation.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {mission.merchants?.name || "Unknown brand"}
                        </p>
                      </div>
                      {mission.reward_per_participant && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-primary">${mission.reward_per_participant}</p>
                          <p className="text-xs text-muted-foreground">reward</p>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Available Missions */}
          <section>
            <h2 className="font-display text-2xl mb-4">Available Missions</h2>
            {availableMissions.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No missions available right now. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableMissions.map((mission) => {
                  const spotsLeft = mission.max_participants
                    ? mission.max_participants - (mission.current_participants || 0)
                    : null;
                  const isFull = spotsLeft !== null && spotsLeft <= 0;

                  return (
                    <div
                      key={mission.id}
                      className="rounded-lg border border-border bg-card p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{mission.name}</h3>
                            {getMissionTypeBadge(mission.mission_type)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mission.merchants?.name || "Unknown brand"}
                          </p>
                          {mission.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mission.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {mission.reward_per_participant && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />${mission.reward_per_participant} reward
                              </span>
                            )}
                            {mission.end_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />Ends {new Date(mission.end_date).toLocaleDateString()}
                              </span>
                            )}
                            {spotsLeft !== null && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />{spotsLeft} spots left
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {mission.reward_per_participant && (
                            <p className="text-xl font-bold text-primary">${mission.reward_per_participant}</p>
                          )}
                          <Button
                            size="sm"
                            disabled={isFull || joining === mission.id}
                            onClick={() => handleJoin(mission.id)}
                          >
                            {joining === mission.id ? "Joining..." : isFull ? "Full" : "Join Mission"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
