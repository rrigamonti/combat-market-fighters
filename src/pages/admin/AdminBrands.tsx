import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

const emptyBrand = {
  name: "",
  logo_url: "",
};

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand>>(emptyBrand);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchBrands() {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error loading brands", description: error.message, variant: "destructive" });
    } else {
      setBrands(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBrands();
  }, []);

  function openNewDialog() {
    setEditingBrand(emptyBrand);
    setIsEditing(false);
    setDialogOpen(true);
  }

  function openEditDialog(brand: Brand) {
    setEditingBrand(brand);
    setIsEditing(true);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editingBrand.name?.trim()) {
      toast({ title: "Missing fields", description: "Brand name is required", variant: "destructive" });
      return;
    }

    setSaving(true);

    if (isEditing && editingBrand.id) {
      const { error } = await supabase
        .from("brands")
        .update({
          name: editingBrand.name,
          logo_url: editingBrand.logo_url || null,
        })
        .eq("id", editingBrand.id);

      if (error) {
        toast({ title: "Error updating brand", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Brand updated" });
        setDialogOpen(false);
        fetchBrands();
      }
    } else {
      const { error } = await supabase.from("brands").insert({
        name: editingBrand.name,
        logo_url: editingBrand.logo_url || null,
      });

      if (error) {
        toast({ title: "Error creating brand", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Brand created" });
        setDialogOpen(false);
        fetchBrands();
      }
    }

    setSaving(false);
  }

  async function handleDelete(brandId: string) {
    // Check if brand is in use
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);

    if (count && count > 0) {
      toast({
        title: "Cannot delete",
        description: `This brand is used by ${count} product(s). Remove the brand from those products first.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this brand?")) return;

    const { error } = await supabase.from("brands").delete().eq("id", brandId);

    if (error) {
      toast({ title: "Error deleting brand", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Brand deleted" });
      fetchBrands();
    }
  }

  return (
    <AdminLayout>
      <PageMeta title="Manage Brands - Admin" description="Admin panel for managing brands on Combat Market." />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">Brands</h1>
            <p className="text-muted-foreground">Manage product brands and their logos</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Brand" : "Add Brand"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={editingBrand.name || ""}
                    onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                    placeholder="e.g., Nike, Venum, Hayabusa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={editingBrand.logo_url || ""}
                    onChange={(e) => setEditingBrand({ ...editingBrand, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  {editingBrand.logo_url && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <img
                        src={editingBrand.logo_url}
                        alt="Logo preview"
                        className="h-12 w-auto rounded border border-border bg-white p-1"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : isEditing ? "Update Brand" : "Create Brand"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No brands yet
                  </TableCell>
                </TableRow>
              ) : (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-8 w-auto rounded bg-white p-0.5"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                          {brand.name[0]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(brand)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(brand.id)}
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
