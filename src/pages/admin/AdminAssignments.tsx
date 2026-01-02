import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
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

  const assignedProductIds = new Set(assignments.map((a) => a.product_id));
  const availableProducts = products.filter((p) => !assignedProductIds.has(p.id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Product Assignments</h1>
          <p className="text-muted-foreground">Assign products to fighter storefronts</p>
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
