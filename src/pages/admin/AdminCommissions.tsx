import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/PageMeta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Percent, Plus, Pencil, Trash2, Globe, User, Package } from "lucide-react";

interface CommissionRate {
  id: string;
  fighter_id: string | null;
  product_id: string | null;
  rate_percentage: number;
  created_at: string;
  updated_at: string;
  fighter?: { full_name: string; handle: string } | null;
  product?: { name: string; brand: string } | null;
}

interface Fighter {
  id: string;
  full_name: string;
  handle: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
}

export default function AdminCommissions() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null);
  const [formData, setFormData] = useState({
    fighter_id: "",
    product_id: "",
    rate_percentage: "",
  });

  // Fetch commission rates
  const { data: rates, isLoading } = useQuery({
    queryKey: ["commission-rates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commission_rates")
        .select(`
          *,
          fighter:fighters(full_name, handle),
          product:products(name, brand)
        `)
        .order("fighter_id", { ascending: true, nullsFirst: true })
        .order("product_id", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data as CommissionRate[];
    },
  });

  // Fetch fighters for dropdown
  const { data: fighters } = useQuery({
    queryKey: ["fighters-for-commission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fighters")
        .select("id, full_name, handle")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      return data as Fighter[];
    },
  });

  // Fetch products for dropdown
  const { data: products } = useQuery({
    queryKey: ["products-for-commission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; fighter_id: string | null; product_id: string | null; rate_percentage: number }) => {
      if (data.id) {
        // Update existing
        const { error } = await (supabase as any)
          .from("commission_rates")
          .update({
            fighter_id: data.fighter_id,
            product_id: data.product_id,
            rate_percentage: data.rate_percentage,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await (supabase as any)
          .from("commission_rates")
          .insert({
            fighter_id: data.fighter_id,
            product_id: data.product_id,
            rate_percentage: data.rate_percentage,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rates"] });
      toast({ title: editingRate ? "Rate updated" : "Rate created" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error saving rate", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("commission_rates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rates"] });
      toast({ title: "Rate deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting rate", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (rate: CommissionRate) => {
    setEditingRate(rate);
    setFormData({
      fighter_id: rate.fighter_id || "",
      product_id: rate.product_id || "",
      rate_percentage: String(rate.rate_percentage),
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRate(null);
    setFormData({ fighter_id: "", product_id: "", rate_percentage: "" });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRate(null);
    setFormData({ fighter_id: "", product_id: "", rate_percentage: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(formData.rate_percentage);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Invalid rate", description: "Rate must be between 0 and 100", variant: "destructive" });
      return;
    }

    saveMutation.mutate({
      id: editingRate?.id,
      fighter_id: formData.fighter_id || null,
      product_id: formData.product_id || null,
      rate_percentage: rate,
    });
  };

  const getRateTypeIcon = (rate: CommissionRate) => {
    if (!rate.fighter_id && !rate.product_id) return <Globe className="h-4 w-4 text-blue-500" />;
    if (rate.fighter_id && rate.product_id) return <Package className="h-4 w-4 text-purple-500" />;
    if (rate.fighter_id) return <User className="h-4 w-4 text-green-500" />;
    return <Package className="h-4 w-4 text-orange-500" />;
  };

  const getRateTypeLabel = (rate: CommissionRate) => {
    if (!rate.fighter_id && !rate.product_id) return "Global Default";
    if (rate.fighter_id && rate.product_id) return "Fighter + Product";
    if (rate.fighter_id) return "Fighter Default";
    return "Product Default";
  };

  // Find global default rate
  const globalRate = rates?.find((r) => !r.fighter_id && !r.product_id);

  return (
    <AdminLayout>
      <PageMeta title="Commission Rates | Admin" noindex />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Commission Rates</h1>
            <p className="text-muted-foreground">Manage fighter commission percentages</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingRate ? "Edit Commission Rate" : "New Commission Rate"}</DialogTitle>
                  <DialogDescription>
                    Set the fighter's share of the network commission. Leave fighter/product empty for defaults.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Fighter (optional)</Label>
                    <Select
                      value={formData.fighter_id}
                      onValueChange={(value) => setFormData({ ...formData, fighter_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All fighters (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All fighters (default)</SelectItem>
                        {fighters?.map((fighter) => (
                          <SelectItem key={fighter.id} value={fighter.id}>
                            {fighter.full_name} (@{fighter.handle})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product (optional)</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All products (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All products (default)</SelectItem>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.brand})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Commission Rate (%)</Label>
                    <div className="relative">
                      <Input
                        id="rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.rate_percentage}
                        onChange={(e) => setFormData({ ...formData, rate_percentage: e.target.value })}
                        placeholder="50"
                        className="pr-8"
                        required
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fighter receives this percentage of the network commission
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Priority Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rate Priority</CardTitle>
            <CardDescription>
              When calculating commissions, the most specific rate applies:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                <span><strong>1. Fighter + Product specific</strong> - Rate for a specific fighter selling a specific product</span>
              </li>
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                <span><strong>2. Fighter default</strong> - Rate for a fighter across all products</span>
              </li>
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" />
                <span><strong>3. Product default</strong> - Rate for a product across all fighters</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span><strong>4. Global default</strong> - Fallback rate for all sales (currently {globalRate?.rate_percentage || 50}%)</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Rates Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Fighter</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rates?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No commission rates configured. Add a global default rate to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  rates?.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRateTypeIcon(rate)}
                          <span className="text-sm">{getRateTypeLabel(rate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rate.fighter ? (
                          <div>
                            <div className="font-medium">{rate.fighter.full_name}</div>
                            <div className="text-sm text-muted-foreground">@{rate.fighter.handle}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">All fighters</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rate.product ? (
                          <div>
                            <div className="font-medium">{rate.product.name}</div>
                            <div className="text-sm text-muted-foreground">{rate.product.brand}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">All products</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xl font-bold">{rate.rate_percentage}%</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(rate.updated_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(rate)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Don't allow deleting global default if it's the only one */}
                          {!(rates.length === 1 && !rate.fighter_id && !rate.product_id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(rate.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
