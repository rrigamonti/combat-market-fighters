

# Multi-Network Affiliate System

## What You Already Have (Good News)

Your current architecture is already network-agnostic in several key areas:

- **Products table**: Has `affiliate_network`, `source_type`, and `external_url` fields -- any network's products fit here
- **Sales table**: Has `affiliate_network` field and `raw_payload` for storing each network's webhook data
- **Commission tracking**: The `commission_rates` table and fighter attribution via `sub_id` work regardless of which network generated the sale
- **Webhook receiver**: `receive-sale-webhook` already normalizes Sovrn payloads and has a generic fallback -- just needs normalizers for AWIN and Rakuten
- **Fighter storefronts**: Product assignment and display is already network-agnostic

## What Needs to Be Built

### Phase 1: Network-Aware Affiliate Links

Currently, all affiliate URLs are wrapped through Sovrn's redirect API. For multi-network support:

- Create a unified `get-affiliate-link` backend function that checks the product's `affiliate_network` field and wraps the URL with the correct network's method:
  - **Sovrn**: `redirect.viglink.com` (existing)
  - **AWIN**: `https://www.awin1.com/cread.php?awinmid={merchant_id}&awinaffid={your_id}&clickref={fighter_handle}&p={product_url}`
  - **Rakuten**: `https://click.linksynergy.com/deeplink?id={your_id}&mid={merchant_id}&u1={fighter_handle}&murl={product_url}`
- The `fighter_handle` is always passed as the click reference / sub-ID parameter so attribution works across all networks

### Phase 2: Webhook Normalizers for Each Network

Extend the existing `receive-sale-webhook` function to detect and normalize payloads from each network:

- **AWIN**: Posts transaction data with `clickRef` (your fighter handle), `commissionAmount`, `saleAmount`, `transactionId`
- **Rakuten**: Posts with `u1` parameter (fighter handle), `commissions`, `sales`, `order_id`
- **Sovrn**: Already handled
- All normalized to the same internal format: `{ sub_id, sale_amount, commission, order_id, affiliate_network }`

Each network gets its own postback URL (or shared URL with a network identifier query param).

### Phase 3: Product Discovery per Network

Create backend functions for each network's product/merchant API:

- **AWIN Product Search**: Uses AWIN's Product Search API to find products by keyword, category, merchant
- **Rakuten Product Search**: Uses Rakuten's Product Search API (LinkShare)
- These return normalized product data that gets imported into the existing `products` table with the correct `affiliate_network` tag

The admin UI would get a unified "Discover Products" page where you select the network, search, and import -- similar to the current Sovrn Discover tab.

### Phase 4: Admin Dashboard Updates

- Add AWIN and Rakuten to the network filter dropdown on the Sales page (already has the filter, just needs more options)
- Add network-specific pages similar to AdminSovrn for managing AWIN and Rakuten merchants/programs
- Update summary cards to show per-network breakdowns

### Phase 5: Fighter Dashboard

- Fighters already see their own sales (via RLS policies on the `sales` table)
- Add a commission summary view showing their earnings breakdown by network, status (pending/confirmed/paid), and time period

## How the Commission Flow Works (All Networks)

```text
Fighter Storefront
       |
       v
  "Buy Now" clicked
       |
       v
  get-affiliate-link (backend function)
       |-- checks product.affiliate_network
       |-- wraps URL with correct network params
       |-- passes fighter handle as sub_id / clickref / u1
       |
       v
  Customer buys on retailer site
       |
       v
  Network sends postback/webhook
       |-- AWIN: POST with clickRef = fighter handle
       |-- Rakuten: POST with u1 = fighter handle
       |-- Sovrn: POST with subId = fighter handle
       |
       v
  receive-sale-webhook (backend function)
       |-- detects network from payload
       |-- normalizes to standard format
       |-- looks up fighter by handle (sub_id)
       |-- applies commission rate (global/fighter/product)
       |-- splits: network_commission (what you earn) vs fighter_commission (their cut)
       |-- inserts into sales table
       |
       v
  Admin sees all sales, Fighter sees their own
```

## API Keys / Credentials Needed

Each network requires its own set of credentials stored as backend secrets:

- **AWIN**: Publisher ID + API Key
- **Rakuten**: Site ID + API Token (also called LinkShare)
- **Sovrn**: Already configured (API Key + Secret Key)

## No Database Changes Needed

The existing schema handles everything. The `products.affiliate_network` and `sales.affiliate_network` fields already support storing which network a product/sale belongs to.

## Implementation Order

1. **Phase 1** first (affiliate link routing) -- this is the core revenue mechanism
2. **Phase 2** next (webhook handling) -- so sales get recorded
3. **Phase 3** (product discovery) -- to populate the catalog
4. Phases 4-5 (UI) -- polish and visibility

## Technical Summary

| Component | Status | Work Needed |
|-----------|--------|-------------|
| Products table | Ready | No changes |
| Sales table | Ready | No changes |
| Commission rates | Ready | No changes |
| Fighter attribution | Ready | No changes |
| Sovrn link wrapping | Done | Refactor into unified function |
| AWIN link wrapping | New | Build in unified function |
| Rakuten link wrapping | New | Build in unified function |
| Webhook receiver | Partial | Add AWIN + Rakuten normalizers |
| AWIN product search | New | New backend function |
| Rakuten product search | New | New backend function |
| Admin network pages | Partial | Extend existing UI |
| Fighter earnings view | Partial | Add summary dashboard |

