import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FighterPreviewLayout } from "@/components/admin/FighterPreviewLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, Clock, XCircle, Target, ChevronRight, Users, Calendar,
  DollarSign,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type Mission = Database["public"]["Tables"]["missions"]["Row"];

interface MissionWithMerchant extends Mission {
  merchants: { name: string; logo_url: string | null } | null;
}

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

  useEffect(() => {
    if (fighterId) fetchAll();
  }, [fighterId]);

  const fetchAll = async () => {
    if (!fighterId) return;

    const [fighterRes, missionsRes, partsRes] = await Promise.all([
      supabase.from("fighters").select("*").eq("id", fighterId).single(),
      supabase.from("missions").select("*, merchants(name, logo_url)").in("status", ["active", "scheduled"]).order("created_at", { ascending: false }),
      supabase.from("mission_participations").select("id, status, joined_at, mission_id").eq("fighter_id", fighterId),
    ]);

    setFighter(fighterRes.data);
    setMissions((missionsRes.data as any) || []);
    setParticipations(partsRes.data || []);
    setLoading(false);
  };

  const getParticipation = (missionId: string) =>
    participations.find((p) => p.mission_id === missionId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "joined": case "started":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="mr-1 h-3 w-3" /> In Progress</Badge>;
      case "submitted":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" /> Submitted</Badge>;
      case "approved": case "paid":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMissionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      purchase: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      event: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      referral: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      custom: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return <Badge className={colors[type] || colors.custom}>{type}</Badge>;
  };

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AdminLayout>;
  }

  if (!fighter) {
    return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Fighter not found</div></AdminLayout>;
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
                          {getStatusBadge(participation.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {(mission as any).merchants?.name && (
                            <span>by {(mission as any).merchants.name}</span>
                          )}
                          <span>Joined {new Date(participation.joined_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {mission.reward_per_participant && (
                        <span className="text-primary font-semibold ml-4">${mission.reward_per_participant}</span>
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
                        {(mission as any).merchants?.name && (
                          <span>by {(mission as any).merchants.name}</span>
                        )}
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
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mission.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {mission.reward_per_participant && (
                        <span className="text-primary font-semibold">${mission.reward_per_participant}</span>
                      )}
                      <Button size="sm" disabled>Join Mission</Button>
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
