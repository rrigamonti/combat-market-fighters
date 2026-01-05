import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

type DateRange = "7d" | "30d" | "90d" | "all";

interface FighterAnalytics {
  fighter_id: string;
  fighter_name: string;
  handle: string;
  views: number;
  clicks: number;
  ctr: number;
}

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const getDateFilter = () => {
    if (dateRange === "all") return null;
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return startOfDay(subDays(new Date(), days)).toISOString();
  };

  // Fetch overview stats
  const { data: overviewStats, isLoading: loadingOverview } = useQuery({
    queryKey: ["analytics-overview", dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();

      let viewsQuery = supabase
        .from("storefront_views")
        .select("*", { count: "exact", head: true });

      let clicksQuery = supabase
        .from("product_clicks")
        .select("*", { count: "exact", head: true });

      if (dateFilter) {
        viewsQuery = viewsQuery.gte("viewed_at", dateFilter);
        clicksQuery = clicksQuery.gte("clicked_at", dateFilter);
      }

      const [{ count: totalViews }, { count: totalClicks }] = await Promise.all([
        viewsQuery,
        clicksQuery,
      ]);

      // Count unique fighters with activity
      let uniqueFightersQuery = supabase
        .from("storefront_views")
        .select("fighter_id");

      if (dateFilter) {
        uniqueFightersQuery = uniqueFightersQuery.gte("viewed_at", dateFilter);
      }

      const { data: uniqueFighters } = await uniqueFightersQuery;
      const uniqueFighterCount = new Set(uniqueFighters?.map((f) => f.fighter_id)).size;

      return {
        totalViews: totalViews ?? 0,
        totalClicks: totalClicks ?? 0,
        uniqueFighters: uniqueFighterCount,
        overallCtr: totalViews ? ((totalClicks ?? 0) / totalViews * 100).toFixed(1) : "0",
      };
    },
  });

  // Fetch per-fighter analytics
  const { data: fighterAnalytics, isLoading: loadingFighters } = useQuery({
    queryKey: ["analytics-fighters", dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();

      // Get all fighters
      const { data: fighters } = await supabase
        .from("fighters")
        .select("id, full_name, handle")
        .eq("status", "approved");

      if (!fighters) return [];

      // Get views per fighter
      let viewsQuery = supabase
        .from("storefront_views")
        .select("fighter_id");

      if (dateFilter) {
        viewsQuery = viewsQuery.gte("viewed_at", dateFilter);
      }

      const { data: viewsData } = await viewsQuery;

      // Get clicks per fighter
      let clicksQuery = supabase
        .from("product_clicks")
        .select("fighter_id");

      if (dateFilter) {
        clicksQuery = clicksQuery.gte("clicked_at", dateFilter);
      }

      const { data: clicksData } = await clicksQuery;

      // Count views per fighter
      const viewCounts: Record<string, number> = {};
      viewsData?.forEach((v) => {
        viewCounts[v.fighter_id] = (viewCounts[v.fighter_id] || 0) + 1;
      });

      // Count clicks per fighter
      const clickCounts: Record<string, number> = {};
      clicksData?.forEach((c) => {
        clickCounts[c.fighter_id] = (clickCounts[c.fighter_id] || 0) + 1;
      });

      // Build analytics array
      const analytics: FighterAnalytics[] = fighters.map((fighter) => {
        const views = viewCounts[fighter.id] || 0;
        const clicks = clickCounts[fighter.id] || 0;
        const ctr = views > 0 ? (clicks / views) * 100 : 0;

        return {
          fighter_id: fighter.id,
          fighter_name: fighter.full_name,
          handle: fighter.handle,
          views,
          clicks,
          ctr,
        };
      });

      // Sort by views (descending)
      return analytics.sort((a, b) => b.views - a.views);
    },
  });

  // Fetch top products by clicks
  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["analytics-products", dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();

      let clicksQuery = supabase
        .from("product_clicks")
        .select("product_id");

      if (dateFilter) {
        clicksQuery = clicksQuery.gte("clicked_at", dateFilter);
      }

      const { data: clicksData } = await clicksQuery;

      // Count clicks per product
      const clickCounts: Record<string, number> = {};
      clicksData?.forEach((c) => {
        clickCounts[c.product_id] = (clickCounts[c.product_id] || 0) + 1;
      });

      // Get product names for top products
      const topProductIds = Object.entries(clickCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topProductIds.length === 0) return [];

      const { data: products } = await supabase
        .from("products")
        .select("id, name, brand")
        .in("id", topProductIds);

      return topProductIds.map((id) => {
        const product = products?.find((p) => p.id === id);
        return {
          id,
          name: product?.name ?? "Unknown",
          brand: product?.brand ?? "",
          clicks: clickCounts[id],
        };
      });
    },
  });

  const statCards = [
    {
      title: "Total Views",
      value: overviewStats?.totalViews ?? 0,
      icon: Eye,
      description: "Storefront page views",
    },
    {
      title: "Total Clicks",
      value: overviewStats?.totalClicks ?? 0,
      icon: MousePointerClick,
      description: "Affiliate link clicks",
    },
    {
      title: "Overall CTR",
      value: `${overviewStats?.overallCtr ?? 0}%`,
      icon: TrendingUp,
      description: "Click-through rate",
    },
    {
      title: "Active Storefronts",
      value: overviewStats?.uniqueFighters ?? 0,
      icon: Users,
      description: "Fighters with activity",
    },
  ];

  return (
    <AdminLayout>
      <PageMeta title="Analytics" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track storefront views and affiliate link engagement.
            </p>
          </div>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fighter Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fighter Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fighter</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingFighters ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : fighterAnalytics && fighterAnalytics.length > 0 ? (
                      fighterAnalytics.slice(0, 10).map((fighter) => (
                        <TableRow key={fighter.fighter_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{fighter.fighter_name}</p>
                              <p className="text-xs text-muted-foreground">@{fighter.handle}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{fighter.views}</TableCell>
                          <TableCell className="text-right">{fighter.clicks}</TableCell>
                          <TableCell className="text-right">
                            {fighter.ctr.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No analytics data yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Products by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : topProducts && topProducts.length > 0 ? (
                      topProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.brand}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {product.clicks}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No product clicks yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
