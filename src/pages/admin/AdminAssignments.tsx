import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Package } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type FighterProduct = Database["public"]["Tables"]["fighter_products"]["Row"] & {
  products: Product;
};

export default function AdminAssignments() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<FighterProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Bulk assignment state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedFighters, setSelectedFighters] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [fightersRes, productsRes] = await Promise.all([
        supabase.from("fighters").select("*").eq("status", "approved").order("full_name"),
        supabase.from("products").select("*").eq("active", true).order("name"),
      ]);

      if (fightersRes.data) setFighters(fightersRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    }
    fetchData();
  }, []);

  async function fetchAssignments(fighterId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("fighter_products")
      .select("*, products(*)")
      .eq("fighter_id", fighterId)
      .order("order_index");

    if (error) {
      toast({ title: "Error loading assignments", description: error.message, variant: "destructive" });
    } else {
      setAssignments((data as FighterProduct[]) || []);
    }
    setLoading(false);
  }

  function handleFighterChange(fighterId: string) {
    setSelectedFighter(fighterId);
    fetchAssignments(fighterId);
  }

  async function addAssignment() {
    if (!selectedFighter || !selectedProduct) return;

    const maxOrder = assignments.length > 0 ? Math.max(...assignments.map((a) => a.order_index)) : -1;

    const { error } = await supabase.from("fighter_products").insert({
      fighter_id: selectedFighter,
      product_id: selectedProduct,
      order_index: maxOrder + 1,
    });

    if (error) {
      toast({ title: "Error adding product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product assigned" });
      setDialogOpen(false);
      setSelectedProduct("");
      fetchAssignments(selectedFighter);
    }
  }

  async function removeAssignment(assignmentId: string) {
    if (!confirm("Remove this product from the fighter's storefront?")) return;

    const { error } = await supabase.from("fighter_products").delete().eq("id", assignmentId);

    if (error) {
      toast({ title: "Error removing product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product removed" });
      if (selectedFighter) fetchAssignments(selectedFighter);
    }
  }

  async function updateOrderIndex(assignmentId: string, newIndex: number) {
    const { error } = await supabase
      .from("fighter_products")
      .update({ order_index: newIndex })
      .eq("id", assignmentId);

    if (error) {
      toast({ title: "Error updating order", description: error.message, variant: "destructive" });
    } else {
      if (selectedFighter) fetchAssignments(selectedFighter);
    }
  }

  // Bulk assignment functions
  function toggleFighter(fighterId: string) {
    setSelectedFighters((prev) => {
      const next = new Set(prev);
      if (next.has(fighterId)) {
        next.delete(fighterId);
      } else {
        next.add(fighterId);
      }
      return next;
    });
  }

  function toggleProduct(productId: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function selectAllFighters() {
    if (selectedFighters.size === fighters.length) {
      setSelectedFighters(new Set());
    } else {
      setSelectedFighters(new Set(fighters.map((f) => f.id)));
    }
  }

  function selectAllProducts() {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  }

  async function executeBulkAssignment() {
    if (selectedFighters.size === 0 || selectedProducts.size === 0) {
      toast({ title: "Please select at least one fighter and one product", variant: "destructive" });
      return;
    }

    setBulkLoading(true);

    try {
      // Get existing assignments for selected fighters
      const { data: existingAssignments, error: fetchError } = await supabase
        .from("fighter_products")
        .select("fighter_id, product_id")
        .in("fighter_id", Array.from(selectedFighters));

      if (fetchError) throw fetchError;

      // Create a set of existing assignments for quick lookup
      const existingSet = new Set(
        (existingAssignments || []).map((a) => `${a.fighter_id}-${a.product_id}`)
      );

      // Get current max order_index for each fighter
      const { data: maxOrders, error: maxError } = await supabase
        .from("fighter_products")
        .select("fighter_id, order_index")
        .in("fighter_id", Array.from(selectedFighters));

      if (maxError) throw maxError;

      const fighterMaxOrder: Record<string, number> = {};
      (maxOrders || []).forEach((row) => {
        if (!fighterMaxOrder[row.fighter_id] || row.order_index > fighterMaxOrder[row.fighter_id]) {
          fighterMaxOrder[row.fighter_id] = row.order_index;
        }
      });

      // Build insert records for new assignments only
      const inserts: { fighter_id: string; product_id: string; order_index: number }[] = [];

      selectedFighters.forEach((fighterId) => {
        let currentOrder = fighterMaxOrder[fighterId] ?? -1;
        selectedProducts.forEach((productId) => {
          const key = `${fighterId}-${productId}`;
          if (!existingSet.has(key)) {
            currentOrder++;
            inserts.push({
              fighter_id: fighterId,
              product_id: productId,
              order_index: currentOrder,
            });
          }
        });
      });

      if (inserts.length === 0) {
        toast({ title: "All selected products are already assigned to selected fighters" });
        setBulkLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("fighter_products").insert(inserts);

      if (insertError) throw insertError;

      toast({
        title: "Bulk assignment complete",
        description: `${inserts.length} product assignments created`,
      });

      // Reset selections and close dialog
      setSelectedFighters(new Set());
      setSelectedProducts(new Set());
      setBulkDialogOpen(false);

      // Refresh current fighter's assignments if viewing one
      if (selectedFighter) {
        fetchAssignments(selectedFighter);
      }
    } catch (error: any) {
      toast({ title: "Error during bulk assignment", description: error.message, variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  }

  const assignedProductIds = new Set(assignments.map((a) => a.product_id));
  const availableProducts = products.filter((p) => !assignedProductIds.has(p.id));

  return (
    <AdminLayout>
      <PageMeta title="Product Assignments - Admin" description="Admin panel for assigning products to fighter storefronts on Combat Market." noindex />
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl">Product Assignments</h1>
            <p className="text-muted-foreground">Assign products to fighter storefronts</p>
          </div>

          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Bulk Assign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Bulk Product Assignment</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 md:grid-cols-2 py-4">
                  {/* Fighters Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Fighters ({selectedFighters.size} selected)
                      </h3>
                      <Button variant="ghost" size="sm" onClick={selectAllFighters}>
                        {selectedFighters.size === fighters.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border border-border p-3">
                      {fighters.map((fighter) => (
                        <label
                          key={fighter.id}
                          className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                        >
                          <Checkbox
                            checked={selectedFighters.has(fighter.id)}
                            onCheckedChange={() => toggleFighter(fighter.id)}
                          />
                          <div className="flex items-center gap-2">
                            {fighter.profile_image_url && (
                              <img
                                src={fighter.profile_image_url}
                                alt={fighter.full_name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-sm">{fighter.full_name}</div>
                              <div className="text-xs text-muted-foreground">@{fighter.handle}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                      {fighters.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No approved fighters</p>
                      )}
                    </div>
                  </div>

                  {/* Products Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Products ({selectedProducts.size} selected)
                      </h3>
                      <Button variant="ghost" size="sm" onClick={selectAllProducts}>
                        {selectedProducts.size === products.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border border-border p-3">
                      {products.map((product) => (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                        >
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <div className="flex items-center gap-2">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.brand} • {product.price}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                      {products.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No active products</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {selectedFighters.size} fighters × {selectedProducts.size} products = up to{" "}
                  {selectedFighters.size * selectedProducts.size} assignments
                </p>
                <Button
                  onClick={executeBulkAssignment}
                  disabled={bulkLoading || selectedFighters.size === 0 || selectedProducts.size === 0}
                >
                  {bulkLoading ? "Assigning..." : "Assign Products"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedFighter || ""} onValueChange={handleFighterChange}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Select a fighter..." />
            </SelectTrigger>
            <SelectContent>
              {fighters.map((fighter) => (
                <SelectItem key={fighter.id} value={fighter.id}>
                  {fighter.full_name} (@{fighter.handle})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedFighter && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={availableProducts.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Product to Storefront</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addAssignment} disabled={!selectedProduct} className="w-full">
                    Add to Storefront
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {selectedFighter && (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No products assigned yet
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={assignment.order_index}
                          onChange={(e) => updateOrderIndex(assignment.id, parseInt(e.target.value) || 0)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {assignment.products.image_url && (
                            <img
                              src={assignment.products.image_url}
                              alt={assignment.products.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{assignment.products.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{assignment.products.brand}</TableCell>
                      <TableCell>{assignment.products.price}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!selectedFighter && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">Select a fighter to manage their product assignments</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
