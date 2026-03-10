import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FighterPreviewLayout } from "@/components/admin/FighterPreviewLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, ExternalLink, Target,
  DollarSign, FileText, Package
} from "lucide-react";
import { getStorefrontUrl } from "@/lib/config";
import type { Database } from "@/integrations/supabase/types";
import { getParticipationStatusBadge } from "@/lib/missionHelpers";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];

interface PendingChanges {
  sport?: string;
  country?: string;
  short_bio?: string;
  submitted_at?: string;
}

interface MissionParticipation {
  id: string;
  status: string;
  joined_at: string;
  mission_id: string;
  missions: { name: string; mission_type: string; reward_per_participant: number | null; status: string } | null;
}

interface ProductRequest {
  id: string;
  product_name: string;
  brand_name: string | null;
  status: string;
  created_at: string;
}

interface Sale {
  id: string;
  sale_amount: number;
  fighter_commission: number;
  status: string;
  sale_date: string | null;
  created_at: string;
}

export default function AdminFighterPreview() {
  const { fighterId } = useParams<{ fighterId: string }>();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [participations, setParticipations] = useState<MissionParticipation[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<{ id: string; name: string; brand: string; image_url: string | null }[]>([]);

  useEffect(() => {
    if (fighterId) fetchAll();
  }, [fighterId]);

  const fetchAll = async () => {
    if (!fighterId) return;

    const [fighterRes, partsRes, requestsRes, salesRes, productsRes] = await Promise.all([
      supabase.from("fighters").select("*").eq("id", fighterId).single(),
      supabase.from("mission_participations").select("*, missions(name, mission_type, reward_per_participant, status)").eq("fighter_id", fighterId).order("joined_at", { ascending: false }),
      supabase.from("product_requests").select("id, product_name, brand_name, status, created_at").eq("fighter_id", fighterId).order("created_at", { ascending: false }),
      supabase.from("sales").select("id, sale_amount, fighter_commission, status, sale_date, created_at").eq("fighter_id", fighterId).order("created_at", { ascending: false }).limit(10),
      supabase.from("fighter_products").select("id, products(id, name, brand, image_url)").eq("fighter_id", fighterId).order("order_index"),
    ]);

    setFighter(fighterRes.data);
    setParticipations((partsRes.data as any) || []);
    setProductRequests(requestsRes.data || []);
    setSales(salesRes.data || []);
    setAssignedProducts((productsRes.data || []).map((fp: any) => fp.products).filter(Boolean));
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" /> Approved</Badge>;
      case "pending": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "rejected": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AdminLayout>;
  }

  if (!fighter) {
    return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Fighter not found</div></AdminLayout>;
  }

  const pendingChanges = fighter.pending_changes as PendingChanges | null;
  const activeMissions = participations.filter(p => ["joined", "started", "submitted"].includes(p.status));
  const completedMissions = participations.filter(p => ["approved", "paid"].includes(p.status));
  const totalEarnings = sales.reduce((sum, s) => sum + (s.fighter_commission || 0), 0);

  return (
    <FighterPreviewLayout
      fighterName={fighter.full_name || "Fighter"}
      fighterHandle={fighter.handle}
      fighterProfileImage={fighter.profile_image_url}
    >
      <PageMeta title={`${fighter.full_name || "Fighter"} Preview | Admin`} noindex />
      <div className="space-y-6">
        {/* Fighter header — mirrors Dashboard.tsx */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary bg-muted shrink-0">
            {fighter.profile_image_url ? (
              <img src={fighter.profile_image_url} alt={fighter.full_name || ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-display text-primary">
                {(fighter.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="font-display text-3xl">Fighter Dashboard</h1>
            {getStatusBadge(fighter.status)}
          </div>
        </div>

        {/* Pending Changes Banner */}
        {pendingChanges && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-500">Changes Pending Approval</p>
                <div className="mt-2 space-y-1 text-sm">
                  {pendingChanges.sport && pendingChanges.sport !== fighter.sport && (
                    <p><span className="text-muted-foreground">Sport:</span> {fighter.sport} → <span className="text-yellow-500">{pendingChanges.sport}</span></p>
                  )}
                  {pendingChanges.country && pendingChanges.country !== fighter.country && (
                    <p><span className="text-muted-foreground">Country:</span> {fighter.country} → <span className="text-yellow-500">{pendingChanges.country}</span></p>
                  )}
                  {pendingChanges.short_bio !== undefined && pendingChanges.short_bio !== (fighter.short_bio || "") && (
                    <p><span className="text-muted-foreground">Bio:</span> <span className="text-yellow-500">Updated</span></p>
                  )}
                </div>
                {pendingChanges.submitted_at && (
                  <p className="mt-2 text-xs text-muted-foreground">Submitted {new Date(pendingChanges.submitted_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status message */}
        {fighter.status === "approved" && !pendingChanges && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-500">Storefront is live</p>
                <p className="text-sm text-muted-foreground">Fans can shop their storefront.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={`/${fighter.handle}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> View Storefront
                </a>
              </Button>
            </div>
          </div>
        )}

        {fighter.status === "pending" && !pendingChanges && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-yellow-500"><strong>Application under review.</strong></p>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Missions</p>
                <p className="text-2xl font-bold">{activeMissions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedMissions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{assignedProducts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-sm text-muted-foreground">Full Name</p><p className="font-medium">{fighter.full_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Handle</p><p className="font-medium">/{fighter.handle}</p></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-sm text-muted-foreground">Sport</p><p className="font-medium">{fighter.sport || "—"}</p></div>
              <div><p className="text-sm text-muted-foreground">Country</p><p className="font-medium">{fighter.country || "—"}</p></div>
            </div>
            {fighter.short_bio && (
              <div><p className="text-sm text-muted-foreground">Bio</p><p className="font-medium">{fighter.short_bio}</p></div>
            )}
          </CardContent>
        </Card>

        {/* Storefront URL */}
        <Card>
          <CardHeader><CardTitle>Storefront URL</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <code className="flex-1 text-sm">{getStorefrontUrl(fighter.handle)}</code>
              <Button variant="ghost" size="sm" asChild>
                <a href={`/${fighter.handle}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Missions */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Missions ({participations.length})</CardTitle></CardHeader>
          <CardContent>
            {participations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No missions yet</p>
            ) : (
              <div className="space-y-2">
                {participations.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-sm">{(p as any).missions?.name || "Unknown mission"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{(p as any).missions?.mission_type} · Joined {new Date(p.joined_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(p as any).missions?.reward_per_participant && (
                        <span className="text-sm text-primary font-medium">${(p as any).missions.reward_per_participant}</span>
                      )}
                      {getStatusBadge(p.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Requests */}
        {productRequests.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Product Requests ({productRequests.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {productRequests.map(pr => (
                  <div key={pr.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-sm">{pr.product_name}</p>
                      {pr.brand_name && <p className="text-xs text-muted-foreground">{pr.brand_name}</p>}
                    </div>
                    {getStatusBadge(pr.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sales */}
        {sales.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Recent Sales</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sales.map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-sm">${s.sale_amount.toFixed(2)} sale</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.sale_date || s.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-medium">${s.fighter_commission.toFixed(2)} earned</span>
                      {getStatusBadge(s.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FighterPreviewLayout>
  );
}
