
# Add Filters to Admin Products Page

## Overview
Add a filter bar to the Admin Products page with dropdowns for **Category**, **Brand**, and **Source** (manual, fmtc, sovrn), plus a text search. Currently the page has no filtering at all.

## What Changes

### Filter bar (above the products table)
A row of controls between the header and the table:
- **Search input** -- filters by product name (with search icon)
- **Category dropdown** -- populated from distinct categories in the loaded products (e.g. Boxing, MMA, Gloves, Apparel, etc.)
- **Brand dropdown** -- populated from distinct brands in the loaded products
- **Source dropdown** -- filters by source_type (Manual, FMTC, Sovrn)
- **Status dropdown** -- Active / Inactive / All
- A count label showing "Showing X of Y products"

All filters work client-side on the already-loaded products array, so no extra database queries are needed.

## Technical Details

### File: `src/pages/admin/AdminProducts.tsx`

1. Add state variables for each filter:
   - `searchQuery`, `categoryFilter`, `brandFilter`, `sourceFilter`, `statusFilter` (all strings, default `"all"` or `""`)

2. Derive unique categories and brands from the `products` array (same pattern used in AdminSovrn.tsx):
   ```text
   const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
   const brandNames = Array.from(new Set(products.map(p => p.brand).filter(Boolean)))
   ```

3. Add a `filteredProducts` computed value that chains all filters

4. Insert a filter bar row between the header and the table, using the same component pattern as AdminSovrn (Search input + Select dropdowns)

5. Render `filteredProducts` instead of `products` in the table body

6. Update the "No products" empty state to distinguish between "no products at all" vs "no products match filters"

### No other files need changes
