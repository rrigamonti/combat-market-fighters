import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Clock, XCircle, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductRequest {
  id: string;
  product_name: string;
  product_url: string | null;
  brand_name: string | null;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface ProductRequestSectionProps {
  fighterId: string;
}

export function ProductRequestSection({ fighterId }: ProductRequestSectionProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    product_url: "",
    brand_name: "",
    reason: "",
  });

  useEffect(() => {
    fetchRequests();
  }, [fighterId]);

  const fetchRequests = async () => {
    // Cast needed until types regenerate after migration
    const { data, error } = await (supabase
      .from("product_requests" as any)
      .select("*")
      .eq("fighter_id", fighterId)
      .order("created_at", { ascending: false })
      .limit(10) as any);

    setLoading(false);

    if (error) {
      console.error("Error fetching product requests:", error);
      return;
    }

    setRequests((data as ProductRequest[]) || []);
  };

  const handleSubmit = async () => {
    if (!formData.product_name.trim()) {
      toast({
        variant: "destructive",
        title: "Product name required",
        description: "Please enter the name of the product you'd like to promote.",
      });
      return;
    }

    // Validate URL if provided
    if (formData.product_url.trim()) {
      try {
        new URL(formData.product_url);
      } catch {
        toast({
          variant: "destructive",
          title: "Invalid URL",
          description: "Please enter a valid product URL.",
        });
        return;
      }
    }

    setSubmitting(true);

    // Cast needed until types regenerate after migration
    const { error } = await (supabase.from("product_requests" as any) as any).insert({
      fighter_id: fighterId,
      product_name: formData.product_name.trim(),
      product_url: formData.product_url.trim() || null,
      brand_name: formData.brand_name.trim() || null,
      reason: formData.reason.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit product request. Please try again.",
      });
      return;
    }

    toast({
      title: "Request Submitted",
      description: "We'll review your product request and get back to you soon.",
    });

    setFormData({ product_name: "", product_url: "", brand_name: "", reason: "" });
    setDialogOpen(false);
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="mr-1 h-3 w-3" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl">Request a Product</h2>
            <p className="text-sm text-muted-foreground">
              Want to promote a product that's not in our catalog?
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Product</DialogTitle>
              <DialogDescription>
                Submit a product you'd like to promote on your storefront. We'll
                review it and add it to the catalog if approved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product_name"
                  placeholder="e.g., Hayabusa T3 Boxing Gloves"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_url">Product URL (optional)</Label>
                <Input
                  id="product_url"
                  placeholder="https://..."
                  value={formData.product_url}
                  onChange={(e) =>
                    setFormData({ ...formData, product_url: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Link to where the product can be purchased
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand (optional)</Label>
                <Input
                  id="brand_name"
                  placeholder="e.g., Hayabusa"
                  value={formData.brand_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_name: e.target.value })
                  }
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Why do you want to promote this? (optional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Tell us why this product would be a great fit for your storefront..."
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.reason.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Request History */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No product requests yet. Click "New Request" to suggest a product.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Your Recent Requests
            </p>
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{request.product_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {request.brand_name && (
                      <span className="text-xs text-muted-foreground">
                        {request.brand_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {request.status === "rejected" && request.admin_notes && (
                    <p className="mt-2 text-xs text-red-400">
                      Note: {request.admin_notes}
                    </p>
                  )}
                </div>
                <div className="ml-4 shrink-0">{getStatusBadge(request.status)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
