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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching approved merchants from Sovrn...");

    // Sovrn Approved Merchants API
    const response = await fetch(
      "https://viglink.io/merchants/rates/summaries",
      {
        method: "POST",
        headers: {
          "Authorization": `secret ${SOVRN_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          apiKey: SOVRN_API_KEY,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Sovrn Merchants API error: ${response.status} - ${errText.substring(0, 500)}`);
      return new Response(
        JSON.stringify({ success: false, error: `Sovrn API error: ${response.status}`, details: errText.substring(0, 300) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    // Response can be an array or nested under merchants/data
    const merchants = Array.isArray(data) ? data : (data.merchants || data.data || data.rates || []);

    console.log(`Fetched ${merchants.length} approved merchants`);

    const now = new Date().toISOString();
    let upsertedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const m of merchants) {
      try {
        const merchantId = m.merchantId || m.merchant_id || m.id;
        if (!merchantId) continue;

        // Extract commission rates - flatten various response shapes
        const rates = m.rates || m.commissionRates || [];
        const avgRate = Array.isArray(rates) && rates.length > 0
          ? rates.reduce((sum: number, r: any) => sum + (r.rate || r.commission || 0), 0) / rates.length
          : (m.commissionRate || m.commission_rate || m.rate || 0);

        const merchantData = {
          merchant_id: Number(merchantId),
          name: m.merchantName || m.merchant_name || m.name || "Unknown",
          domain: m.domain || m.merchantDomain || m.url || null,
          category: m.category || m.merchantCategory || null,
          commission_rate: avgRate,
          conversion_rate: m.conversionRate || m.conversion_rate || null,
          avg_order_value: m.avgOrderValue || m.avg_order_value || m.aov || null,
          last_synced_at: now,
          metadata: m, // Store full raw response
        };

        const { error } = await supabase
          .from("sovrn_merchants")
          .upsert(merchantData, { onConflict: "merchant_id" });

        if (error) {
          failedCount++;
          errors.push(`${merchantData.name}: ${error.message}`);
        } else {
          upsertedCount++;
        }
      } catch (err) {
        failedCount++;
        errors.push(err instanceof Error ? err.message : "Unknown");
      }
    }

    console.log(`Sovrn merchants sync: ${upsertedCount} upserted, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_fetched: merchants.length,
        upserted_count: upsertedCount,
        failed_count: failedCount,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn merchants sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
