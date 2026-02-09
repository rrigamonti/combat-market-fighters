import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SovrnTransaction {
  transactionId?: string;
  orderId?: string;
  status?: string;
  saleAmount?: number;
  commission?: number;
  currency?: string;
  merchantName?: string;
  transactionDate?: string;
  subId?: string;
}

interface ReportOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  syncStatuses?: boolean; // If true, sync transaction statuses back to sales table
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SOVRN_SECRET_KEY = Deno.env.get("SOVRN_SECRET_KEY");
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
      try {
        options = await req.json();
      } catch {
        // defaults
      }
    }

    // Default to last 30 days
    const endDate = options.endDate || new Date().toISOString().split("T")[0];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    console.log(`Fetching Sovrn transactions from ${startDate} to ${endDate}`);

    // Sovrn Transactions API
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
    const transactions: SovrnTransaction[] = Array.isArray(data) ? data : data.transactions || data.data || [];

    console.log(`Fetched ${transactions.length} Sovrn transactions`);

    let syncedCount = 0;
    let newCount = 0;
    const errors: string[] = [];

    if (options.syncStatuses && transactions.length > 0) {
      for (const txn of transactions) {
        try {
          const orderId = txn.orderId || txn.transactionId;
          if (!orderId) continue;

          // Map Sovrn status to our status
          let mappedStatus = "pending";
          const sovrnStatus = (txn.status || "").toLowerCase();
          if (sovrnStatus === "confirmed" || sovrnStatus === "approved" || sovrnStatus === "locked") {
            mappedStatus = "confirmed";
          } else if (sovrnStatus === "paid") {
            mappedStatus = "paid";
          } else if (sovrnStatus === "rejected" || sovrnStatus === "reversed" || sovrnStatus === "cancelled") {
            mappedStatus = "cancelled";
          }

          // Try to find existing sale by external_order_id
          const { data: existingSale } = await supabase
            .from("sales")
            .select("id, status")
            .eq("external_order_id", orderId)
            .eq("affiliate_network", "Sovrn")
            .limit(1)
            .single();

          if (existingSale) {
            // Update status if changed
            if (existingSale.status !== mappedStatus) {
              await supabase
                .from("sales")
                .update({ status: mappedStatus })
                .eq("id", existingSale.id);
              syncedCount++;
              console.log(`Updated sale ${existingSale.id} status to ${mappedStatus}`);
            }
          }
        } catch (err) {
          errors.push(`Txn sync error: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_transactions: transactions.length,
        synced_count: syncedCount,
        new_count: newCount,
        errors: errors.slice(0, 10),
        transactions: transactions.slice(0, 50), // Return first 50 for display
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sovrn reporting error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
