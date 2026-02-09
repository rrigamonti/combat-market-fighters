

# Sovrn Commerce Integration -- Implementation Plan

## Step 1: API Keys (Need from You)

Before I can build anything, I need two secrets stored securely in your backend:

1. **SOVRN_API_KEY** -- Your main Sovrn Commerce API key (found in Sovrn Commerce Dashboard > Account Settings or Developer Center)
2. **SOVRN_SITE_API_KEY** -- Your site-specific API key for product/price comparison APIs

Once you approve this plan, I'll prompt you to enter these keys securely.

## Step 2: Build Product Sync Edge Function

Create `supabase/functions/sync-sovrn-products/index.ts`:
- Call Sovrn Merchant API to find approved combat sports merchants
- Pull product catalogs via Product/Price Comparisons API
- Filter for combat sports keywords (reuse FMTC keyword list)
- Upsert products with `affiliate_network: 'Sovrn'`
- Auto-match brands using the existing `getBrandId` logic

## Step 3: Update Sales Webhook for Sovrn Postbacks

Modify `supabase/functions/receive-sale-webhook/index.ts`:
- Detect Sovrn payloads (via header or field inspection)
- Map Sovrn field names to the existing `WebhookPayload` interface
- Extract fighter `sub_id` from Sovrn's `subid` parameter
- Existing commission calculation logic handles the rest

## Step 4: Build Reporting Edge Function

Create `supabase/functions/sovrn-reporting/index.ts`:
- Pull earnings/transaction data from Sovrn Transactions API
- Sync transaction statuses (pending, confirmed, paid) back to the `sales` table
- Callable from admin UI

## Step 5: Add Frontend API Methods

Update `src/lib/api/firecrawl.ts`:
- Add `syncSovrnProducts()` method
- Add `fetchSovrnReport()` method

## Step 6: Update Admin UI

Modify `src/pages/admin/AdminProducts.tsx`:
- Add "Sync Sovrn" button next to existing FMTC sync
- Add Sovrn source filter/badge

Modify `src/pages/admin/AdminSales.tsx`:
- Add Sovrn as a network filter option

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/sync-sovrn-products/index.ts` |
| Create | `supabase/functions/sovrn-reporting/index.ts` |
| Modify | `supabase/functions/receive-sale-webhook/index.ts` |
| Modify | `src/lib/api/firecrawl.ts` |
| Modify | `src/pages/admin/AdminProducts.tsx` |
| Modify | `src/pages/admin/AdminSales.tsx` |

No database schema changes needed -- existing tables already support multiple affiliate networks.

