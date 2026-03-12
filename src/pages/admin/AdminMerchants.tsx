import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageMeta } from "@/components/PageMeta";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Globe, Pencil, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Merchant {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  currency: string | null;
  status: "pending" | "active" | "suspended";
  created_at: string;
}

export default function AdminMerchants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [form, setForm] = useState({ name: "", description: "", website: "", currency: "USD" });

  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Merchant[];
    },
  });

  // Fetch wallet balances for all merchants
  const { data: walletBalances = {} } = useQuery({
    queryKey: ["admin-merchant-balances", merchants.map((m) => m.id)],
    enabled: merchants.length > 0,
    queryFn: async () => {
      const results: Record<string, { available: number; reserved: number; total: number }> = {};
      await Promise.all(
        merchants.map(async (m) => {
          const { data } = await supabase.rpc("get_merchant_balance", { _merchant_id: m.id });
          if (data && data.length > 0) {
            results[m.id] = {
              available: Number(data[0].available_balance),
              reserved: Number(data[0].reserved_balance),
              total: Number(data[0].total_balance),
            };
          } else {
            results[m.id] = { available: 0, reserved: 0, total: 0 };
          }
        })
      );
      return results;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("merchants").insert({
        name: values.name,
        description: values.description || null,
        website: values.website || null,
        currency: values.currency,
        status: "active" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setDialogOpen(false);
      setForm({ name: "", description: "", website: "", currency: "USD" });
      toast({ title: "Merchant created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Partial<Merchant>) => {
      const { error } = await supabase.from("merchants").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setEditingMerchant(null);
      setDialogOpen(false);
      toast({ title: "Merchant updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleStatusChange = (merchant: Merchant, status: string) => {
    updateMutation.mutate({ id: merchant.id, status: status as any });
  };

  const openCreate = () => {
    setEditingMerchant(null);
    setForm({ name: "", description: "", website: "", currency: "USD" });
    setDialogOpen(true);
  };

  const openEdit = (m: Merchant) => {
    setEditingMerchant(m);
    setForm({ name: m.name, description: m.description || "", website: m.website || "", currency: m.currency || "USD" });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMerchant) {
      updateMutation.mutate({ id: editingMerchant.id, name: form.name, description: form.description || null, website: form.website || null, currency: form.currency });
    } else {
      createMutation.mutate(form);
    }
  };

  const getWalletLight = (merchantId: string) => {
    const bal = walletBalances[merchantId];
    if (!bal) return { color: "bg-muted", label: "N/A", amount: 0 };
    const available = bal.available;
    const total = bal.total;
    if (total === 0 && available === 0) return { color: "bg-red-500", label: "Empty", amount: available };
    if (available <= 0) return { color: "bg-red-500", label: "Empty", amount: available };
    if (total > 0 && available / total <= 0.25) return { color: "bg-amber-500", label: "Low", amount: available };
    return { color: "bg-emerald-500", label: "Funded", amount: available };
  };

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "suspended") return "destructive";
    return "secondary";
  };

  return (
    <AdminLayout>
      <PageMeta title="Merchants | Admin" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Merchants</h1>
            <p className="text-muted-foreground">Manage brand partners and their accounts</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Merchant
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : merchants.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No merchants yet</TableCell></TableRow>
                ) : merchants.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No merchants yet</TableCell></TableRow>
                ) : (
                  merchants.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {m.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const light = getWalletLight(m.id);
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block h-3 w-3 rounded-full ${light.color} shadow-sm`} />
                                  <span className="text-sm font-medium">
                                    ${light.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{light.label}</p>
                                <p className="text-xs text-muted-foreground">Available: ${light.amount.toFixed(2)}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                      <TableCell>
                        {m.website ? (
                          <a href={m.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Globe className="h-3 w-3" /> {new URL(m.website).hostname}
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{m.currency || "USD"}</TableCell>
                      <TableCell>
                        <Select value={m.status} onValueChange={(v) => handleStatusChange(m, v)}>
                          <SelectTrigger className="w-[120px] h-8">
                            <Badge variant={statusColor(m.status)}>{m.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(m.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMerchant ? "Edit Merchant" : "Add Merchant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingMerchant ? "Update" : "Create"} Merchant
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
