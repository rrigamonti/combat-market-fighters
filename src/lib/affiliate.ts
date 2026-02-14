import { supabase } from "@/integrations/supabase/client";

/**
 * Get a network-aware affiliate URL via the unified edge function.
 * Supports Sovrn, AWIN, Rakuten, and future networks.
 * Falls back to the raw URL if the edge function fails.
 */
export async function getAffiliateUrl(
  productUrl: string,
  fighterHandle?: string,
  options?: {
    productId?: string;
    affiliateNetwork?: string;
    networkProductId?: string;
  }
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("get-affiliate-link", {
      body: {
        url: productUrl,
        fighter_handle: fighterHandle || undefined,
        product_id: options?.productId || undefined,
        affiliate_network: options?.affiliateNetwork || undefined,
        network_product_id: options?.networkProductId || undefined,
      },
    });

    if (error || !data?.affiliate_url) {
      console.error("Failed to get affiliate URL:", error);
      return productUrl;
    }

    return data.affiliate_url;
  } catch (err) {
    console.error("Affiliate URL generation failed:", err);
    return productUrl;
  }
}

/** @deprecated Use getAffiliateUrl instead */
export const getSovrnAffiliateUrl = getAffiliateUrl;
