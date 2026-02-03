
# Updated Implementation Plan: Product Import System

## Backward Compatibility Analysis

After thorough review, I've identified the following key points to ensure no existing functionality breaks:

### Existing Features That MUST Continue Working
| Feature | Files Involved | Risk Level |
|---------|----------------|------------|
| Fighter storefronts | FighterStorefront.tsx | Low - No changes needed |
| Product detail pages | ProductDetail.tsx, FighterProductDetail.tsx | Low - No changes needed |
| Marketplace | Marketplace.tsx | Low - No changes needed |
| Admin Products (manual add/edit/delete) | AdminProducts.tsx | Medium - Will be extended |
| Admin Sales page | AdminSales.tsx | Low - Already built, just needs tables |
| Admin Commissions page | AdminCommissions.tsx | Low - Already built, just needs tables |
| Affiliate URL tracking | getAffiliateUrl in FighterProductDetail.tsx | Low - No changes needed |
| Webhook handler | receive-sale-webhook/index.ts | Low - Already built, just needs tables |

### Database Changes Strategy

All new columns will use **nullable defaults** to ensure existing products continue to work without modification:

**Products table extensions** (all optional):
```sql
source_type TEXT DEFAULT 'manual' -- existing products marked as 'manual'
affiliate_network TEXT -- NULL for manually added products
network_product_id TEXT -- NULL for manually added products  
default_commission_rate NUMERIC -- NULL uses global default
last_synced_at TIMESTAMPTZ -- NULL for manual products
```

---

## Phase 1: Database Foundation

### New Tables

**sales table:**
| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | uuid | No | gen_random_uuid() | Primary key |
| fighter_id | uuid | No | - | FK to fighters |
| product_id | uuid | Yes | NULL | FK to products (optional) |
| external_order_id | text | Yes | NULL | Order ID from network |
| sale_amount | numeric | No | - | Total sale value |
| currency | text | No | 'USD' | Currency code |
| network_commission | numeric | No | - | What we earn |
| fighter_commission | numeric | No | - | Fighter's share |
| commission_rate_used | numeric | No | - | Rate at time of sale |
| status | text | No | 'pending' | pending/confirmed/paid/cancelled |
| affiliate_network | text | Yes | NULL | Source network |
| raw_payload | jsonb | Yes | NULL | Original webhook data |
| sale_date | timestamptz | Yes | NULL | When sale occurred |
| created_at | timestamptz | No | now() | Record creation |

**commission_rates table:**
| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | uuid | No | gen_random_uuid() | Primary key |
| fighter_id | uuid | Yes | NULL | NULL = all fighters |
| product_id | uuid | Yes | NULL | NULL = all products |
| rate_percentage | numeric | No | - | Fighter's % of commission |
| created_at | timestamptz | No | now() | When created |
| updated_at | timestamptz | No | now() | Last updated |

**product_import_jobs table:**
| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | uuid | No | gen_random_uuid() | Primary key |
| source_type | text | No | - | 'feed' or 'scrape' |
| status | text | No | 'pending' | pending/processing/completed/failed |
| file_name | text | Yes | NULL | Uploaded file name |
| total_products | integer | No | 0 | Count in import |
| imported_count | integer | No | 0 | Successfully imported |
| failed_count | integer | No | 0 | Failed to import |
| error_log | jsonb | Yes | NULL | Array of errors |
| created_by | uuid | Yes | NULL | Admin who triggered |
| created_at | timestamptz | No | now() | When started |
| completed_at | timestamptz | Yes | NULL | When finished |

### RLS Policies

All new tables will have proper RLS:
- **sales**: Admins can manage all; fighters can view their own
- **commission_rates**: Admins only
- **product_import_jobs**: Admins only

---

## Phase 2: Firecrawl Integration

### Connector Setup
Enable the Firecrawl connector to allow web scraping of product pages from online shops.

### New Edge Function: firecrawl-scrape-product

```text
POST /functions/v1/firecrawl-scrape-product
Body: { "url": "https://shop.example.com/product/boxing-gloves" }

Response:
{
  "success": true,
  "data": {
    "name": "Pro Boxing Gloves 16oz",
    "price": "$129.99",
    "description": "Professional grade...",
    "image_url": "https://...",
    "brand": "Everlast"
  }
}
```

