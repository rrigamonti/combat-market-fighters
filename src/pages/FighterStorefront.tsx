import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { PersonSchema } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCanonicalUrl } from "@/lib/config";
import defaultHeroImage from "@/assets/demo-hero-marcus.jpg";
import tapologyIcon from "@/assets/social/tapology-icon.png";

interface Fighter {
  id: string;
  handle: string;
  full_name: string;
  sport: string;
  country: string;
  short_bio: string | null;
  profile_image_url: string | null;
  hero_image_url: string | null;
  status: string;
  social_instagram: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  social_facebook: string | null;
  social_snapchat: string | null;
  social_tapology?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: string;
  slug: string;
  image_url: string | null;
  brand: string;
  brand_id: string | null;
  discount_percentage: number | null;
}

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

interface FighterProductWithProduct {
  id: string;
  order_index: number;
  products: Product;
}

// Colorful social media icons
const SocialIcons = {
  instagram: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    </div>
  ),
  twitter: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </div>
  ),
  youtube: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    </div>
  ),
  tiktok: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    </div>
  ),
  facebook: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </div>
  ),
  snapchat: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFC00]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.135-.052-.21-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
      </svg>
    </div>
  ),
  tapology: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
      <img src={tapologyIcon} alt="Tapology" className="h-full w-full object-cover" />
    </div>
  ),
};

