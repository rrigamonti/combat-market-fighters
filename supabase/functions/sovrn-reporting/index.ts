import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportOptions {
  mode?: "transactions" | "merchants"; // Default: transactions
  startDate?: string;
  endDate?: string;
  syncStatuses?: boolean;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let options: ReportOptions = {};
    if (req.method === "POST") {
      try { options = await req.json(); } catch { /* defaults */ }
    }

    const endDate = options.endDate || new Date().toISOString().split("T")[0];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const mode = options.mode || "transactions";

    // ── Merchant Reporting Mode ──
    if (mode === "merchants") {
      console.log(`Fetching Sovrn merchant report from ${startDate} to ${endDate}`);

      const apiUrl = `https://api.sovrn.com/commerce/v1/reports/merchants?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `secret ${SOVRN_SECRET_KEY}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Sovrn Merchant Report API error: ${response.status} - ${errText.substring(0, 300)}`);
        return new Response(
          JSON.stringify({ success: false, error: `Sovrn API error: ${response.status}`, details: errText.substring(0, 200) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const merchantReports = Array.isArray(data) ? data : (data.merchants || data.data || []);

      return new Response(
        JSON.stringify({
          success: true,
          mode: "merchants",
          total_merchants: merchantReports.length,
          merchants: merchantReports,
          start_date: startDate,
          end_date: endDate,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Transaction Reporting Mode (original) ──
    console.log(`Fetching Sovrn transactions from ${startDate} to ${endDate}`);

    const apiUrl = `https://api.sovrn.com/commerce/v1/transactions?startDate=${startDate}&endDate=${endDate}`;
    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `secret ${SOVRN_SECRET_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Sovrn Transactions API error: ${response.status} - ${errText.substring(0, 300)}`);
      return new Response(
        JSON.stringify({ success: false, error: `Sovrn API error: ${response.status}`, details: errText.substring(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const transactions = Array.isArray(data) ? data : (data.transactions || data.data || []);
    console.log(`Fetched ${transactions.length} Sovrn transactions`);

    let syncedCount = 0;
    const errors: string[] = [];

    if (options.syncStatuses && transactions.length > 0) {
      for (const txn of transactions) {
        try {
          const orderId = txn.orderId || txn.transactionId;
          if (!orderId) continue;

          let mappedStatus = "pending";
          const sovrnStatus = (txn.status || "").toLowerCase();
          if (["confirmed", "approved", "locked"].includes(sovrnStatus)) mappedStatus = "confirmed";
          else if (sovrnStatus === "paid") mappedStatus = "paid";
          else if (["rejected", "reversed", "cancelled"].includes(sovrnStatus)) mappedStatus = "cancelled";

          const { data: existingSale } = await supabase
            .from("sales")
            .select("id, status")
            .eq("external_order_id", orderId)
            .eq("affiliate_network", "Sovrn")
            .limit(1)
            .single();

          if (existingSale && existingSale.status !== mappedStatus) {
            await supabase.from("sales").update({ status: mappedStatus }).eq("id", existingSale.id);
            syncedCount++;
          }
        } catch (err) {
          errors.push(`Txn sync error: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "transactions",
        total_transactions: transactions.length,
        synced_count: syncedCount,
        errors: errors.slice(0, 10),
        transactions: transactions.slice(0, 50),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn reporting error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
