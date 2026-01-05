// Production domain for public-facing URLs
export const PRODUCTION_DOMAIN = "https://cm.automationsuite.ai";

// Get the base URL for storefront links
export function getStorefrontUrl(handle: string): string {
  return `${PRODUCTION_DOMAIN}/${handle}`;
}

// Get full canonical URL for a path
export function getCanonicalUrl(path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${PRODUCTION_DOMAIN}${cleanPath}`;
}
