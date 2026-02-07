import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Combat sports related keywords for filtering
const COMBAT_SPORTS_KEYWORDS = [
  "boxing",
  "mma",
  "mixed martial arts",
  "muay thai",
  "kickboxing",
  "wrestling",
  "jiu-jitsu",
  "jiu jitsu",
  "bjj",
  "brazilian jiu",
  "martial arts",
  "combat sports",
  "fight gear",
  "fighter",
  "gloves",
  "punch",
  "sparring",
  "grappling",
  "submission",
  "gi",
  "rash guard",
  "rashguard",
  "mouthguard",
  "headgear",
  "shin guard",
  "hand wrap",
  "heavy bag",
  "speed bag",
  "punching bag",
  "focus mitt",
  "thai pad",
  "kick pad",
  "karate",
  "taekwondo",
  "judo",
  "kendo",
  "sambo",
  "ufc",
  "bellator",
  "venum",
  "hayabusa",
  "everlast",
  "fairtex",
  "twins special",
  "yokkao",
  "title boxing",
  "ringside",
  "rival boxing",
  "cleto reyes",
  "winning",
  "sanabul",
  "elite sports",
  "rdx",
  "century",
];

// FMTC category IDs for sports/fitness (will be used in API calls)
const FMTC_SPORTS_CATEGORIES = [
  "sports",
  "fitness",
  "sporting goods",
  "athletics",
];

interface FMTCProduct {
  id?: string;
  sku?: string;
  name: string;
  description?: string;
  price?: string | number;
  sale_price?: string | number;
  image_url?: string;
  image?: string;
  brand?: string;
  manufacturer?: string;
  category?: string;
  categories?: string[];
  url: string;
  link?: string;
  merchant?: string;
  merchant_name?: string;
  network?: string;
  affiliate_network?: string;
}

