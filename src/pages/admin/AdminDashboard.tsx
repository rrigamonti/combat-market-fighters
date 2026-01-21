import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageMeta } from "@/components/PageMeta";
import { Users, Package, LinkIcon, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        { count: pendingFighters },
        { count: approvedFighters },
        { data: fightersWithPendingChanges },
        { count: activeProducts },
        { count: totalAssignments },
      ] = await Promise.all([
        supabase.from("fighters").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("fighters").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("fighters").select("id").not("pending_changes", "is", null),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("fighter_products").select("*", { count: "exact", head: true }),
      ]);

      return {
        pendingFighters: pendingFighters ?? 0,
        approvedFighters: approvedFighters ?? 0,
        pendingChanges: fightersWithPendingChanges?.length ?? 0,
        activeProducts: activeProducts ?? 0,
        totalAssignments: totalAssignments ?? 0,
      };
    },
  });

  const statCards = [
    {
      title: "Pending Applications",
      value: stats?.pendingFighters ?? 0,
      icon: Clock,
      description: "Fighter applications awaiting review",
      urgent: (stats?.pendingFighters ?? 0) > 0,
    },
    {
      title: "Approved Fighters",
      value: stats?.approvedFighters ?? 0,
      icon: CheckCircle,
      description: "Active fighters on the platform",
    },
    {
      title: "Pending Profile Changes",
      value: stats?.pendingChanges ?? 0,
      icon: AlertCircle,
      description: "Profile edits awaiting approval",
      urgent: (stats?.pendingChanges ?? 0) > 0,
    },
    {
      title: "Active Products",
      value: stats?.activeProducts ?? 0,
      icon: Package,
      description: "Products available for assignment",
    },
    {
      title: "Total Assignments",
      value: stats?.totalAssignments ?? 0,
      icon: LinkIcon,
      description: "Products assigned to storefronts",
    },
  ];

  return (
    <AdminLayout>
      <PageMeta title="Admin Dashboard" description="Combat Market admin dashboard overview." noindex />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and quick actions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title} className={stat.urgent ? "border-primary/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.urgent ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className={`text-3xl font-bold ${stat.urgent ? "text-primary" : ""}`}>
                    {stat.value}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/admin/fighters">
                <Users className="h-4 w-4 mr-2" />
                Review Applications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/products">
                <Package className="h-4 w-4 mr-2" />
                Manage Products
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/assignments">
                <LinkIcon className="h-4 w-4 mr-2" />
                Assign Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
