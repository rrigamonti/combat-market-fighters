import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Interface for incoming webhook payload
interface WebhookPayload {
  order_id?: string;
  sub_id?: string;        // Fighter handle or ID passed in affiliate link
  product_sku?: string;   // Product slug or external identifier
  sale_amount: number;
  commission: number;     // Network commission (what Combat Market earns)
  currency?: string;
  timestamp?: string;
  affiliate_network?: string;
  [key: string]: unknown; // Allow additional fields
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret (basic security)
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the incoming payload
    const payload: WebhookPayload = await req.json();
    console.log("Received sale webhook:", JSON.stringify(payload));

    // Validate required fields
    if (!payload.sub_id || payload.sale_amount === undefined || payload.commission === undefined) {
      console.error("Missing required fields:", { 
        has_sub_id: !!payload.sub_id, 
        has_sale_amount: payload.sale_amount !== undefined,
        has_commission: payload.commission !== undefined 
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields: sub_id, sale_amount, commission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find fighter by handle (sub_id)
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
        console.log("Found product:", productId);
      }
    }

    // Get applicable commission rate with priority:
    // 1. Fighter + Product specific
    // 2. Fighter default (product NULL)
    // 3. Product default (fighter NULL)
    // 4. Global default (both NULL)
    const { data: rates, error: ratesError } = await supabase
      .from("commission_rates")
      .select("rate_percentage, fighter_id, product_id")
      .or(`and(fighter_id.eq.${fighter.id},product_id.eq.${productId}),and(fighter_id.eq.${fighter.id},product_id.is.null),and(fighter_id.is.null,product_id.eq.${productId}),and(fighter_id.is.null,product_id.is.null)`)
      .order("fighter_id", { ascending: false, nullsFirst: false })
      .order("product_id", { ascending: false, nullsFirst: false });

    if (ratesError) {
      console.error("Error fetching commission rates:", ratesError);
    }

    // Find the best matching rate
    let commissionRate = 50; // Default fallback
    if (rates && rates.length > 0) {
      // Priority: fighter+product > fighter only > product only > global
      const specificRate = rates.find(r => r.fighter_id && r.product_id);
      const fighterRate = rates.find(r => r.fighter_id && !r.product_id);
      const productRate = rates.find(r => !r.fighter_id && r.product_id);
      const globalRate = rates.find(r => !r.fighter_id && !r.product_id);
      
      const selectedRate = specificRate || fighterRate || productRate || globalRate;
      if (selectedRate) {
        commissionRate = Number(selectedRate.rate_percentage);
      }
    }

    console.log("Using commission rate:", commissionRate, "%");

    // Calculate fighter commission
    const networkCommission = Number(payload.commission);
    const fighterCommission = (networkCommission * commissionRate) / 100;

    console.log("Commission breakdown:", {
      network: networkCommission,
      fighter: fighterCommission,
      rate: commissionRate
    });

    // Insert the sale record
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
        affiliate_network: payload.affiliate_network || null,
        raw_payload: payload,
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

    console.log("Sale recorded successfully:", sale.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sale_id: sale.id,
        fighter_commission: fighterCommission,
        message: `Sale attributed to ${fighter.full_name}`
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
