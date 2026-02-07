
# Fix FMTC Product Sync - Correct Field Mapping

## Summary

Update the `sync-fmtc-products` edge function to use JSON format and correct field names based on the actual FMTC API response you provided.

## Problem

The current code expects CSV format with field names that don't match the actual FMTC API response:

| Current Code Expects | Actual FMTC Field | Database Column |
|---------------------|-------------------|-----------------|
| `raw_brand_name` | `brand` | `brand` |
| `image_link` | `image` | `image_url` |
| `affiliate_url` | `url` | `external_url` |
| `merchant_name` | `merchant` | `affiliate_network` |
| `raw_categories` | *(not present)* | `category` |

## Solution

Switch from CSV to JSON format and fix the field mapping to match your working FMTC data.

## Changes

### File: `supabase/functions/sync-fmtc-products/index.ts`

1. **Update interface** to match actual JSON structure:
   ```
   id: number
   brand: string
   label: string
   price: number
   sale_price: number
   image: string
   url: string
   merchant: string
   description: string
   ```

2. **Switch to JSON format** in API request

3. **Fix field mapping**:
   - `product.brand` → brand
   - `product.image` → image_url
   - `product.url` → external_url
   - `product.merchant` → affiliate_network

4. **Update combat sports filter** to check correct fields (`brand`, `label`, `description`, `merchant`)

5. **Remove CSV parsing code** (no longer needed)

## Expected Outcome

After this update, calling the sync function will:
1. Fetch products from FMTC in JSON format
2. Filter for combat sports keywords
3. Import matching products into the database with correct field mapping

This will enable the test showcase with your current FMTC configuration. The same code will work when more merchants are added later.