export default function FighterStorefront() {
  const { handle } = useParams<{ handle: string }>();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [products, setProducts] = useState<FighterProductWithProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { trackStorefrontView } = useAnalytics();

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

      setFighter(fighterData as Fighter);

      // Track storefront view for approved fighters
      if (fighterData.status === "approved") {
        trackStorefrontView(fighterData.id);

        // Fetch brands for logo display
        const { data: brandsData } = await supabase
          .from("brands")
          .select("id, name, logo_url");
        
        if (brandsData) {
          setBrands(brandsData);
        }

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
  }, [handle, trackStorefrontView]);

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

  // Get brand logo by brand_id
  const getBrandLogo = (brandId: string | null): string | null => {
    if (!brandId) return null;
    const brand = brands.find(b => b.id === brandId);
    return brand?.logo_url || null;
  };

  // Get social links that have values
  const socialLinks = fighter ? [
    { key: "facebook", url: fighter.social_facebook, icon: SocialIcons.facebook },
    { key: "instagram", url: fighter.social_instagram, icon: SocialIcons.instagram },
    { key: "tiktok", url: fighter.social_tiktok, icon: SocialIcons.tiktok },
    { key: "youtube", url: fighter.social_youtube, icon: SocialIcons.youtube },
    { key: "twitter", url: fighter.social_twitter, icon: SocialIcons.twitter },
    { key: "snapchat", url: fighter.social_snapchat, icon: SocialIcons.snapchat },
    { key: "tapology", url: fighter.social_tapology, icon: SocialIcons.tapology },
  ].filter(s => s.url) : [];

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

  // Build social links for Person schema
  const schemaSocialLinks = fighter ? [
    fighter.social_instagram,
    fighter.social_twitter,
    fighter.social_youtube,
    fighter.social_tiktok,
    fighter.social_facebook,
    fighter.social_snapchat,
    fighter.social_tapology,
  ].filter(Boolean) as string[] : [];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title={`${fighter?.full_name}'s Store`} 
        description={`Shop products recommended by ${fighter?.full_name}. ${fighter?.sport} fighter from ${fighter?.country}.`}
        image={fighter?.profile_image_url || fighter?.hero_image_url || undefined}
      />
      <PersonSchema
        name={fighter?.full_name || ""}
        description={fighter?.short_bio || `${fighter?.sport} fighter from ${fighter?.country}`}
        image={fighter?.profile_image_url || undefined}
        url={getCanonicalUrl(`/${fighter?.handle}`)}
        sameAs={schemaSocialLinks}
        jobTitle={fighter?.sport ? `${fighter.sport} Fighter` : "Combat Athlete"}
        nationality={fighter?.country || undefined}
      />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative h-[35vh] min-h-[250px] w-full overflow-hidden sm:h-[40vh] sm:min-h-[300px]">
        <img 
          src={fighter?.hero_image_url || defaultHeroImage} 
          alt={`${fighter?.full_name} banner`}
          className="h-full w-full object-cover"
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </section>

      {/* Profile Card - Overlapping Hero */}
      <section className="relative z-10 -mt-20 px-3 pb-6 sm:-mt-24 sm:px-4 sm:pb-8">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-xl bg-white shadow-lg dark:border dark:border-border/50 dark:bg-card/80 p-4 backdrop-blur-md sm:rounded-2xl sm:p-6 md:p-8">
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-start">
              {/* Profile Image */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-xl border-l-4 border-primary bg-muted shadow-md dark:border-4 sm:h-28 sm:w-28 md:h-32 md:w-32">
                  {fighter?.profile_image_url ? (
                    <img 
                      src={fighter.profile_image_url} 
                      alt={fighter.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-display text-primary sm:text-4xl">
                      {fighter?.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Fighter Info */}
              <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
                {/* Name */}
                <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  {fighter?.full_name}
                </h1>

                {/* Bio */}
                {fighter?.short_bio && (
                  <p className="mt-1.5 max-w-lg text-xs text-muted-foreground sm:mt-2 sm:text-sm md:text-base">
                    {fighter.short_bio}
                  </p>
                )}

                {/* Tags & Social Row */}
                <div className="mt-3 flex flex-col items-center gap-3 sm:mt-4 sm:gap-4 md:flex-row md:items-center md:justify-between md:w-full">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    <span className="rounded-full border-2 border-primary px-3 py-1 text-xs font-semibold text-primary dark:border-0 dark:bg-primary dark:text-primary-foreground sm:px-4 sm:py-1.5 sm:text-sm">
                      {fighter?.sport}
                    </span>
                    <span className="rounded-full border-2 border-foreground/30 px-3 py-1 text-xs font-medium text-foreground dark:border-0 dark:bg-muted dark:text-muted-foreground sm:px-4 sm:py-1.5 sm:text-sm">
                      {fighter?.country}
                    </span>
                  </div>

                  {/* Social Icons */}
                  {socialLinks.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {socialLinks.map((social) => (
                        <a
                          key={social.key}
                          href={social.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-transform hover:scale-110 [&>div]:h-8 [&>div]:w-8 sm:[&>div]:h-10 sm:[&>div]:w-10"
                        >
                          {social.icon}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Toggle & Share Button - Desktop */}
              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <ThemeToggle />
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Theme Toggle & Share Button - Mobile */}
            <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
              <ThemeToggle />
              <button 
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-3 pb-12 sm:px-4 sm:pb-16">
        <div className="container mx-auto max-w-6xl">
          {products.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground sm:text-base">No products available yet.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map(({ products: product }) => (
                <Link
                  key={product.id}
                  to={`/${handle}/${product.slug}`}
                  className="group relative block overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/10 dark:border dark:border-border dark:bg-card dark:shadow-none sm:rounded-xl"
                >
                  {/* Product Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={`${product.name} - ${product.brand} product`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground sm:text-sm">
                        No Image
                      </div>
                    )}

                    {/* Discount Badge - Top Right */}
                    {product.discount_percentage && product.discount_percentage > 0 && (
                      <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg sm:right-2 sm:top-2 sm:gap-1 sm:px-2.5 sm:py-1 sm:text-xs">
                        <span>🔥</span>
                        <span>{product.discount_percentage}% OFF</span>
                      </div>
                    )}

                    {/* Brand Badge - Bottom Left */}
                    {getBrandLogo(product.brand_id) && (
                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-md sm:bottom-3 sm:left-3 sm:gap-2 sm:px-3 sm:py-1.5">
                        <img
                          src={getBrandLogo(product.brand_id)!}
                          alt=""
                          className="h-4 w-auto object-contain sm:h-5"
                        />
                        <span className="hidden text-xs font-bold uppercase text-gray-900 sm:inline">
                          {product.brand}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-2 sm:p-3">
                    <h3 className="text-xs font-semibold uppercase leading-tight line-clamp-2 sm:text-sm">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-right text-xs font-bold text-primary dark:text-foreground sm:mt-1 sm:text-sm">
                      {product.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Affiliate Disclosure */}
          <p className="mt-8 text-center text-[10px] text-muted-foreground/70 sm:mt-12 sm:text-xs">
            Links may be affiliate links. Purchases support this fighter.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
