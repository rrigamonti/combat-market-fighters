

# Sovrn Commerce Integration

## Overview

Integrate Sovrn Commerce as a second affiliate network alongside FMTC, covering all four areas: product imports, link monetization, sales tracking, and reporting.

## What We'll Build

### 1. Sovrn Product Sync (Edge Function)

Create a new `sync-sovrn-products` edge function that:
- Calls the Sovrn Merchant API to discover approved combat sports merchants
- Uses the Sovrn Product/Price Comparisons API to pull product catalogs
- Filters for combat sports products using the same keyword list as FMTC
- Upserts products with `source_type: 'sovrn'` and `affiliate_network: 'Sovrn'`
- Automatically matches/creates brands using the existing `getBrandId` logic

### 2. Sovrn Link Monetization

Update the affiliate URL builder to support Sovrn links:
- Use Sovrn's Link API (`api.viglink.com/api/link/`) to check if URLs can be monetized
- For Sovrn-sourced products, ensure affiliate URLs include the fighter's `sub_id` for attribution
- The existing `getAffiliateUrl` helper already appends `sub_id` -- we just need to ensure Sovrn URLs are formatted correctly

### 3. Sales Webhook for Sovrn

Update the existing `receive-sale-webhook` edge function to handle Sovrn's postback format:
- Sovrn sends transaction data with their own field names
- Add a Sovrn-specific payload parser that maps their fields to the existing `WebhookPayload` interface
- Extract the `sub_id` (fighter handle) from Sovrn's `subid` parameter
- The existing commission calculation logic applies automatically

### 4. Sovrn Reporting (Transactions API)

Create a `sovrn-reporting` edge function that:
- Calls Sovrn's Transactions API to pull real-time earnings data
- Syncs transaction statuses (pending, confirmed, paid) back to the `sales` table
- Can be triggered manually from admin or on a schedule

### 5. Admin UI Updates

- Add a "Sync Sovrn" button alongside the existing FMTC sync in the admin products page
- Add Sovrn as a filter option in the products table (source badge)
- Show Sovrn-specific metrics in the admin reporting/analytics pages

## Prerequisites

Before implementation, you'll need to provide:
- **Sovrn API Key** -- from your Sovrn Commerce account (Developer Center)
- **Sovrn Site API Key** -- used for the Price Comparisons API

These will be stored securely as backend secrets.

## Technical Details

### New Files
- `supabase/functions/sync-sovrn-products/index.ts` -- Product sync edge function
- `supabase/functions/sovrn-reporting/index.ts` -- Transaction reporting edge function

### Modified Files
- `supabase/functions/receive-sale-webhook/index.ts` -- Add Sovrn payload parsing
- `src/lib/api/firecrawl.ts` -- Add `syncSovrnProducts()` and `fetchSovrnReport()` API methods
- `src/pages/admin/AdminProducts.tsx` -- Add Sovrn sync button and source filter
- `src/pages/admin/AdminSales.tsx` -- Add Sovrn network filter
- `supabase/config.toml` -- Register new edge functions with `verify_jwt = false`

### Database Changes
- No schema changes needed -- existing `products`, `sales`, and `brands` tables already support multiple affiliate networks via the `affiliate_network` and `source_type` columns

### Secrets Required
- `SOVRN_API_KEY` -- Main API authentication key
- `SOVRN_SITE_API_KEY` -- Site-specific key for product/price APIs

## Implementation Order
1. Store Sovrn API keys as secrets
2. Build the product sync edge function
3. Update the webhook to handle Sovrn postbacks
4. Build the reporting edge function
5. Update admin UI with Sovrn controls

