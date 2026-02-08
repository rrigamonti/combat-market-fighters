
# Automatic Brand Matching for FMTC Product Import

## Problem

When the FMTC sync function imports products, it stores the brand name as text in the `products.brand` column but leaves the `brand_id` foreign key as `null`. This causes:
- Brand logos not displaying on product pages
- Brand-based filtering to fail
- Manual work required to link existing brands to imported products
- New imported products unable to leverage existing brand identity

## Solution

Add automatic brand lookup and creation logic to the FMTC sync edge function that:
1. Extracts the brand name from each FMTC product
2. Looks up if that brand already exists in the database
3. If found, uses the existing `brand_id` (with its logo)
4. If not found, creates a new brand entry (without logo for now)
5. Sets the `brand_id` when upserting the product

## Implementation Details

### Changes to `supabase/functions/sync-fmtc-products/index.ts`

**New function: `getBrandId`**
```
Purpose: Look up or create a brand, returns the UUID

Logic:
1. Check if brand name exists in the brands table (case-insensitive)
2. If found, return the brand UUID
3. If not found, insert a new brand with the name and no logo
4. Return the newly created brand UUID
```

**Updated product import loop:**
- Before creating `productData`, call `getBrandId(brandName)` to get the brand UUID
- Add `brand_id: brandId` to the product data object
- This ensures each imported product links to a brand (existing or newly created)

**Benefits:**
- Automatically links imported products to existing brands with logos
- Creates missing brands on first import (can be updated with logos later)
- Prevents duplicate brand creation through intelligent lookup
- No changes needed to the database schema (brand_id column already exists)
- One-time setup per unique brand discovered

### Edge Cases Handled
- Brand names with different casing (normalized via database UNIQUE constraint)
- Multiple products with same brand (reuses existing brand_id)
- New brands discovered from FMTC (creates them automatically)
- Existing brands in database (preserves their logos)

## Testing Approach
1. Run the updated sync function against your FMTC data
2. Verify Nike and any other brands are linked with `brand_id` values
3. Check that brand logos display on product detail pages
4. Confirm brand-based filtering works in the marketplace

## Files to Modify
- `supabase/functions/sync-fmtc-products/index.ts` - Add `getBrandId` function and update product upsert logic
