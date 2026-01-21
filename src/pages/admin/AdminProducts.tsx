import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  brand_id: string | null;
  price: string;
  slug: string;
  category: string | null;
  image_url: string | null;
  short_description: string | null;
  long_description: string | null;
  external_url: string;
  active: boolean;
  discount_percentage: number | null;
  created_at: string;
  updated_at: string;
}

interface ProductForm {
  name: string;
  brand: string;
  brand_id: string | null;
  price: string;
  slug: string;
  category: string | null;
  image_url: string | null;
  short_description: string | null;
  long_description: string | null;
  external_url: string;
  active: boolean;
  discount_percentage: number | null;
}

const emptyProduct: ProductForm = {
  name: "",
  brand: "",
  brand_id: null,
  price: "",
  slug: "",
  category: "",
  image_url: "",
  short_description: "",
  long_description: "",
  external_url: "",
  active: true,
  discount_percentage: null,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductForm & { id?: string }>(emptyProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading products", description: error.message, variant: "destructive" });
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }

  async function fetchBrands() {
    const { data } = await supabase
      .from("brands")
      .select("id, name, logo_url")
      .order("name");
    
    if (data) {
      setBrands(data);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, []);

  function openNewDialog() {
    setEditingProduct(emptyProduct);
    setIsEditing(false);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct({
      id: product.id,
      name: product.name,
      brand: product.brand,
      brand_id: product.brand_id,
      price: product.price,
      slug: product.slug,
      category: product.category,
      image_url: product.image_url,
      short_description: product.short_description,
      long_description: product.long_description,
      external_url: product.external_url,
      active: product.active,
      discount_percentage: product.discount_percentage,
    });
    setIsEditing(true);
    setDialogOpen(true);
  }

  // When brand is selected from dropdown, update both brand_id and brand name
  function handleBrandChange(brandId: string) {
    const selectedBrand = brands.find(b => b.id === brandId);
    setEditingProduct({
      ...editingProduct,
      brand_id: brandId,
      brand: selectedBrand?.name || editingProduct.brand,
    });
  }

  async function handleSave() {
    if (!editingProduct.name || !editingProduct.brand || !editingProduct.price || !editingProduct.slug || !editingProduct.external_url) {
      toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate discount percentage
    if (editingProduct.discount_percentage !== null) {
      if (editingProduct.discount_percentage < 0 || editingProduct.discount_percentage > 100) {
        toast({ title: "Invalid discount", description: "Discount must be between 0 and 100", variant: "destructive" });
        return;
      }
    }

    setSaving(true);

    const productData = {
      name: editingProduct.name,
      brand: editingProduct.brand,
      brand_id: editingProduct.brand_id,
      price: editingProduct.price,
      slug: editingProduct.slug,
      category: editingProduct.category || null,
      image_url: editingProduct.image_url || null,
      short_description: editingProduct.short_description || null,
      long_description: editingProduct.long_description || null,
      external_url: editingProduct.external_url,
      active: editingProduct.active ?? true,
      discount_percentage: editingProduct.discount_percentage,
    };

    if (isEditing && editingProduct.id) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast({ title: "Error updating product", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Product updated" });
        setDialogOpen(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").insert(productData);

      if (error) {
        toast({ title: "Error creating product", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Product created" });
        setDialogOpen(false);
        fetchProducts();
      }
    }

    setSaving(false);
  }

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      fetchProducts();
    }
  }

  // Get brand logo for display
  function getBrandLogo(brandId: string | null): string | null {
    if (!brandId) return null;
    const brand = brands.find(b => b.id === brandId);
    return brand?.logo_url || null;
  }

  return (
    <AdminLayout>
      <PageMeta title="Manage Products - Admin" description="Admin panel for managing affiliate products on Combat Market." noindex />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">Products</h1>
            <p className="text-muted-foreground">Manage affiliate products</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={editingProduct.name || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    {brands.length > 0 ? (
                      <Select
                        value={editingProduct.brand_id || ""}
                        onValueChange={handleBrandChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              <div className="flex items-center gap-2">
                                {brand.logo_url && (
                                  <img src={brand.logo_url} alt="" className="h-4 w-4 object-contain" />
                                )}
                                {brand.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={editingProduct.brand || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        placeholder="Enter brand name"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {brands.length === 0 ? "Add brands in the Brands section to use dropdown" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      placeholder="$99.99"
                      value={editingProduct.price || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount %</Label>
                    <div className="relative">
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={editingProduct.discount_percentage ?? ""}
                        onChange={(e) => setEditingProduct({ 
                          ...editingProduct, 
                          discount_percentage: e.target.value ? parseInt(e.target.value) : null 
                        })}
                      />
                      <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Leave empty for no discount</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="product-slug"
                      value={editingProduct.slug || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={editingProduct.category || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={editingProduct.image_url || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_url">External URL *</Label>
                  <Input
                    id="external_url"
                    placeholder="https://..."
                    value={editingProduct.external_url || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, external_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    rows={2}
                    value={editingProduct.short_description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long_description">Long Description</Label>
                  <Textarea
                    id="long_description"
                    rows={4}
                    value={editingProduct.long_description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, long_description: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={editingProduct.active ?? true}
                    onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No products yet
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getBrandLogo(product.brand_id) && (
                          <img
                            src={getBrandLogo(product.brand_id)!}
                            alt=""
                            className="h-5 w-5 object-contain"
                          />
                        )}
                        {product.brand}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category || "—"}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>
                      {product.discount_percentage ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          -{product.discount_percentage}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
