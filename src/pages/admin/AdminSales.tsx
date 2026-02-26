import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Eye, Search } from "lucide-react";

type SaleStatus = "pending" | "confirmed" | "paid" | "cancelled";

interface Sale {
  id: string;
  fighter_id: string;
  product_id: string | null;
  external_order_id: string | null;
  sale_amount: number;
  currency: string;
  network_commission: number;
  fighter_commission: number;
  commission_rate_used: number;
  status: SaleStatus;
  affiliate_network: string | null;
  raw_payload: Record<string, unknown> | null;
  sale_date: string | null;
  created_at: string;
  fighter?: { full_name: string; handle: string };
  product?: { name: string; brand: string } | null;
}

const statusConfig: Record<SaleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: "Confirmed", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  paid: { label: "Paid", variant: "outline", icon: <DollarSign className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export default function AdminSales() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Fetch sales with fighter and product data
  const { data: sales, isLoading } = useQuery({
    queryKey: ["admin-sales", statusFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("sales")
        .select(`
          *,
          fighter:fighters(full_name, handle),
          product:products(name, brand)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sale[];
    },
  });

  // Update sale status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ saleId, newStatus }: { saleId: string; newStatus: SaleStatus }) => {
      const { error } = await (supabase as any)
        .from("sales")
        .update({ status: newStatus })
        .eq("id", saleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      toast({ title: "Sale status updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  // Calculate totals
  const totals = sales?.reduce(
    (acc, sale) => {
      if (sale.status !== "cancelled") {
        acc.totalSales += Number(sale.sale_amount);
        acc.totalNetworkCommission += Number(sale.network_commission);
        acc.totalFighterCommission += Number(sale.fighter_commission);
      }
      if (sale.status === "pending") acc.pendingCount++;
      if (sale.status === "confirmed") acc.confirmedCount++;
      return acc;
    },
    { totalSales: 0, totalNetworkCommission: 0, totalFighterCommission: 0, pendingCount: 0, confirmedCount: 0 }
  ) || { totalSales: 0, totalNetworkCommission: 0, totalFighterCommission: 0, pendingCount: 0, confirmedCount: 0 };

  // Filter sales by search term
  const filteredSales = sales?.filter((sale) => {
    if (networkFilter !== "all" && sale.affiliate_network !== networkFilter) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sale.fighter?.full_name?.toLowerCase().includes(search) ||
      sale.fighter?.handle?.toLowerCase().includes(search) ||
      sale.product?.name?.toLowerCase().includes(search) ||
      sale.external_order_id?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <PageMeta title="Sales | Admin" noindex />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales & Commissions</h1>
          <p className="text-muted-foreground">Track affiliate sales and fighter commissions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">${totals.totalSales.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Network Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">${totals.totalNetworkCommission.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fighter Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold text-primary">${totals.totalFighterCommission.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totals.pendingCount}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by fighter, product, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Networks</SelectItem>
              <SelectItem value="Sovrn">Sovrn</SelectItem>
              <SelectItem value="FMTC">FMTC</SelectItem>
              <SelectItem value="awin">Awin</SelectItem>
              <SelectItem value="rakuten">Rakuten</SelectItem>
              <SelectItem value="impact">Impact</SelectItem>
              <SelectItem value="cj">CJ Affiliate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fighter</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="text-right">Sale</TableHead>
                  <TableHead className="text-right">Fighter Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredSales?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap">
                        {sale.sale_date
                          ? format(new Date(sale.sale_date), "MMM d, yyyy")
                          : format(new Date(sale.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.fighter?.full_name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">@{sale.fighter?.handle}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.product ? (
                          <div>
                            <div className="font-medium">{sale.product.name}</div>
                            <div className="text-sm text-muted-foreground">{sale.product.brand}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {sale.external_order_id || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(sale.sale_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        ${Number(sale.fighter_commission).toFixed(2)}
                        <div className="text-xs text-muted-foreground">
                          ({sale.commission_rate_used}%)
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sale.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ saleId: sale.id, newStatus: value as SaleStatus })
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge variant={statusConfig[sale.status].variant} className="gap-1">
                              {statusConfig[sale.status].icon}
                              {statusConfig[sale.status].label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([status, config]) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  {config.icon}
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sale Details Dialog */}
        <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>
                Order ID: {selectedSale?.external_order_id || "N/A"}
              </DialogDescription>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fighter</label>
                    <p className="font-medium">{selectedSale.fighter?.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{selectedSale.fighter?.handle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product</label>
                    <p className="font-medium">{selectedSale.product?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{selectedSale.product?.brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sale Amount</label>
                    <p className="text-xl font-bold">${Number(selectedSale.sale_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Currency</label>
                    <p className="font-medium">{selectedSale.currency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Network Commission</label>
                    <p className="font-medium">${Number(selectedSale.network_commission).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fighter Commission</label>
                    <p className="text-xl font-bold text-primary">
                      ${Number(selectedSale.fighter_commission).toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        ({selectedSale.commission_rate_used}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Affiliate Network</label>
                    <p className="font-medium">{selectedSale.affiliate_network || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sale Date</label>
                    <p className="font-medium">
                      {selectedSale.sale_date
                        ? format(new Date(selectedSale.sale_date), "PPpp")
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {selectedSale.raw_payload && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Raw Webhook Payload</label>
                    <pre className="mt-1 rounded bg-muted p-3 text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedSale.raw_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
