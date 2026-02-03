
# Implementation Plan: Product Import System

## Overview
Build a comprehensive product import system that allows Combat Market to:
1. Import products from affiliate networks via product feeds (CSV/XML)
2. Scrape product data from online shops using Firecrawl
3. Track commissions when products are sold through fighters

The existing infrastructure already handles commission tracking via webhooks and the `sales`/`commission_rates` tables (which need to be created in the database).

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCT IMPORT SOURCES                        │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│   Product Feeds     │   URL Scraping      │   Manual Entry          │
│   (CSV/XML upload)  │   (Firecrawl API)   │   (existing)            │
└─────────┬───────────┴─────────┬───────────┴───────────┬─────────────┘
          │                     │                       │
          ▼                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTS TABLE                               │
│  + source_type (manual | feed | scraped)                            │
│  + affiliate_network (ShareASale, CJ, Impact, etc.)                 │
│  + network_product_id (external identifier)                         │
│  + default_commission_rate (what the network pays us)               │
│  + last_synced_at                                                   │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIGHTER STOREFRONTS                               │
│  Products assigned to fighters with affiliate tracking              │
│  sub_id parameter appended to all "Buy Now" links                   │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SALE ATTRIBUTION                                  │
│  Webhook receives sale → matches fighter via sub_id                 │
│  → calculates commission split → records in sales table             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What Will Be Built

### Phase 1: Database Foundation

**New Tables:**
- `sales` - Track attributed sales and commissions
- `commission_rates` - Flexible commission rate configuration
- `product_import_jobs` - Track bulk import operations

**Products Table Extensions:**
- `source_type` - How the product was added (manual/feed/scraped)
- `affiliate_network` - Which affiliate network (ShareASale, CJ, Impact, etc.)
- `network_product_id` - External product identifier for tracking
- `default_commission_rate` - Commission percentage the network pays
- `last_synced_at` - When product data was last updated

### Phase 2: CSV/XML Feed Import

**New Admin Feature: Import Products**
- Upload CSV or XML product feeds from affiliate networks
- Map feed columns to product fields
- Preview before import
- Bulk create/update products
- Support for common affiliate formats (ShareASale, CJ Affiliate, Impact, etc.)

### Phase 3: Web Scraping Import

**New Admin Feature: Scrape Product**
- Enter a product URL
- Use Firecrawl to extract product data (name, price, description, images)
- Pre-fill product form with scraped data
- Admin reviews and saves

### Phase 4: Admin UI Enhancements

**Enhanced AdminProducts page:**
- Import dropdown with options for Feed Upload and URL Scrape
- Source indicator badges (Manual, Feed, Scraped)
- Affiliate network filter
- Last synced timestamp display
- Bulk sync/refresh capability

---

## Technical Details

### Database Schema

**sales table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| fighter_id | uuid | Reference to fighter |
| product_id | uuid | Reference to product (nullable) |
| external_order_id | text | Order ID from affiliate network |
| sale_amount | numeric | Total sale value |
| currency | text | Currency code (USD) |
| network_commission | numeric | What Combat Market earns |
| fighter_commission | numeric | Fighter's share |
| commission_rate_used | numeric | Rate at time of sale |
| status | enum | pending/confirmed/paid/cancelled |
| affiliate_network | text | Source network |
| raw_payload | jsonb | Original webhook data |
| sale_date | timestamptz | When sale occurred |
| created_at | timestamptz | Record creation |

**commission_rates table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| fighter_id | uuid | Specific fighter (null = all) |
| product_id | uuid | Specific product (null = all) |
| rate_percentage | numeric | Fighter's percentage of commission |
| created_at | timestamptz | When created |
| updated_at | timestamptz | Last updated |

**product_import_jobs table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| source_type | text | feed/scrape |
| status | text | pending/processing/completed/failed |
| file_name | text | Uploaded file name |
| total_products | integer | Count in import |
| imported_count | integer | Successfully imported |
| failed_count | integer | Failed to import |
| error_log | jsonb | Array of errors |
| created_by | uuid | Admin who triggered |
| created_at | timestamptz | When started |
| completed_at | timestamptz | When finished |

### Edge Functions

**firecrawl-scrape-product:**
- Accepts a product URL
- Uses Firecrawl API to scrape product page
- Extracts: name, price, description, images, brand
- Returns structured product data

**import-product-feed:**
- Accepts CSV/XML file content
- Parses and validates product data
- Bulk inserts/updates products
- Returns import statistics

### Frontend Components

**ProductImportDialog:**
- Tabs for Feed Upload vs URL Scrape
- CSV/XML file upload with drag-and-drop
- Column mapping interface for feeds
- URL input with scrape preview for single products

**ProductFeedMapper:**
- Visual interface to map feed columns to product fields
- Preview of mapped data
- Validation feedback

---

## Implementation Order

1. **Database migrations** - Create sales, commission_rates, product_import_jobs tables; add new columns to products
2. **Firecrawl connector setup** - Enable Firecrawl for web scraping
3. **Edge function: firecrawl-scrape-product** - Backend for URL scraping
4. **Edge function: import-product-feed** - Backend for feed processing
5. **Admin UI: Import dialog** - Feed upload and URL scrape interfaces
6. **Admin UI: Enhanced products table** - Source badges, filters, sync status

---

## Affiliate Network Integration Notes

When products are imported, the affiliate URLs typically follow patterns like:
- ShareASale: `shareasale.com/r.cfm?...&subid={sub_id}`
- CJ Affiliate: `anrdoezrs.net/links/...?subid={sub_id}`
- Impact: `impact.com/...?subid={sub_id}`

The existing `getAffiliateUrl` function in the codebase already handles appending the fighter's handle as `sub_id` for commission attribution.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create sales, commission_rates, product_import_jobs tables |
| Database migration | Add source columns to products table |
| `supabase/functions/firecrawl-scrape-product/index.ts` | New - scrape product from URL |
| `supabase/functions/import-product-feed/index.ts` | New - process CSV/XML feeds |
| `src/components/admin/ProductImportDialog.tsx` | New - import UI |
| `src/components/admin/ProductFeedMapper.tsx` | New - column mapping |
| `src/pages/admin/AdminProducts.tsx` | Update - add import button and source display |
| `src/lib/api/firecrawl.ts` | New - Firecrawl API wrapper |

---

## Prerequisites

Before implementing, we need to:
1. Connect the Firecrawl connector for web scraping capabilities
2. Create the database tables (sales, commission_rates, etc.)

---

## Commission Flow Summary

1. **Product imported** with default commission rate from network (e.g., 10% of sale)
2. **Fighter sells product** - customer clicks affiliate link with `sub_id=fighter-handle`
3. **Sale occurs** - affiliate network sends webhook to `receive-sale-webhook`
4. **Commission calculated**:
   - Network pays Combat Market 10% of sale (network_commission)
   - Combat Market pays fighter 50% of that (fighter_commission based on commission_rates)
   - Combat Market keeps remaining 50%
5. **Sale recorded** in sales table with status "pending"
6. **Admin reviews** and updates status to confirmed → paid
