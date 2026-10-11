# Move fighters and their storefront products to Combat Market v2.0

Goal: copy every fighter from this site, plus the products in their storefronts, into Combat Market v2.0. Anything v2.0 already has stays as it is. Only missing fighters and missing products get added. Nothing on this site is changed.

## Steps

1. **Look at v2.0 first (read only)**
   Open the v2.0 project and check how it stores fighters, products, brands and the link between a fighter and their products. Check where its data lives too: Lovable Cloud or the external Sliplane database. Nothing is written in this step.

2. **Match the fields**
   Decide which field in this site goes to which field in v2.0 (name, handle, sport, country, bio, photos, social links, products, brands, order in the store). If a field has no match in v2.0, I'll ask you before dropping it or adding it.

3. **Export from this site**
   Make one JSON file with all fighters (all statuses), their brands, their products and the position of each product in the store. Photos stay at their current public links.

4. **Merge rules**
   - Fighter already there if the handle matches, or the email if there's no handle. If it's there, skip it, no overwrite.
   - Product already there if the brand + name match, or the product link. If it's there, reuse it.
   - Brand already there if the name matches (upper/lower case ignored), otherwise add it.
   - Storefront links: add only the fighter + product pairs that are missing, and keep the order.

5. **Dry run in v2.0**
   Before writing anything, produce a report: X fighters to add, Y skipped, Z products to add, W links. You approve it.

6. **Import**
   Write everything in one safe batch inside v2.0, so if something fails nothing is half done. Then check the totals against the report.

## What isn't copied
- Logins and passwords: fighters can't be moved with their account. They get added as profiles without a login, and can claim them later by signing up with the same email (if v2.0 supports that).
- Sales, clicks, views, missions: not copied unless you ask.

## Technical details
- Source: read with psql over `fighters`, `fighter_products`, `products`, `brands`.
- Target: done inside the v2.0 project (cross-project access), going through its own data layer (Sliplane `withPg()` if that's what it uses, per workspace rules). No new connections.
- Duplicates are caught in the app logic, not with new UNIQUE constraints (workspace rule).
- `user_id` gets cleared on import, since auth users don't exist in the target. `storefront_password` is copied only if v2.0 has that field.
