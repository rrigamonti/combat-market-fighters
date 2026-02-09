import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Reuse combat sports keywords from FMTC sync
const COMBAT_SPORTS_KEYWORDS = [
  "boxing", "mma", "mixed martial arts", "muay thai", "kickboxing",
  "wrestling", "jiu-jitsu", "jiu jitsu", "bjj", "brazilian jiu",
  "martial arts", "combat sports", "fight gear", "fighter",
  "gloves", "punch", "sparring", "grappling", "submission",
  "gi", "rash guard", "rashguard", "mouthguard", "headgear",
  "shin guard", "hand wrap", "heavy bag", "speed bag", "punching bag",
  "focus mitt", "thai pad", "kick pad", "karate", "taekwondo",
  "judo", "kendo", "sambo", "ufc", "bellator", "venum", "hayabusa",
  "everlast", "fairtex", "twins special", "yokkao", "title boxing",
  "ringside", "rival boxing", "cleto reyes", "winning", "sanabul",
  "elite sports", "rdx", "century",
];

interface SovrnProduct {
  name?: string;
  price?: number;
  salePrice?: number;
  imageUrl?: string;
  merchantName?: string;
  merchantId?: number;
  url?: string;
  category?: string;
  description?: string;
  upc?: string;
  brand?: string;
}

