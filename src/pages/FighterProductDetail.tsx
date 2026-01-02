import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

export default function FighterProductDetail() {
  const { handle, productSlug } = useParams<{ handle: string; productSlug: string }>();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!handle || !productSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch fighter by handle
      const { data: fighterData } = await supabase
        .from("fighters")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (!fighterData || fighterData.status !== "approved") {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setFighter(fighterData);

      // Fetch product by slug
      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("slug", productSlug)
        .eq("active", true)
        .maybeSingle();

      if (!productData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(productData);
      setLoading(false);
    }

    fetchData();
  }, [handle, productSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !product || !fighter) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="font-display text-4xl text-primary">Product Not Found</h1>
          <p className="mt-4 text-muted-foreground">This product doesn't exist or is no longer available.</p>
          <Button asChild className="mt-8">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Button - Links to Fighter's Shop */}
        <Button
          variant="ghost"
          className="mb-8 gap-2"
          asChild
        >
          <Link to={`/${handle}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {fighter.full_name}'s Shop
          </Link>
        </Button>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {product.brand}
              </p>
              <h1 className="mt-2 font-display text-3xl md:text-4xl">
                {product.name}
              </h1>
              <p className="mt-4 text-3xl font-bold">{product.price}</p>
            </div>

            {product.short_description && (
              <p className="text-lg text-muted-foreground">
                {product.short_description}
              </p>
            )}

            {/* CTA Button */}
            <Button
              asChild
              size="lg"
              className="w-full gap-2 text-lg"
            >
              <a
                href={product.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy Now
                <ExternalLink className="h-5 w-5" />
              </a>
            </Button>

            {/* Affiliate Caption */}
            <p className="text-center text-sm text-muted-foreground">
              You'll complete your purchase on the brand's website. This is an affiliate link.
            </p>

            {/* Long Description */}
            {product.long_description && (
              <div className="border-t border-border pt-6">
                <h3 className="mb-4 font-display text-xl">About This Product</h3>
                <div className="space-y-3 text-muted-foreground">
                  {product.long_description.split("\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {product.category && (
              <div className="border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  Category:{" "}
                  <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                    {product.category}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
