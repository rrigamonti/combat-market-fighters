
# Fix: FMTC Product Sync Edge Function

## Problem Identified

The current `sync-fmtc-products` edge function is failing because it uses incorrect API endpoints and parameters:

| Issue | Current (Wrong) | Correct per FMTC Docs |
|-------|-----------------|----------------------|
| Base URL | `https://api.fmtc.co/api/1` | `https://s3.fmtc.co/api/1` |
| Pagination | `per_page` | `page_size` (max 2000) |
| Filtering | `search` keyword | `category_ids` or `merchant_ids` |
| No keyword search | API doesn't support full-text keyword search | Filter by categories, then filter locally |

## Updated API Integration Strategy

FMTC's Products API does not support keyword-based searches. Instead, it provides:
- **`category_ids`** - Filter by FMTC category IDs (need to lookup "Sports" or similar)
- **`merchant_ids`** - Filter by specific merchants (combat sports brands)
- **`page_size`** - Up to 2000 products per page
- **`subid`** - Append a sub_id to all affiliate URLs automatically

### Key Discovery: `subid` Parameter
FMTC can append the fighter's tracking ID directly to affiliate URLs at the API level! This means:
1. We can pass a base `subid` placeholder or handle it client-side
2. The `affiliate_url` field comes pre-monetized with your network IDs

## Implementation Plan

### Step 1: Fetch FMTC Categories
First, call the Categories endpoint to find sports/fitness category IDs:
```
GET https://s3.fmtc.co/api/v3/categories?api_token=KEY&format=json
```
Look for categories like "Sports & Outdoors", "Fitness", "Sporting Goods"

### Step 2: Update Edge Function
Modify `supabase/functions/sync-fmtc-products/index.ts`:

```text
Changes:
1. Fix base URL: https://s3.fmtc.co/api/1/products
2. Fix parameters: page_size (not per_page), remove search
3. Use category_ids for sports categories OR fetch all and filter locally
4. Map response fields correctly:
   - label -> name
   - affiliate_url -> external_url
   - image_link -> image_url
   - merchant_object.name -> affiliate_network
   - id -> network_product_id
   - description -> short_description
   - raw_brand_name or brand_object.name -> brand
5. Add only_has_image_link=1 for quality products
6. Add latest_days=7 to get recent products
```

### Step 3: Combat Sports Filtering
Since FMTC doesn't have a "combat sports" category, we will:
1. Fetch products from broad sports/fitness categories
2. Apply local keyword filtering (current `isCombatSportsProduct` function)
3. This is already in place and working

### Step 4: Pagination Support
FMTC uses cursor-based pagination with `links.next` in responses. Add logic to:
1. Follow pagination until limit is reached
2. Respect `page_size` max of 2000

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-fmtc-products/index.ts` | Fix API URL, parameters, field mapping |

## Technical Details

### Corrected API Call
```typescript
const fmtcBaseUrl = "https://s3.fmtc.co/api/1";
const searchParams = new URLSearchParams({
  api_token: FMTC_API_KEY,
  format: "json",
  page_size: "2000",
  latest: "0",              // Get all products, not just recent
  only_has_image_link: "1", // Quality filter
});

const response = await fetch(`${fmtcBaseUrl}/products?${searchParams}`);
```

### Field Mapping (FMTC -> Database)
```text
FMTC Field              -> Database Column
-----------------------------------------
id                      -> network_product_id
label                   -> name
description             -> short_description
price                   -> price (format to "$X.XX")
sale_price              -> price (if available)
affiliate_url           -> external_url
image_link              -> image_url
raw_brand_name          -> brand
merchant_object.name    -> affiliate_network
raw_categories          -> category
```

### Response Structure
```json
{
  "data": [
    {
      "id": "123456",
      "label": "Everlast Pro Boxing Gloves",
      "description": "Professional boxing gloves...",
      "price": "79.99",
      "sale_price": "59.99",
      "affiliate_url": "https://go.redirectingat.com/...",
      "image_link": "https://cdn.example.com/gloves.jpg",
      "raw_brand_name": "Everlast",
      "merchant_object": { "id": 1234, "name": "Amazon" },
      "raw_categories": "Sports > Boxing > Gloves"
    }
  ],
  "links": {
    "next": "https://s3.fmtc.co/api/1/products?page=2&..."
  },
  "meta": { "total": 50000 }
}
```