interface SyncOptions {
  limit?: number;
  keywords?: string[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function isCombatSportsProduct(product: SovrnProduct): boolean {
  const searchText = [
    product.name,
    product.description,
    product.brand,
    product.merchantName,
    product.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return COMBAT_SPORTS_KEYWORDS.some((keyword) => searchText.includes(keyword));
}

function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null || isNaN(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
}

// Brand cache for dedup
const brandCache = new Map<string, string>();

async function getBrandId(
  supabase: ReturnType<typeof createClient>,
  brandName: string
): Promise<string | null> {
  if (!brandName || brandName === "Unknown") return null;

  const normalizedName = brandName.trim();
  if (brandCache.has(normalizedName.toLowerCase())) {
    return brandCache.get(normalizedName.toLowerCase())!;
  }

  const { data: existingBrand } = await supabase
    .from("brands")
    .select("id")
    .ilike("name", normalizedName)
    .limit(1)
    .single();

  if (existingBrand) {
    brandCache.set(normalizedName.toLowerCase(), existingBrand.id);
    return existingBrand.id;
  }

  const { data: newBrand, error } = await supabase
    .from("brands")
    .insert({ name: normalizedName })
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to create brand "${normalizedName}":`, error.message);
    return null;
  }

  console.log(`Created new brand: ${normalizedName}`);
  brandCache.set(normalizedName.toLowerCase(), newBrand.id);
  return newBrand.id;
}

function normalizeProduct(item: Record<string, unknown>): SovrnProduct {
  // Handle various Sovrn API response formats
  if (item.merchants && Array.isArray(item.merchants)) {
    const merchant = item.merchants[0] || {};
    return {
      name: (item.name || item.title || item.productName) as string,
      price: (merchant.price || merchant.salePrice || item.price) as number,
      salePrice: (merchant.salePrice || item.salePrice) as number,
      imageUrl: (item.imageUrl || item.image || item.thumbnailUrl) as string,
      merchantName: (merchant.merchantName || merchant.name || item.merchantName) as string,
      merchantId: merchant.merchantId as number,
      url: (merchant.url || merchant.affiliateUrl || item.url || item.affiliateUrl) as string,
      category: item.category as string,
      description: item.description as string,
      upc: item.upc as string,
      brand: item.brand as string,
    };
  }
  return {
    name: (item.name || item.title || item.productName) as string,
    price: (item.price || item.retailPrice) as number,
    salePrice: item.salePrice as number,
    imageUrl: (item.imageUrl || item.image || item.thumbnailUrl) as string,
    merchantName: item.merchantName as string,
    merchantId: item.merchantId as number,
    url: (item.url || item.affiliateUrl || item.purchaseUrl) as string,
    category: item.category as string,
    description: item.description as string,
    upc: item.upc as string,
    brand: item.brand as string,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SOVRN_SECRET_KEY = Deno.env.get("SOVRN_SECRET_KEY");
    const SOVRN_API_KEY = Deno.env.get("SOVRN_API_KEY");

    if (!SOVRN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "SOVRN_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SOVRN_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "SOVRN_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let options: SyncOptions = {};
    if (req.method === "POST") {
      try {
        options = await req.json();
      } catch {
        // defaults
      }
    }

    const limit = options.limit || 500;
    const searchKeywords = options.keywords || ["boxing gloves", "mma gloves", "muay thai", "bjj gi", "boxing equipment", "martial arts gear"];

    console.log(`Starting Sovrn product sync. Limit: ${limit}, Keywords: ${searchKeywords.length}`);

    const allProducts: SovrnProduct[] = [];

    // Use Sovrn Product Recommendation API for keyword-based product discovery
    for (const keyword of searchKeywords) {
      try {
        console.log(`Searching Sovrn for: "${keyword}"`);

        const response = await fetch(
          `https://shopping-gallery.prd-commerce.sovrnservices.com/ai-orchestration/products?apiKey=${SOVRN_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Authorization": `secret ${SOVRN_SECRET_KEY}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              content: keyword,
              maxProducts: 50,
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Sovrn API error for "${keyword}": ${response.status} - ${errText.substring(0, 300)}`);

          // Fallback: try Price Comparison non-affiliated API
          const fallbackResponse = await fetch(
            "https://comparisons.sovrn.com/api/data/v1.0/",
            {
              method: "POST",
              headers: {
                "Authorization": `secret ${SOVRN_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                q: keyword,
                siteApiKey: SOVRN_API_KEY,
              }),
            }
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const items = Array.isArray(fallbackData) ? fallbackData : (fallbackData.products || []);
            for (const item of items) {
              allProducts.push(normalizeProduct(item));
            }
            console.log(`Fallback found ${items.length} products for "${keyword}"`);
          } else {
            const fbErr = await fallbackResponse.text();
            console.error(`Fallback API also failed for "${keyword}": ${fallbackResponse.status} - ${fbErr.substring(0, 200)}`);
          }
          continue;
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.products || data.recommendations || []);
        
        for (const item of items) {
          allProducts.push(normalizeProduct(item));
        }

        console.log(`Found ${items.length} products for "${keyword}"`);

        // Rate limit
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error fetching keyword "${keyword}":`, err);
      }
    }

    console.log(`Total raw products fetched: ${allProducts.length}`);

    // Deduplicate by URL
    const uniqueProducts = new Map<string, SovrnProduct>();
    for (const product of allProducts) {
      const key = product.url || `${product.name}-${product.merchantName}`;
      if (key && !uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
      }
    }

    console.log(`Unique products: ${uniqueProducts.size}`);

    // Filter for combat sports
    const combatProducts = Array.from(uniqueProducts.values()).filter(isCombatSportsProduct);
    console.log(`Combat sports products: ${combatProducts.length}`);

    const productsToImport = combatProducts.slice(0, limit);
    const now = new Date().toISOString();
    let importedCount = 0;
    let failedCount = 0;
    const importErrors: string[] = [];

    for (const product of productsToImport) {
      try {
        const externalUrl = product.url || "";
        if (!externalUrl) {
          failedCount++;
          continue;
        }

        const productName = product.name || "Unknown Product";
        const brandName = product.brand || product.merchantName || "Unknown";
        const brandId = await getBrandId(supabase, brandName);

        const productData = {
          name: productName,
          brand: brandName,
          brand_id: brandId,
          price: formatPrice(product.salePrice || product.price),
          slug: generateSlug(productName),
          category: product.category || "Combat Sports",
          image_url: product.imageUrl || null,
          short_description: product.description?.substring(0, 500) || null,
          external_url: externalUrl,
          active: true,
          source_type: "sovrn",
          affiliate_network: "Sovrn",
          network_product_id: product.upc || null,
          last_synced_at: now,
        };

        // Try upsert by network_product_id if available
        if (productData.network_product_id) {
          const { error } = await supabase
            .from("products")
            .upsert(productData, {
              onConflict: "network_product_id",
              ignoreDuplicates: false,
            });

          if (error) {
            // Fallback: insert with unique slug
            const { error: insertError } = await supabase.from("products").insert({
              ...productData,
              slug: `${productData.slug}-${Date.now()}`,
            });

            if (insertError) {
              failedCount++;
              importErrors.push(`${productName}: ${insertError.message}`);
            } else {
              importedCount++;
            }
          } else {
            importedCount++;
          }
        } else {
          // No UPC - just insert with unique slug
          const { error } = await supabase.from("products").insert({
            ...productData,
            slug: `${productData.slug}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          });

          if (error) {
            failedCount++;
            importErrors.push(`${productName}: ${error.message}`);
          } else {
            importedCount++;
          }
        }
      } catch (err) {
        failedCount++;
        importErrors.push(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    console.log(`Sovrn sync complete: ${importedCount} imported, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_fetched: allProducts.length,
        unique_count: uniqueProducts.size,
        combat_sports_count: combatProducts.length,
        imported_count: importedCount,
        failed_count: failedCount,
        errors: importErrors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
