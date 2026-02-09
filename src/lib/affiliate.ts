import { supabase } from "@/integrations/supabase/client";

/**
 * Get a Sovrn-wrapped affiliate URL via the edge function.
 * Falls back to the raw URL if the edge function fails.
 */
export async function getSovrnAffiliateUrl(
  productUrl: string,
  fighterHandle?: string
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("sovrn-affiliate-link", {
      body: {
        url: productUrl,
        cuid: fighterHandle || undefined,
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
