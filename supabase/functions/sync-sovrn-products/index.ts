import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncOptions {
  urls?: string[];
  products?: Array<{
    name: string;
    brand?: string;
    price?: number | string;
    image_url?: string;
    url: string;
    category?: string;
    description?: string;
    upc?: string;
  }>;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function formatPrice(price: number | string | undefined): string {
  if (price === undefined || price === null) return "$0.00";
  const num = typeof price === "string" ? parseFloat(price.replace(/[^0-9.]/g, "")) : price;
  if (isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

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
  brandCache.set(normalizedName.toLowerCase(), newBrand.id);
  return newBrand.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SOVRN_SECRET_KEY = Deno.env.get("SOVRN_SECRET_KEY");
    const SOVRN_API_KEY = Deno.env.get("SOVRN_API_KEY");

    if (!SOVRN_SECRET_KEY || !SOVRN_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Sovrn API keys not configured" }),
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

    const now = new Date().toISOString();
    let importedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const importErrors: string[] = [];
    const results: Array<{ url: string; status: string; name?: string; error?: string }> = [];

    // Mode 1: Import from pre-fetched product data (from Product Recommendation API)
    if (options.products && options.products.length > 0) {
      console.log(`Importing ${options.products.length} pre-fetched products`);

      for (const product of options.products) {
        try {
          if (!product.url) {
            results.push({ url: "", status: "failed", error: "No URL" });
            failedCount++;
            continue;
          }

          const brandName = product.brand || "Unknown";
          const brandId = await getBrandId(supabase, brandName);

          const productData = {
            name: product.name || "Unknown Product",
            brand: brandName,
            brand_id: brandId,
            price: formatPrice(product.price),
            slug: `${generateSlug(product.name || "product")}-${Date.now()}`,
            category: product.category || "Combat Sports",
            image_url: product.image_url || null,
            short_description: (product.description || "").substring(0, 500) || null,
            external_url: product.url,
            active: true,
            source_type: "sovrn",
            affiliate_network: "Sovrn",
            network_product_id: product.upc || null,
            last_synced_at: now,
          };

          const { error } = await supabase.from("products").insert(productData);

          if (error) {
            results.push({ url: product.url, status: "failed", name: product.name, error: error.message });
            failedCount++;
            importErrors.push(`${product.name}: ${error.message}`);
          } else {
            results.push({ url: product.url, status: "imported", name: product.name });
            importedCount++;
          }
        } catch (err) {
          results.push({ url: product.url || "", status: "failed", error: err instanceof Error ? err.message : "Unknown" });
          failedCount++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, imported_count: importedCount, skipped_count: skippedCount, failed_count: failedCount, results, errors: importErrors.slice(0, 10) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode 2: Import from URLs using Price Comparisons API
    if (!options.urls || options.urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No product URLs or product data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get enabled merchant domains for validation
    const { data: enabledMerchants } = await supabase
      .from("sovrn_merchants")
      .select("merchant_id, name, domain")
      .eq("enabled", true);

    const enabledDomains = new Set(
      (enabledMerchants || [])
        .map((m: any) => m.domain)
        .filter(Boolean)
        .map((d: string) => d.replace(/^https?:\/\//, "").replace(/^www\./, "").toLowerCase())
    );

    console.log(`Importing ${options.urls.length} product URLs. ${enabledDomains.size} enabled merchant domains.`);

    for (const url of options.urls) {
      try {
        let urlDomain = "";
        try {
          urlDomain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        } catch {
          results.push({ url, status: "failed", error: "Invalid URL" });
          failedCount++;
          continue;
        }

        if (enabledDomains.size > 0 && !enabledDomains.has(urlDomain)) {
          const domainMatch = Array.from(enabledDomains).some(
            (d) => urlDomain.includes(d) || d.includes(urlDomain)
          );
          if (!domainMatch) {
            results.push({ url, status: "skipped", error: "Merchant not enabled" });
            skippedCount++;
            continue;
          }
        }

        // Use the correct Price Comparisons API endpoint
        const pcResponse = await fetch(
          `https://comparisons.sovrn.com/api/affiliate/v3.5/sites/${SOVRN_API_KEY}/compare/prices/US/by/accuracy?url=${encodeURIComponent(url)}`,
          {
            headers: {
              "Authorization": `secret ${SOVRN_SECRET_KEY}`,
              "Accept": "application/json",
            },
          }
        );

        if (!pcResponse.ok) {
          // Fallback: try the merchandise/product data API
          const fallbackResponse = await fetch(
            `https://api.viglink.com/api/product?key=${SOVRN_API_KEY}&url=${encodeURIComponent(url)}`,
            {
              headers: {
                "Authorization": `secret ${SOVRN_SECRET_KEY}`,
                "Accept": "application/json",
              },
            }
          );

          if (!fallbackResponse.ok) {
            console.error(`Both APIs failed for ${url}: ${pcResponse.status}, ${fallbackResponse.status}`);
            results.push({ url, status: "failed", error: `API error: ${pcResponse.status}` });
            failedCount++;
            continue;
          }

          const fallbackData = await fallbackResponse.json();
          const product = fallbackData.product || fallbackData.data || fallbackData;
          const productName = product.name || product.title || "Unknown Product";
          const brandName = product.brand || product.merchantName || urlDomain;
          const brandId = await getBrandId(supabase, brandName);

          const productData = {
            name: productName,
            brand: brandName,
            brand_id: brandId,
            price: formatPrice(product.price || product.salePrice),
            slug: `${generateSlug(productName)}-${Date.now()}`,
            category: product.category || "Combat Sports",
            image_url: product.imageUrl || product.image || null,
            short_description: (product.description || "").substring(0, 500) || null,
            external_url: url,
            active: true,
            source_type: "sovrn",
            affiliate_network: "Sovrn",
            network_product_id: product.upc || null,
            last_synced_at: now,
          };

          const { error } = await supabase.from("products").insert(productData);
          if (error) {
            results.push({ url, status: "failed", name: productName, error: error.message });
            failedCount++;
          } else {
            results.push({ url, status: "imported", name: productName });
            importedCount++;
          }
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }

        // Parse Price Comparisons response
        const pcData = await pcResponse.json();
        const offers = pcData.offers || pcData.products || pcData.results || (Array.isArray(pcData) ? pcData : []);
        
        if (offers.length === 0) {
          results.push({ url, status: "failed", error: "No product data returned" });
          failedCount++;
          continue;
        }

        // Use the first/best offer
        const bestOffer = offers[0];
        const productName = bestOffer.name || bestOffer.productName || bestOffer.title || "Unknown Product";
        const brandName = bestOffer.brand || bestOffer.merchantName || urlDomain;
        const brandId = await getBrandId(supabase, brandName);

        const productData = {
          name: productName,
          brand: brandName,
          brand_id: brandId,
          price: formatPrice(bestOffer.price || bestOffer.salePrice || bestOffer.retailPrice),
          slug: `${generateSlug(productName)}-${Date.now()}`,
          category: bestOffer.category || "Combat Sports",
          image_url: bestOffer.imageUrl || bestOffer.image || bestOffer.thumbnailUrl || null,
          short_description: (bestOffer.description || "").substring(0, 500) || null,
          external_url: url,
          active: true,
          source_type: "sovrn",
          affiliate_network: "Sovrn",
          network_product_id: bestOffer.upc || bestOffer.sku || null,
          last_synced_at: now,
        };

        const { error } = await supabase.from("products").insert(productData);
        if (error) {
          results.push({ url, status: "failed", name: productName, error: error.message });
          failedCount++;
          importErrors.push(`${productName}: ${error.message}`);
        } else {
          results.push({ url, status: "imported", name: productName });
          importedCount++;
        }

        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        results.push({ url, status: "failed", error: err instanceof Error ? err.message : "Unknown" });
        failedCount++;
      }
    }

    console.log(`Import complete: ${importedCount} imported, ${skippedCount} skipped, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, imported_count: importedCount, skipped_count: skippedCount, failed_count: failedCount, results, errors: importErrors.slice(0, 10) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn product import error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