interface SyncOptions {
  limit?: number;
  categories?: string[];
  keywords?: string[];
  merchants?: string[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function isCombatSportsProduct(product: FMTCProduct): boolean {
  const searchText = [
    product.name,
    product.description,
    product.brand,
    product.manufacturer,
    product.category,
    ...(product.categories || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return COMBAT_SPORTS_KEYWORDS.some((keyword) => searchText.includes(keyword));
}

function formatPrice(price: string | number | undefined): string {
  if (!price) return "$0.00";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "$0.00";
  return `$${numPrice.toFixed(2)}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get FMTC API key
    const FMTC_API_KEY = Deno.env.get("FMTC_API_KEY");
    if (!FMTC_API_KEY) {
      console.error("FMTC_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "FMTC API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request options
    let options: SyncOptions = {};
    if (req.method === "POST") {
      try {
        options = await req.json();
      } catch {
        // Use defaults if no body
      }
    }

    const limit = options.limit || 500;
    const keywords = options.keywords || COMBAT_SPORTS_KEYWORDS.slice(0, 10);

    console.log(`Starting FMTC sync with limit: ${limit}, keywords: ${keywords.join(", ")}`);

    // FMTC API endpoint - using v1 products endpoint
    // Documentation: https://docs.fmtc.co/kb/products-1-1-0
    const fmtcBaseUrl = "https://api.fmtc.co/api/1";
    
    let allProducts: FMTCProduct[] = [];
    let fetchErrors: string[] = [];

    // Fetch products for each keyword (FMTC uses keyword/search parameter)
    for (const keyword of keywords) {
      try {
        // Build FMTC API URL with correct parameters per docs
        const searchParams = new URLSearchParams({
          api_token: FMTC_API_KEY,
          format: "json",
          search: keyword,
          per_page: String(Math.ceil(limit / keywords.length)),
        });

        console.log(`Fetching FMTC products for keyword: ${keyword}`);
        
        const response = await fetch(`${fmtcBaseUrl}/products?${searchParams.toString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`FMTC API error for ${keyword}: ${response.status} - ${errorText}`);
          fetchErrors.push(`Keyword "${keyword}": ${response.status} - ${errorText.substring(0, 100)}`);
          continue;
        }

        const responseText = await response.text();
        
        // Handle empty responses
        if (!responseText || responseText.trim() === "") {
          console.log(`Empty response for keyword "${keyword}"`);
          continue;
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`JSON parse error for ${keyword}:`, responseText.substring(0, 200));
          fetchErrors.push(`Keyword "${keyword}": Invalid JSON response`);
          continue;
        }
        
        // FMTC v1 response structure: { data: [...products], meta: {...} }
        const products = data.data || data.products || data.results || [];
        
        if (Array.isArray(products)) {
          allProducts.push(...products);
          console.log(`Found ${products.length} products for "${keyword}"`);
        }

        // Rate limiting - be respectful to FMTC API
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error fetching keyword ${keyword}:`, error);
        fetchErrors.push(`Keyword "${keyword}": ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    console.log(`Total raw products fetched: ${allProducts.length}`);

    // Deduplicate by product ID or URL
    const uniqueProducts = new Map<string, FMTCProduct>();
    for (const product of allProducts) {
      const key = product.id || product.sku || product.url || product.link || "";
      if (key && !uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
      }
    }

    console.log(`Unique products after dedup: ${uniqueProducts.size}`);

    // Filter for combat sports relevance
    const combatSportsProducts = Array.from(uniqueProducts.values()).filter(
      isCombatSportsProduct
    );

    console.log(`Combat sports products after filter: ${combatSportsProducts.length}`);

    // Limit final count
    const productsToImport = combatSportsProducts.slice(0, limit);

    // Prepare products for upsert
    const now = new Date().toISOString();
    let importedCount = 0;
    let failedCount = 0;
    const importErrors: string[] = [];

    for (const product of productsToImport) {
      try {
        const externalUrl = product.url || product.link || "";
        if (!externalUrl) {
          failedCount++;
          importErrors.push(`Product "${product.name}" has no URL`);
          continue;
        }

        const productId = product.id || product.sku || externalUrl;
        const network = product.network || product.affiliate_network || product.merchant_name || product.merchant || "FMTC";
        const brandName = product.brand || product.manufacturer || "Unknown";

        const productData = {
          name: product.name,
          brand: brandName,
          price: formatPrice(product.sale_price || product.price),
          slug: generateSlug(product.name),
          category: product.category || (product.categories?.[0]) || "Combat Sports",
          image_url: product.image_url || product.image || null,
          short_description: product.description?.substring(0, 500) || null,
          external_url: externalUrl,
          active: true,
          source_type: "fmtc",
          affiliate_network: network,
          network_product_id: productId,
          last_synced_at: now,
        };

        // Upsert using network_product_id + affiliate_network as composite key
        const { error } = await supabase
          .from("products")
          .upsert(productData, {
            onConflict: "network_product_id",
            ignoreDuplicates: false,
          });

        if (error) {
          // If conflict on network_product_id fails, try insert (might be new product with duplicate slug)
          const { error: insertError } = await supabase.from("products").insert({
            ...productData,
            slug: `${productData.slug}-${Date.now()}`,
          });

          if (insertError) {
            console.error(`Failed to import product ${product.name}:`, insertError);
            failedCount++;
            importErrors.push(`${product.name}: ${insertError.message}`);
          } else {
            importedCount++;
          }
        } else {
          importedCount++;
        }
      } catch (error) {
        console.error(`Error processing product:`, error);
        failedCount++;
        importErrors.push(
          `${product.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    console.log(`Sync complete: ${importedCount} imported, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_fetched: allProducts.length,
        unique_count: uniqueProducts.size,
        combat_sports_count: combatSportsProducts.length,
        imported_count: importedCount,
        failed_count: failedCount,
        errors: [...fetchErrors, ...importErrors.slice(0, 10)],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
