import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SOVRN_API_KEY = Deno.env.get("SOVRN_API_KEY");
    const SOVRN_SECRET_KEY = Deno.env.get("SOVRN_SECRET_KEY");

    if (!SOVRN_API_KEY || !SOVRN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Sovrn API keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query, category, priceMin, priceMax, limit } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Search query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sovrn catalog search: "${query}"`);
    const errors: string[] = [];

    // Attempt 1: Price Comparisons API with query parameter and correct market
    try {
      const searchUrl = `https://comparisons.sovrn.com/api/affiliate/v3.5/sites/${SOVRN_API_KEY}/compare/prices/usd_en/by/accuracy?query=${encodeURIComponent(query)}`;
      console.log(`Attempt 1 - Price Comparisons: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        headers: {
          "Authorization": `secret ${SOVRN_SECRET_KEY}`,
          "Accept": "application/json",
        },
      });

      const text = await response.text();
      console.log(`Attempt 1 status: ${response.status}, body: ${text.substring(0, 300)}`);

      if (response.ok) {
        const data = JSON.parse(text);
        const products = data.offers || data.products || data.results || (Array.isArray(data) ? data : []);
        if (products.length > 0) {
          return jsonResponse({
            success: true, source: "price_comparisons",
            products: normalizeProducts(products), total: products.length,
            raw_sample: products[0],
          });
        }
        errors.push(`Price Comparisons: 0 results`);
      } else {
        errors.push(`Price Comparisons: ${response.status} - ${text.substring(0, 100)}`);
      }
    } catch (e) {
      errors.push(`Price Comparisons error: ${e}`);
    }

    // Attempt 2: Price Comparisons with URL-based lookup using a known retailer
    try {
      const retailerUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
      const searchUrl = `https://comparisons.sovrn.com/api/affiliate/v3.5/sites/${SOVRN_API_KEY}/compare/prices/usd_en/by/accuracy?url=${encodeURIComponent(retailerUrl)}`;
      console.log(`Attempt 2 - Price Comparisons URL lookup`);

      const response = await fetch(searchUrl, {
        headers: {
          "Authorization": `secret ${SOVRN_SECRET_KEY}`,
          "Accept": "application/json",
        },
      });

      const text = await response.text();
      console.log(`Attempt 2 status: ${response.status}, body: ${text.substring(0, 300)}`);

      if (response.ok) {
        const data = JSON.parse(text);
        const products = data.offers || data.products || data.results || (Array.isArray(data) ? data : []);
        if (products.length > 0) {
          return jsonResponse({
            success: true, source: "price_comparisons_url",
            products: normalizeProducts(products), total: products.length,
            raw_sample: products[0],
          });
        }
        errors.push(`Price Comparisons URL: 0 results`);
      } else {
        errors.push(`Price Comparisons URL: ${response.status} - ${text.substring(0, 100)}`);
      }
    } catch (e) {
      errors.push(`Price Comparisons URL error: ${e}`);
    }

    // Attempt 3: Product Recommendation API  
    try {
      const recUrl = new URL("https://shopping-gallery.prd-commerce.sovrnservices.com/ai-orchestration/products");
      recUrl.searchParams.set("apiKey", SOVRN_API_KEY);
      recUrl.searchParams.set("pageUrl", "https://combatmarket.com");

      const response = await fetch(recUrl.toString(), {
        method: "POST",
        headers: {
          "Authorization": `secret ${SOVRN_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ content: query, numProducts: limit || 20 }),
      });

      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || data.recommendations || []);
        if (products.length > 0) {
          return jsonResponse({
            success: true, source: "product_recommendation",
            products: normalizeProducts(products), total: products.length,
            raw_sample: products[0],
          });
        }
        errors.push(`Product Recommendation: 0 results`);
      } else {
        errors.push(`Product Recommendation: ${response.status}`);
      }
    } catch (e) {
      errors.push(`Product Recommendation error: ${e}`);
    }

    // All attempts failed
    return jsonResponse({
      success: false,
      error: "No products found across all Sovrn API endpoints",
      attempted_endpoints: errors,
    }, 404);

  } catch (error) {
    console.error("Sovrn product search error:", error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeProducts(products: any[]): any[] {
  return products.map((p: any) => ({
    name: p.name || p.title || p.productName || "Unknown Product",
    brand: typeof p.brand === "object" ? p.brand?.name : (p.brand || p.merchantName || null),
    price: p.price || p.salePrice || p.retailPrice || null,
    image_url: p.imageUrl || p.image || p.thumbnailUrl || p.imageURL || p.thumbnailURL || null,
    url: p.deepLink || p.url || p.productUrl || p.link || p.purchaseUrl || p.buyUrl || null,
    merchant: typeof p.merchant === "object" ? p.merchant?.name : (p.merchantName || p.merchant || null),
    category: p.category || null,
    description: p.description || null,
    upc: p.upc || p.sku || p.barcode || null,
    in_stock: p.inStock ?? true,
  }));
}
