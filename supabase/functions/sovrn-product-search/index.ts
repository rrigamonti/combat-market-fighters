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

    console.log(`Sovrn Product Recommendation search: "${query}"`);

    // Use the Product Recommendation API
    const requestBody: Record<string, unknown> = {
      content: query,
      numProducts: limit || 20,
    };

    if (priceMin !== undefined || priceMax !== undefined) {
      requestBody.priceRange = {
        ...(priceMin !== undefined && { min: priceMin }),
        ...(priceMax !== undefined && { max: priceMax }),
      };
    }

    if (category) {
      requestBody.category = category;
    }

    const apiUrl = new URL("https://shopping-gallery.prd-commerce.sovrnservices.com/ai-orchestration/products");
    apiUrl.searchParams.set("apiKey", SOVRN_API_KEY);
    apiUrl.searchParams.set("pageUrl", "https://combatmarket.com");

    const response = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `secret ${SOVRN_SECRET_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Sovrn Product Recommendation API error: ${response.status} - ${errText.substring(0, 500)}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Sovrn API error: ${response.status}`,
          details: errText.substring(0, 300),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Normalize the response - the API may return products in different shapes
    const products = Array.isArray(data) 
      ? data 
      : (data.products || data.recommendations || data.data || data.results || []);

    console.log(`Found ${products.length} product recommendations`);

    // Normalize each product into a consistent shape
    const normalizedProducts = products.map((p: any) => ({
      name: p.name || p.title || p.productName || "Unknown Product",
      brand: typeof p.brand === 'object' ? p.brand?.name : (p.brand || null),
      price: p.price || p.salePrice || p.retailPrice || null,
      image_url: p.imageUrl || p.image || p.thumbnailUrl || null,
      url: p.url || p.productUrl || p.link || p.purchaseUrl || null,
      merchant: typeof p.merchant === 'object' ? p.merchant?.name : (p.merchantName || p.merchant || null),
      merchant_logo: typeof p.merchant === 'object' ? p.merchant?.logoUrl : null,
      merchant_url: typeof p.merchant === 'object' ? p.merchant?.url : null,
      category: p.category || null,
      description: p.description || null,
      upc: p.upc || p.sku || null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        products: normalizedProducts,
        total: normalizedProducts.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn product search error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
