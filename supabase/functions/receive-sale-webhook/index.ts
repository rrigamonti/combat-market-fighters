import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface NormalizedSale {
  order_id?: string;
  sub_id?: string;
  product_sku?: string;
  sale_amount: number;
  commission: number;
  currency?: string;
  timestamp?: string;
  affiliate_network: string;
}

// --- Network-specific normalizers ---

function normalizeSovrn(raw: Record<string, unknown>): NormalizedSale {
  return {
    order_id: (raw.orderId || raw.transactionId || raw.order_id) as string | undefined,
    sub_id: (raw.subId || raw.subid || raw.sub_id) as string | undefined,
    product_sku: (raw.product_sku || raw.sku) as string | undefined,
    sale_amount: Number(raw.saleAmount || raw.sale_amount || 0),
    commission: Number(raw.commission || raw.publisherCommission || 0),
    currency: (raw.currency || "USD") as string,
    timestamp: (raw.transactionDate || raw.timestamp) as string | undefined,
    affiliate_network: "sovrn",
  };
}

function normalizeAwin(raw: Record<string, unknown>): NormalizedSale {
  return {
    order_id: (raw.transactionId || raw.order_id) as string | undefined,
    sub_id: (raw.clickRef || raw.clickref || raw.sub_id) as string | undefined,
    product_sku: (raw.productId || raw.product_sku) as string | undefined,
    sale_amount: Number(raw.saleAmount || raw.orderValue || raw.sale_amount || 0),
    commission: Number(raw.commissionAmount || raw.commission || 0),
    currency: (raw.currency || "USD") as string,
    timestamp: (raw.transactionDate || raw.clickDate || raw.timestamp) as string | undefined,
    affiliate_network: "awin",
  };
}

function normalizeRakuten(raw: Record<string, unknown>): NormalizedSale {
  return {
    order_id: (raw.etransaction_id || raw.order_id) as string | undefined,
    sub_id: (raw.u1 || raw.sub_id) as string | undefined,
    product_sku: (raw.product_id || raw.sku_number) as string | undefined,
    sale_amount: Number(raw.sale_amount || raw.sales || 0),
    commission: Number(raw.commissions || raw.commission || 0),
    currency: (raw.currency || "USD") as string,
    timestamp: (raw.transaction_date || raw.process_date || raw.timestamp) as string | undefined,
    affiliate_network: "rakuten",
  };
}

function normalizeImpact(raw: Record<string, unknown>): NormalizedSale {
  return {
    order_id: (raw.actionId || raw.action_id || raw.oid || raw.order_id) as string | undefined,
    sub_id: (raw.subId1 || raw.SharedId || raw.sub_id) as string | undefined,
    product_sku: (raw.sku || raw.productId || raw.product_sku) as string | undefined,
    sale_amount: Number(raw.amount || raw.saleAmount || raw.sale_amount || 0),
    commission: Number(raw.payout || raw.commission || 0),
    currency: (raw.currency || "USD") as string,
    timestamp: (raw.actionDate || raw.eventDate || raw.timestamp) as string | undefined,
    affiliate_network: "impact",
  };
}

function normalizeCJ(raw: Record<string, unknown>): NormalizedSale {
  return {
    order_id: (raw.commission_id || raw.original_action_id || raw.order_id) as string | undefined,
    sub_id: (raw.sid || raw.website_id || raw.sub_id) as string | undefined,
    product_sku: (raw.item_id || raw.sku || raw.product_sku) as string | undefined,
    sale_amount: Number(raw.sale_amount || raw.order_amount || 0),
    commission: Number(raw.commission_amount || raw.publisher_commission || raw.commission || 0),
    currency: (raw.currency || "USD") as string,
    timestamp: (raw.event_date || raw.posting_date || raw.timestamp) as string | undefined,
    affiliate_network: "cj",
  };
}

