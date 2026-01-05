import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAnalytics() {
  // Prevent duplicate tracking in React strict mode
  const trackedViews = useRef<Set<string>>(new Set());
  const trackedClicks = useRef<Set<string>>(new Set());

  const trackStorefrontView = useCallback(async (fighterId: string) => {
    if (trackedViews.current.has(fighterId)) return;
    trackedViews.current.add(fighterId);

    try {
      await supabase.from("storefront_views").insert({
        fighter_id: fighterId,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the page
      console.error("Failed to track storefront view:", error);
    }
  }, []);

  const trackProductClick = useCallback(async (fighterId: string, productId: string) => {
    const key = `${fighterId}-${productId}`;
    if (trackedClicks.current.has(key)) return;
    trackedClicks.current.add(key);

    try {
      await supabase.from("product_clicks").insert({
        fighter_id: fighterId,
        product_id: productId,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track product click:", error);
    }
  }, []);

  return { trackStorefrontView, trackProductClick };
}
