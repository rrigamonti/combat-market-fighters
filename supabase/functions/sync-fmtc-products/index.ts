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

interface FMTCProduct {
  id?: string;
  label?: string;
  description?: string;
  price?: string;
  sale_price?: string;
  image_link?: string;
  affiliate_url?: string;
  raw_brand_name?: string;
  merchant_name?: string;
  raw_categories?: string;
  [key: string]: string | undefined;
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
    product.merchant_name,
    product.raw_categories,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return COMBAT_SPORTS_KEYWORDS.some((keyword) => searchText.includes(keyword));
}

function formatPrice(price: string | undefined): string {
  if (!price) return "$0.00";
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return "$0.00";
  return `$${numPrice.toFixed(2)}`;
}

function parseCSV(csvText: string): FMTCProduct[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header row to get column names
  const headers = parseCSVLine(lines[0]);
  console.log(`CSV headers: ${headers.join(", ")}`);

  const products: FMTCProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const product: FMTCProduct = {};
    for (let j = 0; j < headers.length; j++) {
      product[headers[j]] = values[j];
    }
    products.push(product);
  }

  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
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

    // FMTC API - use CSV format as per user's working example
    const fmtcUrl = `https://s3.fmtc.co/api/1/products?api_token=${FMTC_API_KEY}&format=csv&limit=${Math.min(limit * 3, 10000)}`;
    
    console.log(`Fetching FMTC products (CSV format)...`);
    console.log(`Request URL: ${fmtcUrl.replace(FMTC_API_KEY, "***")}`);
    
    const response = await fetch(fmtcUrl);
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FMTC API error: ${response.status} - ${errorText.substring(0, 500)}`);
      return new Response(
        JSON.stringify({ success: false, error: `FMTC API error: ${response.status}`, details: errorText.substring(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseText = await response.text();
    console.log(`Response length: ${responseText.length} chars`);
    console.log(`First 1000 chars: ${responseText.substring(0, 1000)}`);

    if (!responseText || responseText.trim().length < 10) {
      console.log("Empty or minimal response from FMTC");
      return new Response(
        JSON.stringify({ success: true, imported_count: 0, failed_count: 0, errors: ["Empty response from FMTC"] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse CSV
    const allProducts = parseCSV(responseText);
    console.log(`Parsed ${allProducts.length} products from CSV`);

    if (allProducts.length > 0) {
      console.log(`Sample product: ${JSON.stringify(allProducts[0])}`);
    }

    // Deduplicate by product ID
    const uniqueProducts = new Map<string, FMTCProduct>();
    for (const product of allProducts) {
      const key = product.id || product.affiliate_url || "";
      if (key && !uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
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

        const productId = product.id || externalUrl;
        const productName = product.label || "Unknown Product";
        const brandName = product.raw_brand_name || "Unknown";
        const network = product.merchant_name || "FMTC";
        const imageUrl = product.image_link || null;
        const category = product.raw_categories?.split(">")[0]?.trim() || "Combat Sports";

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
          network_product_id: productId,
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
