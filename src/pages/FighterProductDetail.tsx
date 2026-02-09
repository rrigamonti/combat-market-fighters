import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { ProductSchema } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getCanonicalUrl } from "@/lib/config";
import { getSovrnAffiliateUrl } from "@/lib/affiliate";
import type { Database } from "@/integrations/supabase/types";

type Fighter = Database["public"]["Tables"]["fighters"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];

export default function FighterProductDetail() {
  const { handle, productSlug } = useParams<{ handle: string; productSlug: string }>();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [affiliateUrl, setAffiliateUrl] = useState<string>("");
  const { trackProductClick } = useAnalytics();

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

      // Fetch brand if product has brand_id
      if (productData.brand_id) {
        const { data: brandData } = await supabase
          .from("brands")
          .select("*")
          .eq("id", productData.brand_id)
          .maybeSingle();
        
        if (brandData) {
          setBrand(brandData);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [handle, productSlug]);

  // Fetch Sovrn affiliate URL when product and fighter are loaded
  useEffect(() => {
    if (product?.external_url && fighter?.handle) {
      getSovrnAffiliateUrl(product.external_url, fighter.handle).then(setAffiliateUrl);
    } else if (product?.external_url) {
      setAffiliateUrl(product.external_url);
    }
  }, [product?.external_url, fighter?.handle]);

  const handleBuyClick = () => {
    if (fighter && product) {
      trackProductClick(fighter.id, product.id);
    }
  };

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
      <PageMeta 
        title={`${product.name} - ${fighter.full_name}'s Pick`} 
        description={product.short_description || `${product.name} recommended by ${fighter.full_name}. Shop on Combat Market.`}
        image={product.image_url || undefined}
      />
      <ProductSchema
        name={product.name}
        description={product.short_description || undefined}
        image={product.image_url || undefined}
        brand={brand?.name || product.brand}
        price={product.price}
        url={getCanonicalUrl(`/${handle}/${product.slug}`)}
      />
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
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            {product.discount_percentage && product.discount_percentage > 0 && (
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                <span>🔥</span>
                <span>{product.discount_percentage}% OFF</span>
              </div>
            )}
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
              <div className="flex items-center gap-3">
                {brand?.logo_url && (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-8 w-8 rounded-full object-contain"
                  />
                )}
                <p className="text-sm font-medium uppercase tracking-wider text-primary">
                  {brand?.name || product.brand}
                </p>
              </div>
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
              onClick={handleBuyClick}
            >
              <a
                href={affiliateUrl || product.external_url}
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
