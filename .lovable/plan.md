

# Sovrn Commerce Dashboard -- Merchant Discovery and Management

## Overview

Build an admin dashboard page that lets you browse all your approved Sovrn merchants, toggle which ones are active for Combat Market, and view performance metrics. This replaces the broken keyword-based product sync with a merchant-first approach that actually works with Sovrn's API.

## What You'll Get

- A full list of every merchant Sovrn has approved you for, with their commission rates and categories
- Toggle switches to enable/disable merchants for your platform
- Performance metrics (earnings, clicks, conversions) per merchant
- Filters by category, commission rate, and status
- A way to import products from enabled merchants by pasting product URLs (using Price Comparison API)

## Implementation

### 1. New Database Table: `sovrn_merchants`

Store the merchant data locally so you can track which ones you've enabled and cache their metadata.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| merchant_id | integer | Sovrn's merchant ID |
| name | text | Merchant name |
| domain | text | Merchant website |
| category | text | Merchant category |
| commission_rate | numeric | Average commission % |
| conversion_rate | numeric | Conversion rate |
| avg_order_value | numeric | Average order value |
| enabled | boolean | Whether we use this merchant (default false) |
| last_synced_at | timestamp | When we last pulled data |
| metadata | jsonb | Raw API response data |
| created_at / updated_at | timestamps | Standard timestamps |

RLS: Admin-only access (same pattern as other admin tables).

### 2. New Edge Function: `sync-sovrn-merchants`

Calls the **Approved Merchants API** (`POST https://viglink.io/merchants/rates/summaries`) to fetch all approved merchants with their rates and performance data. Upserts into `sovrn_merchants` table.

### 3. Update Edge Function: `sovrn-reporting`

Add a mode to pull **Merchant Reporting** data (`GET /v1/reports/merchants`) for enabled merchants, showing earnings, clicks, and conversions over a date range.

### 4. Update Edge Function: `sync-sovrn-products`

Rework to accept a list of product URLs (not keywords). For each URL, call the **Price Comparison API** to get structured product data (name, brand, price, image, UPC) and import it -- but only if the merchant is one you've enabled.

### 5. New Admin Page: `/admin/sovrn`

A dedicated Sovrn management dashboard with:

- **Merchants Tab**: Table of all approved merchants with columns for name, domain, category, commission rate, conversion rate, and an enable/disable toggle. Filters for category, minimum commission rate, and enabled status. A "Sync Merchants" button to refresh from the API.

- **Import Products Tab**: Text area to paste product URLs (one per line). Clicking "Import" runs each URL through the Price Comparison API and creates products linked to the matching merchant. Shows progress and results.

- **Performance Tab**: Date-range picker showing merchant-level earnings, clicks, and conversion data for enabled merchants. Pulls from the reporting API.

### 6. Navigation Update

Add "Sovrn" link to the admin sidebar navigation, between existing items.

### 7. Frontend API Methods

Add to `src/lib/api/firecrawl.ts`:
- `syncSovrnMerchants()` -- triggers merchant list sync
- `fetchSovrnMerchantReport(options)` -- pulls merchant performance data
- Update `syncSovrnProducts()` to accept URLs instead of keywords

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/sync-sovrn-merchants/index.ts` |
| Create | `src/pages/admin/AdminSovrn.tsx` |
| Modify | `supabase/functions/sync-sovrn-products/index.ts` (URL-based) |
| Modify | `supabase/functions/sovrn-reporting/index.ts` (add merchant reporting mode) |
| Modify | `src/lib/api/firecrawl.ts` (new API methods) |
| Modify | `src/components/admin/AdminLayout.tsx` (add nav link) |
| Modify | `src/App.tsx` (add route) |
| Migration | Create `sovrn_merchants` table with RLS |
| Config | Register `sync-sovrn-merchants` in `config.toml` |

## Technical Details

**Sovrn Auth**: All API calls use `Authorization: secret {SOVRN_SECRET_KEY}` header. The `SOVRN_API_KEY` is passed as a query parameter or in the request body depending on the endpoint.

**Rate Limits**: Merchant APIs allow 1 request per 10 seconds. The sync function will need to respect this.

**Approved Merchants API** response includes: merchant name, ID, domain, status, commission rates (per geo), program type (CPA/CPC), and performance metrics. We'll flatten this into the `sovrn_merchants` table and store the full response in `metadata` for reference.

