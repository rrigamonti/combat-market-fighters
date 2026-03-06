import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, FileText, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function MerchantDashboard() {
  const { merchantId } = useAuth();
  const [merchantName, setMerchantName] = useState("");
  const [stats, setStats] = useState({
    activeMissions: 0,
    pendingSubmissions: 0,
    totalParticipants: 0,
    availableBalance: 0,
    reservedBalance: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;

    const fetchData = async () => {
      setLoading(true);

      const [merchantRes, missionsRes, submissionsRes, balanceRes] = await Promise.all([
        supabase.from("merchants").select("name").eq("id", merchantId).single(),
        supabase
          .from("missions")
          .select("id, status, current_participants")
          .eq("merchant_id", merchantId),
        supabase
          .from("submissions")
          .select("id, status, mission_id")
          .in("mission_id", 
            (await supabase.from("missions").select("id").eq("merchant_id", merchantId)).data?.map(m => m.id) || []
          ),
        supabase.rpc("get_merchant_balance", { _merchant_id: merchantId }),
      ]);

      if (merchantRes.data) setMerchantName(merchantRes.data.name);

      const missions = missionsRes.data || [];
      const submissions = submissionsRes.data || [];
      const balance = balanceRes.data?.[0];

      setStats({
        activeMissions: missions.filter(m => m.status === "active").length,
        pendingSubmissions: submissions.filter(s => s.status === "pending").length,
        totalParticipants: missions.reduce((sum, m) => sum + (m.current_participants || 0), 0),
        availableBalance: balance?.available_balance || 0,
        reservedBalance: balance?.reserved_balance || 0,
        totalBalance: balance?.total_balance || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [merchantId]);

  const statCards = [
    {
      title: "Active Missions",
      value: stats.activeMissions,
      icon: Target,
      link: "/merchant/missions",
      color: "text-primary",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingSubmissions,
      icon: FileText,
      link: "/merchant/submissions",
      color: "text-amber-500",
    },
    {
      title: "Total Participants",
      value: stats.totalParticipants,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Available Balance",
      value: `$${Number(stats.availableBalance).toFixed(2)}`,
      icon: Wallet,
      link: "/merchant/billing",
      color: "text-emerald-500",
    },
  ];

  return (
    <MerchantLayout>
      <PageMeta title="Merchant Dashboard | Combat Market" />
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            {loading ? "Loading..." : `Welcome, ${merchantName}`}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your missions and track fighter engagement.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                {card.link && (
                  <Link
                    to={card.link}
                    className="mt-1 text-xs text-primary hover:underline"
                  >
                    View details →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Balance breakdown */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Float Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-xl font-bold text-emerald-500">
                  ${Number(stats.availableBalance).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-xl font-bold text-amber-500">
                  ${Number(stats.reservedBalance).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deposited</p>
                <p className="text-xl font-bold text-foreground">
                  ${Number(stats.totalBalance).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MerchantLayout>
  );
}
