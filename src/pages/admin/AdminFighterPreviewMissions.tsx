import { useEffect, useState } from "react";
import { notifyFighter, notifyMerchant } from "@/lib/createNotification";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FighterPreviewLayout } from "@/components/admin/FighterPreviewLayout";
import { PageMeta } from "@/components/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Target, Users, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import {
  MissionWithMerchant,
  getParticipationStatusBadge,
  getMissionTypeBadge,
} from "@/lib/missionHelpers";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];

interface Participation {
  id: string;
  status: string;
  joined_at: string;
  mission_id: string;
}

export default function AdminFighterPreviewMissions() {
  const { fighterId } = useParams<{ fighterId: string }>();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<MissionWithMerchant[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (fighterId) fetchAll();
  }, [fighterId]);

  const fetchAll = async () => {
    if (!fighterId) return;

    const [fighterRes, missionsRes, partsRes] = await Promise.all([
      supabase.from("fighters").select("*").eq("id", fighterId).single(),
      supabase
        .from("missions")
        .select("*, merchants(name, logo_url)")
        .in("status", ["active", "scheduled"])
        .order("created_at", { ascending: false }),
      supabase
        .from("mission_participations")
        .select("id, status, joined_at, mission_id")
        .eq("fighter_id", fighterId),
    ]);

    setFighter(fighterRes.data);
    setMissions((missionsRes.data as MissionWithMerchant[]) || []);
    setParticipations(partsRes.data || []);
    setLoading(false);
  };

  const handleJoin = async (missionId: string) => {
    if (!fighterId) return;
    setJoiningId(missionId);

    const { error } = await supabase.from("mission_participations").insert({
      fighter_id: fighterId,
      mission_id: missionId,
      status: "joined",
      assigned_by: (await supabase.auth.getUser()).data.user?.id || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Increment current_participants to keep spots counter accurate
      const mission = missions.find((m) => m.id === missionId);
      await supabase
        .from("missions")
        .update({ current_participants: (mission?.current_participants || 0) + 1 })
        .eq("id", missionId);

      // Notify fighter and merchant
      notifyFighter(
        fighterId,
        "Mission Assignment",
        `You've been enrolled in "${mission?.name}"`,
        "mission",
        `/missions/${missionId}`
      );
      notifyMerchant(
        mission!.merchant_id,
        "Fighter Assigned",
        `${fighter?.full_name || "A fighter"} was assigned to "${mission?.name}"`,
        "mission",
        `/merchant/missions`
      );

      toast({ title: "Joined", description: "Fighter enrolled in mission." });
      await fetchAll();
    }
    setJoiningId(null);
  };

  const getParticipation = (missionId: string) =>
    participations.find((p) => p.mission_id === missionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Fighter not found
      </div>
    );
  }

  const myMissions = missions.filter((m) => getParticipation(m.id));
  const availableMissions = missions.filter((m) => !getParticipation(m.id));

  return (
    <FighterPreviewLayout
      fighterName={fighter.full_name || "Fighter"}
      fighterHandle={fighter.handle}
      fighterProfileImage={fighter.profile_image_url}
    >
      <PageMeta title={`${fighter.full_name || "Fighter"} Missions Preview | Admin`} noindex />
      <div className="space-y-6">
        <h1 className="font-display text-3xl">Missions</h1>

        {/* My Missions */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            My Missions ({myMissions.length})
          </h2>
          {myMissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No missions joined yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myMissions.map((mission) => {
                const participation = getParticipation(mission.id)!;
                return (
                  <Card key={mission.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{mission.name}</p>
                          {getMissionTypeBadge(mission.mission_type)}
                          {getParticipationStatusBadge(participation.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {mission.merchants?.name && <span>by {mission.merchants.name}</span>}
                          <span>Joined {new Date(participation.joined_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {mission.reward_per_participant && (
                        <span className="text-primary font-semibold ml-4">
                          ${mission.reward_per_participant}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Missions */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Available Missions ({availableMissions.length})
          </h2>
          {availableMissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No available missions right now.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {availableMissions.map((mission) => (
                <Card key={mission.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{mission.name}</p>
                        {getMissionTypeBadge(mission.mission_type)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {mission.merchants?.name && <span>by {mission.merchants.name}</span>}
                        {mission.max_participants && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {mission.current_participants || 0}/{mission.max_participants} spots
                          </span>
                        )}
                        {mission.end_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Ends {new Date(mission.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {mission.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {mission.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {mission.reward_per_participant && (
                        <span className="text-primary font-semibold">
                          ${mission.reward_per_participant}
                        </span>
                      )}
                      <Button
                        size="sm"
                        disabled={
                          joiningId === mission.id ||
                          (mission.max_participants != null &&
                            (mission.current_participants || 0) >= mission.max_participants)
                        }
                        onClick={() => handleJoin(mission.id)}
                      >
                        {joiningId === mission.id ? "Joining…" : "Join Mission"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </FighterPreviewLayout>
  );
}
