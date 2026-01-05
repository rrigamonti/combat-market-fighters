// Production domain for public-facing URLs
export const PRODUCTION_DOMAIN = "https://cm.automationsuite.ai";

// Get the base URL for storefront links
export function getStorefrontUrl(handle: string): string {
  return `${PRODUCTION_DOMAIN}/${handle}`;
}
