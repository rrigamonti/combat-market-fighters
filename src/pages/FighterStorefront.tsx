import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

interface FighterProductWithProduct {
  id: string;
  order_index: number;
  products: Product;
}

export default function FighterStorefront() {
  const { handle } = useParams<{ handle: string }>();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [products, setProducts] = useState<FighterProductWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchStorefront() {
      if (!handle) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: fighterData, error: fighterError } = await supabase
        .from("fighters")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (fighterError || !fighterData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setFighter(fighterData);

      if (fighterData.status === "approved") {
        const { data: productsData } = await supabase
          .from("fighter_products")
          .select("id, order_index, products(*)")
          .eq("fighter_id", fighterData.id)
          .order("order_index");

        if (productsData) {
          setProducts(productsData as FighterProductWithProduct[]);
        }
      }

      setLoading(false);
    }

    fetchStorefront();
  }, [handle]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: fighter?.full_name, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="font-display text-4xl text-primary">Fighter Not Found</h1>
          <p className="mt-4 text-muted-foreground">This storefront doesn't exist.</p>
          <Button asChild className="mt-8">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (fighter && fighter.status !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="font-display text-4xl text-primary">Storefront Not Available</h1>
          <p className="mt-4 text-muted-foreground">This fighter's storefront is not currently active.</p>
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

      {/* Fighter Hero - Faves.xyz Style */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Fighter Photo - Rectangular */}
            <div className="h-40 w-40 overflow-hidden rounded-2xl border-2 border-border bg-card shadow-lg">
              {fighter?.profile_image_url ? (
                <img 
                  src={fighter.profile_image_url} 
                  alt={fighter.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-display text-primary">
                  {fighter?.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
            </div>

            {/* Fighter Name */}
            <h1 className="mt-6 font-display text-3xl uppercase tracking-wide md:text-4xl">
              {fighter?.full_name}
            </h1>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {fighter?.sport}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {fighter?.country}
              </span>
            </div>

            {/* Bio */}
            {fighter?.short_bio && (
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                {fighter.short_bio}
              </p>
            )}

            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </section>

      {/* Products Grid - Faves.xyz Style */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground">No products available yet.</p>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map(({ products: product }) => (
                <Link
                  key={product.id}
                  to={`/${handle}/${product.slug}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Product Image */}
                  <div className="aspect-square overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {product.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Affiliate Disclosure - Subtle */}
          <p className="mt-12 text-center text-xs text-muted-foreground/70">
            Links may be affiliate links. Purchases support this fighter.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
