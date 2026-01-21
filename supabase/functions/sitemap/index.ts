import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const PRODUCTION_DOMAIN = "https://cm.automationsuite.ai";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Static pages with their priorities and change frequencies
    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "weekly" },
      { path: "/marketplace", priority: "0.9", changefreq: "daily" },
      { path: "/fighter-signup", priority: "0.8", changefreq: "monthly" },
      { path: "/login", priority: "0.5", changefreq: "monthly" },
      { path: "/terms", priority: "0.3", changefreq: "yearly" },
      { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    ];

    // Fetch approved fighters
    const { data: fighters, error: fightersError } = await supabase
      .from("fighters")
      .select("handle, updated_at")
      .eq("status", "approved");

    if (fightersError) {
      console.error("Error fetching fighters:", fightersError);
    }

    // Fetch active products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // Build XML sitemap
    const now = new Date().toISOString().split("T")[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${PRODUCTION_DOMAIN}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add fighter storefronts
    if (fighters && fighters.length > 0) {
      for (const fighter of fighters) {
        const lastmod = fighter.updated_at 
          ? new Date(fighter.updated_at).toISOString().split("T")[0] 
          : now;
        xml += `  <url>
    <loc>${PRODUCTION_DOMAIN}/${fighter.handle}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add product pages
    if (products && products.length > 0) {
      for (const product of products) {
        const lastmod = product.updated_at 
          ? new Date(product.updated_at).toISOString().split("T")[0] 
          : now;
        xml += `  <url>
    <loc>${PRODUCTION_DOMAIN}/p/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    console.log(`Sitemap generated: ${staticPages.length} static, ${fighters?.length || 0} fighters, ${products?.length || 0} products`);

    return new Response(xml, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: corsHeaders,
      status: 500,
    });
  }
});