function detectAndNormalize(raw: Record<string, unknown>, networkHint?: string): NormalizedSale {
  const hint = (networkHint || "").toLowerCase();

  // Explicit network hint from query param
  if (hint === "awin") return normalizeAwin(raw);
  if (hint === "rakuten") return normalizeRakuten(raw);
  if (hint === "impact") return normalizeImpact(raw);
  if (hint === "cj") return normalizeCJ(raw);
  if (hint === "sovrn") return normalizeSovrn(raw);

  // Auto-detect by payload shape
  if (raw.clickRef !== undefined || raw.clickref !== undefined || raw.commissionAmount !== undefined) {
    console.log("Auto-detected AWIN payload");
    return normalizeAwin(raw);
  }
  if (raw.u1 !== undefined || raw.etransaction_id !== undefined || raw.commissions !== undefined) {
    console.log("Auto-detected Rakuten payload");
    return normalizeRakuten(raw);
  }
  if (raw.subId1 !== undefined || raw.SharedId !== undefined || raw.actionId !== undefined || raw.payout !== undefined) {
    console.log("Auto-detected Impact payload");
    return normalizeImpact(raw);
  }
  if (raw.sid !== undefined || raw.commission_id !== undefined || raw.publisher_commission !== undefined) {
    console.log("Auto-detected CJ payload");
    return normalizeCJ(raw);
  }
  if (raw.subId !== undefined || raw.subid !== undefined || raw.publisherCommission !== undefined || raw.merchantName !== undefined) {
    console.log("Auto-detected Sovrn payload");
    return normalizeSovrn(raw);
  }

  // Fallback: treat as generic
  console.log("Unknown network, using generic normalization");
  return {
    order_id: (raw.order_id) as string | undefined,
    sub_id: (raw.sub_id) as string | undefined,
    product_sku: (raw.product_sku) as string | undefined,
    sale_amount: Number(raw.sale_amount || 0),
    commission: Number(raw.commission || 0),
    currency: (raw.currency || "USD") as string,
    timestamp: (raw.timestamp) as string | undefined,
    affiliate_network: (raw.affiliate_network as string) || "unknown",
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawPayload = await req.json();
    console.log("Received sale webhook:", JSON.stringify(rawPayload));

    // Check for network hint in query params (e.g. ?network=awin)
    const url = new URL(req.url);
    const networkHint = url.searchParams.get("network") || undefined;

    const payload = detectAndNormalize(rawPayload, networkHint);
    console.log("Normalized payload:", JSON.stringify(payload));

    // Validate required fields
    if (!payload.sub_id || payload.sale_amount === undefined || payload.commission === undefined) {
      console.error("Missing required fields:", {
        has_sub_id: !!payload.sub_id,
        has_sale_amount: payload.sale_amount !== undefined,
        has_commission: payload.commission !== undefined,
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields: sub_id, sale_amount, commission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find fighter by handle
    const { data: fighter, error: fighterError } = await supabase
      .from("fighters")
      .select("id, handle, full_name")
      .eq("handle", payload.sub_id)
      .eq("status", "approved")
      .single();

    if (fighterError || !fighter) {
      console.error("Fighter not found for sub_id:", payload.sub_id, fighterError);
      return new Response(
        JSON.stringify({ error: "Fighter not found", sub_id: payload.sub_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found fighter:", fighter.id, fighter.full_name);

    // Find product by slug if provided
    let productId: string | null = null;
    if (payload.product_sku) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("slug", payload.product_sku)
        .single();
      if (product) {
        productId = product.id;
      }
    }

    // Get applicable commission rate (priority: fighter+product > fighter > product > global)
    const { data: rates, error: ratesError } = await supabase
      .from("commission_rates")
      .select("rate_percentage, fighter_id, product_id")
      .or(`and(fighter_id.eq.${fighter.id},product_id.eq.${productId}),and(fighter_id.eq.${fighter.id},product_id.is.null),and(fighter_id.is.null,product_id.eq.${productId}),and(fighter_id.is.null,product_id.is.null)`)
      .order("fighter_id", { ascending: false, nullsFirst: false })
      .order("product_id", { ascending: false, nullsFirst: false });

    if (ratesError) console.error("Error fetching commission rates:", ratesError);

    let commissionRate = 50;
    if (rates && rates.length > 0) {
      const specificRate = rates.find(r => r.fighter_id && r.product_id);
      const fighterRate = rates.find(r => r.fighter_id && !r.product_id);
      const productRate = rates.find(r => !r.fighter_id && r.product_id);
      const globalRate = rates.find(r => !r.fighter_id && !r.product_id);
      const selectedRate = specificRate || fighterRate || productRate || globalRate;
      if (selectedRate) commissionRate = Number(selectedRate.rate_percentage);
    }

    const networkCommission = Number(payload.commission);
    const fighterCommission = (networkCommission * commissionRate) / 100;

    console.log("Commission:", { network: networkCommission, fighter: fighterCommission, rate: commissionRate });

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        fighter_id: fighter.id,
        product_id: productId,
        external_order_id: payload.order_id || null,
        sale_amount: Number(payload.sale_amount),
        currency: payload.currency || "USD",
        network_commission: networkCommission,
        fighter_commission: fighterCommission,
        commission_rate_used: commissionRate,
        status: "pending",
        affiliate_network: payload.affiliate_network,
        raw_payload: rawPayload,
        sale_date: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      console.error("Error inserting sale:", saleError);
      return new Response(
        JSON.stringify({ error: "Failed to record sale", details: saleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sale recorded:", sale.id);

    return new Response(
      JSON.stringify({
        success: true,
        sale_id: sale.id,
        fighter_commission: fighterCommission,
        affiliate_network: payload.affiliate_network,
        message: `Sale attributed to ${fighter.full_name}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
