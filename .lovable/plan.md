

# Add Sort Options to the Marketplace Page

## Overview
Add a "Sort by" dropdown to the existing Marketplace page, matching the pattern already used on the Fighter Directory. This includes standard sorting options plus a "Product Count" sort that orders brand groups by how many products each brand has.

## Changes

### File: `src/pages/Marketplace.tsx`

1. **Add state**: New `sortBy` state variable (default: `"name-asc"`)
2. **Add sort dropdown**: A new `<Select>` component in the filter bar with an `ArrowUpDown` icon, offering these options:
   - Name A-Z (default)
   - Name Z-A
   - Price: Low to High
   - Price: High to Low
   - Brand A-Z
   - Brand Z-A
   - Product Count (sorts brand groups by number of products, most first)
3. **Update sorting logic**:
   - For product-level sorts (name, price), apply sorting to `filteredProducts` before grouping
   - For brand-level sorts (brand name, product count), apply sorting to the `productsByBrand` grouping step
   - "Product Count" sort orders brand sections so brands with the most products appear first

### No other files need changes
- No database changes
- No new routes or components

