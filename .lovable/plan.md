
# Display Brand Logos in Products Table

## Problem

The brand logo is not appearing in the admin products table because the FMTC products were imported **before** the automatic brand matching was added. 

Current state:
- The Nike brand exists in the database with logo: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png`
- The 4 Nike products have `brand_id = null` (not linked to the brand)
- The UI code already supports showing logos when `brand_id` is set (lines 551-561)

## Solution

Run a one-time database update to link existing products to their brands based on matching brand names.

### Database Migration

```sql
UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE LOWER(p.brand) = LOWER(b.name)
  AND p.brand_id IS NULL;
```

This will:
1. Find all products where `brand_id` is null
2. Match them to brands with the same name (case-insensitive)
3. Set the `brand_id` foreign key

### Expected Result

After the migration:
- All 4 Nike products will have `brand_id` pointing to the Nike brand
- The Nike logo will appear in the Brand column of the products table
- Future FMTC imports will automatically match brands (using the code we already added)

### Files Changed
- No code changes needed - the UI already supports brand logos
- Database migration to link existing products to brands
