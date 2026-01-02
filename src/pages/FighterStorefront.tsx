import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MapPin, Dumbbell } from "lucide-react";
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

      // Fetch fighter by handle
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

      // Only fetch products if fighter is approved
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

      {/* Fighter Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/10 via-transparent to-transparent pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Fighter Avatar */}
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary bg-card">
              {fighter?.profile_image_url ? (
                <img 
                  src={fighter.profile_image_url} 
                  alt={fighter.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-display text-primary">
                  {fighter?.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
            </div>

            <h1 className="mt-6 font-display text-4xl md:text-5xl">{fighter?.full_name}</h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Dumbbell className="h-4 w-4 text-primary" />
                {fighter?.sport}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary" />
                {fighter?.country}
              </span>
            </div>

            {fighter?.short_bio && (
              <p className="mt-6 max-w-2xl text-muted-foreground">{fighter.short_bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-display text-3xl">My Recommendations</h2>

          {products.length === 0 ? (
            <p className="text-center text-muted-foreground">No products available yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(({ products: product }) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-primary">{product.brand}</p>
                    <h3 className="mt-1 font-semibold">{product.name}</h3>
                    <p className="mt-1 text-lg font-bold">{product.price}</p>
                    {product.short_description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {product.short_description}
                      </p>
                    )}
                    <Button asChild className="mt-4 w-full">
                      <Link to={`/p/${product.slug}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Affiliate Disclosure */}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Some links on this page are affiliate links. If you make a purchase, Combat Market may earn a commission at no extra cost to you.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
