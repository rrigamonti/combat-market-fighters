

# Sovrn Affiliate Link Wrapping

## Problem

Currently, scraped and manually-added products store raw retailer URLs (e.g., `everlast.com/products/...`). When users click "Buy Now," the click goes directly to the retailer without passing through Sovrn's affiliate tracking, so no commissions are earned.

## Solution

Use Sovrn's **Redirect API** to wrap all product URLs into tracked affiliate links at click time. The format is:

```text
https://redirect.viglink.com?key=[SOVRN_API_KEY]&u=[encoded_product_URL]&cuid=[fighter_handle]
```

This approach:
- Earns commissions on every click through Sovrn's network
- Passes the fighter's handle as a CUID (Customer Identifier) for attribution
- Keeps the raw `external_url` in the database unchanged (important for updates/syncing)
- Works for ALL products regardless of source (manual, scraped, feed)

## Implementation Steps

### 1. Create an edge function: `sovrn-affiliate-link`

A lightweight backend function that generates wrapped Sovrn affiliate URLs. This keeps the API key server-side (secure).

- Accepts: `{ url: string, cuid?: string }`
- Returns: `{ affiliate_url: string }`
- Uses the Redirect API format: `https://redirect.viglink.com?key=SOVRN_API_KEY&u=encoded_url&cuid=fighter_handle`

### 2. Create a shared utility: `src/lib/affiliate.ts`

A helper function `getAffiliateUrl(baseUrl, fighterHandle?)` that constructs the Sovrn redirect URL client-side using the public API key (since Sovrn API keys are meant for client-side use in their JS library).

After reviewing Sovrn's docs, the API key is designed to be public (it's used in client-side JavaScript). So we can build the URL client-side without an edge function, keeping it simple and fast.

### 3. Update `FighterProductDetail.tsx`

Replace the current `getAffiliateUrl()` function (which only appends `sub_id` as a query param to the raw URL) with the new utility that wraps through Sovrn's redirect.

### 4. Update `FighterStorefront.tsx`

Update the product card links on the storefront to also use the Sovrn-wrapped URLs when linking to "Buy Now."

### 5. Update `ProductDetail.tsx`

Update the standalone product detail page to wrap the external URL through Sovrn (without fighter attribution since there's no fighter context).

### 6. Backfill commission rates from `sovrn_merchants`

Update imported products' `default_commission_rate` by matching their domain against enabled `sovrn_merchants` entries.

---

## Technical Details

### Affiliate URL Format

```text
https://redirect.viglink.com?key={SOVRN_API_KEY}&u={encodeURIComponent(product.external_url)}&cuid={fighter_handle}
```

The `cuid` parameter maps to the `sub_id` / `subId` field in Sovrn webhook postbacks, which the existing `receive-sale-webhook` function already normalizes.

### New file: `src/lib/affiliate.ts`

```typescript
const SOVRN_API_KEY = "your_api_key"; // Will be loaded from env

export function getSovrnAffiliateUrl(
  productUrl: string,
  fighterHandle?: string
): string {
  const params = new URLSearchParams({
    key: SOVRN_API_KEY,
    u: productUrl,
  });
  if (fighterHandle) {
    params.set("cuid", fighterHandle);
  }
  return `https://redirect.viglink.com?${params.toString()}`;
}
```

Since the Sovrn API key is designed for client-side use, we'll expose it via a `VITE_SOVRN_API_KEY` environment variable. Alternatively, we can use an edge function to keep it fully server-side -- but this adds latency to every link click. The client-side approach is standard for Sovrn.

### Edge function approach (preferred for security)

Instead of exposing the key client-side, we'll create a simple edge function that returns the wrapped URL. The frontend calls it once when the product page loads, caches the result, and uses it for the "Buy Now" button.

### Files to create
- `supabase/functions/sovrn-affiliate-link/index.ts` -- generates affiliate URLs server-side
- `src/lib/affiliate.ts` -- client helper to call the edge function or build URLs

### Files to modify
- `src/pages/FighterProductDetail.tsx` -- use new affiliate URL helper
- `src/pages/FighterStorefront.tsx` -- wrap product links on storefront
- `src/pages/ProductDetail.tsx` -- wrap product link on standalone page
- `supabase/config.toml` -- register new edge function

### Webhook attribution flow (already working)

```text
User clicks "Buy Now" --> redirect.viglink.com (cuid=fighter_handle)
  --> Retailer site --> Purchase
  --> Sovrn webhook --> receive-sale-webhook edge function
  --> normalizeSovrnPayload extracts subId/cuid --> maps to fighter
  --> Commission calculated and recorded in sales table
```

