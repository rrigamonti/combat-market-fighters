import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncOptions {
  urls: string[]; // Product URLs to import
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null || isNaN(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
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

    let options: SyncOptions = { urls: [] };
    if (req.method === "POST") {
      try {
        options = await req.json();
      } catch {
        // defaults
      }
    }

    if (!options.urls || options.urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No product URLs provided" }),
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

    const now = new Date().toISOString();
    let importedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const importErrors: string[] = [];
    const results: Array<{ url: string; status: string; name?: string; error?: string }> = [];

    for (const url of options.urls) {
      try {
        // Check if URL domain matches an enabled merchant
        let urlDomain = "";
        try {
          urlDomain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        } catch {
          results.push({ url, status: "failed", error: "Invalid URL" });
          failedCount++;
          continue;
        }

        if (enabledDomains.size > 0 && !enabledDomains.has(urlDomain)) {
          // Check if any enabled domain is a substring match
          const domainMatch = Array.from(enabledDomains).some(
            (d) => urlDomain.includes(d) || d.includes(urlDomain)
          );
          if (!domainMatch) {
            results.push({ url, status: "skipped", error: "Merchant not enabled" });
            skippedCount++;
            continue;
          }
        }

        // Call Sovrn Price Comparison API
        const pcResponse = await fetch(
          `https://api.viglink.com/api/product?key=${SOVRN_API_KEY}&url=${encodeURIComponent(url)}`,
          {
            headers: {
              "Authorization": `secret ${SOVRN_SECRET_KEY}`,
              "Accept": "application/json",
            },
          }
        );

        if (!pcResponse.ok) {
          const errText = await pcResponse.text();
          console.error(`Price Comparison API error for ${url}: ${pcResponse.status}`);
          results.push({ url, status: "failed", error: `API error: ${pcResponse.status}` });
          failedCount++;
          continue;
        }

        const pcData = await pcResponse.json();
        const product = pcData.product || pcData.data || pcData;

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
          importErrors.push(`${productName}: ${error.message}`);
        } else {
          results.push({ url, status: "imported", name: productName });
          importedCount++;
        }

        // Rate limit: 100ms between requests
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        results.push({ url, status: "failed", error: err instanceof Error ? err.message : "Unknown" });
        failedCount++;
      }
    }

    console.log(`URL import complete: ${importedCount} imported, ${skippedCount} skipped, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        imported_count: importedCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        results,
        errors: importErrors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn product import error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
