import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Combat sports related keywords for filtering
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

// Interface matching actual FMTC JSON response
interface FMTCProduct {
  id: number;
  label: string;
  price: number;
  sale_price?: number;
  currency_code?: string;
  image_link: string;
  affiliate_url: string;
  raw_brand_name?: string;
  brand_object?: { id: number; name: string };
  merchant_object?: { id: number; name: string };
  raw_categories?: string;
  description?: string;
}

interface FMTCResponse {
  data: FMTCProduct[];
  total_on_page?: number;
  total?: number;
}

interface SyncOptions {
  limit?: number;
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
    product.label,
    product.description,
    product.raw_brand_name,
    product.brand_object?.name,
    product.merchant_object?.name,
    product.raw_categories,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return COMBAT_SPORTS_KEYWORDS.some((keyword) => searchText.includes(keyword));
}

function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return "$0.00";
  if (isNaN(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const FMTC_API_KEY = Deno.env.get("FMTC_API_KEY");
    if (!FMTC_API_KEY) {
      console.error("FMTC_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "FMTC API key not configured" }),
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
        // Use defaults if no body
      }
    }

    const limit = options.limit || 500;
    console.log(`Starting FMTC sync with limit: ${limit}`);

    // FMTC API - use JSON format
    const fmtcUrl = `https://s3.fmtc.co/api/1/products?api_token=${FMTC_API_KEY}&format=json&limit=${Math.min(limit * 3, 10000)}`;
    
    console.log(`Fetching FMTC products (JSON format)...`);
    console.log(`Request URL: ${fmtcUrl.replace(FMTC_API_KEY, "***")}`);
    
    const response = await fetch(fmtcUrl);
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FMTC API error: ${response.status} - ${errorText.substring(0, 500)}`);
      return new Response(
        JSON.stringify({ success: false, error: `FMTC API error: ${response.status}`, details: errorText.substring(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseData: FMTCResponse = await response.json();
    const allProducts = responseData.data || [];
    
    console.log(`Received ${allProducts.length} products from FMTC`);

    if (allProducts.length > 0) {
      console.log(`Sample product: ${JSON.stringify(allProducts[0])}`);
    }

    // Deduplicate by product ID
    const uniqueProducts = new Map<number, FMTCProduct>();
    for (const product of allProducts) {
      if (product.id && !uniqueProducts.has(product.id)) {
        uniqueProducts.set(product.id, product);
      }
    }

    console.log(`Unique products after dedup: ${uniqueProducts.size}`);

    // Filter for combat sports
    const combatSportsProducts = Array.from(uniqueProducts.values()).filter(isCombatSportsProduct);
    console.log(`Combat sports products after filter: ${combatSportsProducts.length}`);

    // Limit final count
    const productsToImport = combatSportsProducts.slice(0, limit);

    const now = new Date().toISOString();
    let importedCount = 0;
    let failedCount = 0;
    const importErrors: string[] = [];

    for (const product of productsToImport) {
      try {
        const externalUrl = product.affiliate_url || "";
        if (!externalUrl) {
          failedCount++;
          continue;
        }

        const productName = product.label || "Unknown Product";
        const brandName = product.brand_object?.name || product.raw_brand_name || "Unknown";
        const network = product.merchant_object?.name || "FMTC";
        const imageUrl = product.image_link || null;
        const category = product.raw_categories?.split(",")[0]?.trim() || "Combat Sports";

        const productData = {
          name: productName,
          brand: brandName,
          price: formatPrice(product.sale_price || product.price),
          slug: generateSlug(productName),
          category: category,
          image_url: imageUrl,
          short_description: product.description?.substring(0, 500) || null,
          external_url: externalUrl,
          active: true,
          source_type: "fmtc",
          affiliate_network: network,
          network_product_id: String(product.id),
          last_synced_at: now,
        };

        const { error } = await supabase
          .from("products")
          .upsert(productData, {
            onConflict: "network_product_id",
            ignoreDuplicates: false,
          });

        if (error) {
          // Try with unique slug
          const { error: insertError } = await supabase.from("products").insert({
            ...productData,
            slug: `${productData.slug}-${Date.now()}`,
          });

          if (insertError) {
            console.error(`Failed to import ${productName}:`, insertError);
            failedCount++;
            importErrors.push(`${productName}: ${insertError.message}`);
          } else {
            importedCount++;
          }
        } else {
          importedCount++;
        }
      } catch (error) {
        failedCount++;
        importErrors.push(`Error: ${error instanceof Error ? error.message : "Unknown"}`);
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
        errors: importErrors.slice(0, 10),
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