The function will:
1. Accept a product URL
2. Call Firecrawl API to scrape the page
3. Extract structured product data using LLM
4. Return data for admin to review/edit before saving

---

## Phase 3: Feed Import System

### New Edge Function: import-product-feed

```text
POST /functions/v1/import-product-feed
Body: { 
  "content": "...csv or xml content...",
  "format": "csv",
  "mapping": { "name": 0, "price": 3, "url": 5 },
  "affiliate_network": "ShareASale"
}
```

The function will:
1. Parse CSV/XML content
2. Apply column mapping
3. Validate required fields
4. Upsert products (update existing by network_product_id, insert new)
5. Return import statistics

---

## Phase 4: Admin UI Enhancements

### AdminProducts.tsx Changes

```text
Current:
+-------------------------------------------+
| Products                                  |
| [+ Add Product]                           |
+-------------------------------------------+
| Product | Brand | Price | Status | Actions|
+-------------------------------------------+

Enhanced:
+-------------------------------------------+
| Products                                  |
| [Import ▼] [+ Add Product]               |
|  ├─ Upload Feed (CSV/XML)                |
|  └─ Scrape from URL                      |
+-------------------------------------------+
| Product | Brand | Source | Price | Actions|
+-------------------------------------------+
              ↑
         New column showing Manual/Feed/Scraped badges
```

### New Component: ProductImportDialog

- Tab 1: **Upload Feed**
  - Drag-and-drop file upload
  - Auto-detect format (CSV/XML)
  - Column mapping UI with preview
  - Affiliate network selector
  - Import button with progress

- Tab 2: **Scrape from URL**
  - URL input field
  - "Scrape" button
  - Preview of extracted data
  - Edit form pre-filled with scraped data
  - Save button

---

## Implementation Order

1. **Database migration** - Create sales, commission_rates, product_import_jobs tables
2. **Database migration** - Add source columns to products table
3. **Firecrawl connector** - Enable for web scraping
4. **Edge function: firecrawl-scrape-product** - Backend for URL scraping
5. **Edge function: import-product-feed** - Backend for CSV/XML processing
6. **ProductImportDialog component** - UI for imports
7. **AdminProducts.tsx updates** - Import button and source badges

---

## Files to Create/Modify

| File | Action | Breaking Changes |
|------|--------|------------------|
| Database migration | Create 3 new tables | None |
| Database migration | Add columns to products | None (all nullable) |
| supabase/functions/firecrawl-scrape-product/index.ts | New | None |
| supabase/functions/import-product-feed/index.ts | New | None |
| src/components/admin/ProductImportDialog.tsx | New | None |
| src/components/admin/ProductFeedMapper.tsx | New | None |
| src/pages/admin/AdminProducts.tsx | Update | None - additive only |

---

## Testing Checklist

Before considering implementation complete:

1. **Existing functionality**
   - [ ] Manual product creation still works
   - [ ] Manual product editing still works
   - [ ] Manual product deletion still works
   - [ ] Fighter storefronts display products correctly
   - [ ] Affiliate links have correct sub_id tracking
   - [ ] Product detail pages work
   - [ ] Marketplace displays all products

2. **New functionality**
   - [ ] CSV feed import works
   - [ ] XML feed import works
   - [ ] URL scraping extracts product data
   - [ ] Import jobs are tracked
   - [ ] Source badges display correctly
   - [ ] Commission rates can be configured
   - [ ] Sales are recorded via webhook
   - [ ] Admin Sales page shows data

---

## Prerequisites Before Implementation

1. **Firecrawl connector** - Need to connect for web scraping capability
2. **Database tables** - Must be created before Edge Functions can work

---

## Summary

This plan:
- Creates the missing database tables (sales, commission_rates, product_import_jobs)
- Extends the products table with optional metadata columns
- Adds two Edge Functions for importing products
- Enhances the Admin UI with import capabilities
- Maintains 100% backward compatibility with all existing features
