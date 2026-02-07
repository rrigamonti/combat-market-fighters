
# Plan: FMTC Affiliate Product Feed Integration

## Overview
Integrate with FMTC's aggregated product feed API to automatically import combat sports products. The system will pull products, filter for relevant categories, store them with proper affiliate tracking, and ensure fighter attribution is preserved when generating affiliate links.

## Architecture

```text
+------------------+       +----------------------+       +------------------+
|   FMTC API       | <---> | Edge Function        | <---> | Products Table   |
| (Product Feeds)  |       | (sync-fmtc-products) |       | (Database)       |
+------------------+       +----------------------+       +------------------+
                                    ^
                                    |
+------------------+                |
|   Admin UI       |----------------+
| (Trigger Sync)   |
+------------------+
```

## Components to Build

### 1. FMTC API Secret Configuration
Store the FMTC API key securely as a secret that edge functions can access.

### 2. Edge Function: `sync-fmtc-products`
A new backend function that:
- Connects to FMTC API to fetch product data
- Filters products by combat sports categories (boxing, MMA, martial arts, wrestling, etc.)
- Upserts products into the database with:
  - `source_type`: 'fmtc'
  - `affiliate_network`: extracted from FMTC data (original network name)
  - `network_product_id`: FMTC's unique identifier for deduplication
  - `external_url`: The base affiliate URL from FMTC
  - `last_synced_at`: Current timestamp

### 3. Affiliate Link Attribution (Already Working)
The existing `getAffiliateUrl()` helper in `FighterProductDetail.tsx` and `FighterStorefront.tsx` appends `?sub_id={fighter_handle}` to all external URLs. FMTC-provided links typically support this via query parameter passthrough. The existing `receive-sale-webhook` endpoint already:
- Extracts `sub_id` from incoming webhook payloads
- Looks up the fighter by handle
- Calculates commission based on configured rates
- Records the sale with full attribution

### 4. Admin UI Enhancement
Add to the Admin Products page:
- "Sync from FMTC" button in the Import dropdown
- Progress indicator during sync
- Summary of imported/updated products
- Category filter configuration (optional)

### 5. Product Category Filtering
Define combat sports categories to filter:
- Boxing
- MMA / Mixed Martial Arts
- Muay Thai / Kickboxing
- Wrestling
- Jiu-Jitsu / BJJ
- Martial Arts (general)
- Combat Sports Equipment
- Fight Gear

## Technical Details

### FMTC API Integration
FMTC provides several endpoints depending on your subscription:
- Product feeds by merchant
- Category-based searches
- Coupon/deal feeds

The edge function will:
1. Accept optional parameters (categories, limit, merchants)
2. Call FMTC API with authentication
3. Parse and transform the response
4. Batch upsert into `products` table
5. Return import statistics

### Database Changes
No schema changes required - the existing `products` table already has all necessary columns:
- `network_product_id` for FMTC product ID
- `affiliate_network` for original network name
- `source_type` will be set to 'fmtc'
- `external_url` for the affiliate tracking link
- `last_synced_at` for sync tracking

### Commission Attribution Flow
```text
1. Fighter storefront displays product with base URL from FMTC
2. getAffiliateUrl() appends ?sub_id={fighter_handle}
3. User clicks, is redirected to merchant via FMTC tracking
4. Purchase occurs
5. Affiliate network sends postback to FMTC
6. FMTC (or network) sends webhook to our receive-sale-webhook endpoint
7. Webhook extracts sub_id, attributes sale to fighter
8. Commission calculated based on configured rates
```

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/functions/sync-fmtc-products/index.ts` | Edge function for FMTC API integration |
| Modify | `supabase/config.toml` | Register new edge function |
| Modify | `src/lib/api/firecrawl.ts` | Add FMTC sync function to API layer |
| Modify | `src/pages/admin/AdminProducts.tsx` | Add sync button and UI |
| Modify | `src/components/admin/ProductImportDialog.tsx` | Add FMTC sync tab |

## Implementation Steps

1. **Configure FMTC API Key** - Add the secret via the secrets management tool
2. **Create Edge Function** - Build `sync-fmtc-products` with FMTC API calls
3. **Add Frontend API Method** - Extend the API layer to call the new function
4. **Update Admin UI** - Add sync button and progress feedback
5. **Test End-to-End** - Verify products import and attribution works
6. **Optional: Add Scheduled Sync** - Set up periodic auto-sync via cron

## Notes
- The existing VigLink integration in `index.html` may provide additional monetization on top of FMTC links
- Products will be marked with a "FMTC" badge in the admin table (similar to existing "Feed" badge)
- Duplicate handling uses `network_product_id` + `affiliate_network` as composite key
