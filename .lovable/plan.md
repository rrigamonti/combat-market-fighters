

# Add Impact and Commission Junction (CJ) Affiliate Networks

## Overview
Extend the existing multi-network affiliate system to support **Impact** and **Commission Junction (CJ Affiliate)**, following the same pattern used for AWIN and Rakuten.

## Changes

### 1. Edge Function: `get-affiliate-link/index.ts`
- Add `buildImpactUrl()` function that constructs Impact tracking links using an `IMPACT_ACCOUNT_SID` and `IMPACT_MEDIA_ID` secret, with the fighter handle mapped to a `SubId1` parameter.
- Add `buildCJUrl()` function that constructs CJ deep links using a `CJ_WEBSITE_ID` secret, with the fighter handle mapped to a `sid` parameter.
- Add `case 'impact':` and `case 'cj':` to the network switch statement.

### 2. Edge Function: `receive-sale-webhook/index.ts`
- Add `normalizeImpact()` function to parse Impact's webhook payload format into the standard `NormalizedSale` shape.
- Add `normalizeCJ()` function to parse CJ's webhook payload format.
- Update `detectAndNormalize()` to recognize Impact and CJ payloads.

### 3. Admin UI Updates
- **`AdminProducts.tsx`** and **`ProductImportDialog.tsx`**: Add "Impact" and "CJ" to any affiliate network dropdown/select options so admins can tag products with these networks.
- **`AdminSales.tsx`**: Add "Impact" and "CJ" to the network filter dropdown so sales from these networks are filterable.

### 4. Secrets Required
Before deployment, two new sets of secrets will need to be configured:
- **Impact**: `IMPACT_ACCOUNT_SID` and `IMPACT_MEDIA_ID`
- **CJ**: `CJ_WEBSITE_ID`

These will be requested from you before proceeding with the implementation.

### 5. No Database Changes
The existing `affiliate_network` text column on `products` and `sales` tables already supports arbitrary network names -- no schema migration needed.

## Technical Details

**Impact deep link format:**
```
https://app.impact.com/ad/click/{ACCOUNT_SID}/{MEDIA_ID}?url={encoded_url}&subId1={fighter_handle}
```

**CJ deep link format:**
```
https://www.anrdoezrs.net/links/{WEBSITE_ID}/type/dlg/{encoded_url}?sid={fighter_handle}
```

Both formats follow industry-standard patterns and mirror how AWIN/Rakuten are already handled in the codebase.

