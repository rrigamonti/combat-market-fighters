

# Product Discovery via Firecrawl Site Mapping

## Overview
Add a **"Discover Products"** tab to the Sovrn page that uses Firecrawl to crawl enabled merchant websites and find product URLs automatically. This eliminates the need to manually hunt for URLs before importing.

## How It Works

1. Admin selects an enabled merchant (or multiple) from a dropdown
2. Clicks "Discover Products" -- Firecrawl's **Map** endpoint crawls the merchant's domain and returns all product-like URLs
3. Results are displayed in a selectable list with checkboxes
4. Admin reviews, selects the URLs they want, and clicks "Import Selected" which feeds them into the existing Sovrn import flow

## What Changes

### File: `src/pages/admin/AdminSovrn.tsx`

**Add a 4th tab: "Discover"**

- New tab trigger between "Import Products" and "Performance"
- State variables:
  - `selectedMerchantId` -- which merchant to crawl
  - `discoveredUrls` -- array of URLs returned by Firecrawl Map
  - `selectedUrls` -- set of URLs the admin has checked
  - `isDiscovering` -- loading state
  - `urlSearchFilter` -- text filter on discovered URLs

**Discovery flow:**
1. Dropdown shows only **enabled** merchants (those with a domain)
2. On click, calls `firecrawlApi.scrape` using Firecrawl's `/map` endpoint via a new edge function
3. Filters results to only product-like URLs (containing `/product`, `/shop/`, `/p/`, `/item/`, or ending in common product path patterns)
4. Shows results in a scrollable list with checkboxes and a "Select All" toggle
5. "Import Selected" button feeds checked URLs into the existing `syncSovrnProducts` function

### New Edge Function: `supabase/functions/firecrawl-map-site/index.ts`

A simple edge function that:
- Accepts `{ url, search?, limit? }`
- Calls Firecrawl's `POST /v1/map` endpoint with the merchant domain
- Optionally passes a `search` term (e.g., "boxing gloves") to filter relevant URLs
- Returns the list of discovered URLs

### File: `src/lib/api/firecrawl.ts`

Add a new method:
```
async mapSite(url: string, options?: { search?: string; limit?: number })
```
That invokes the new `firecrawl-map-site` edge function.

### File: `supabase/config.toml`

Add entry for the new edge function with `verify_jwt = false`.

## UI Design for the Discover Tab

- **Merchant selector** dropdown (enabled merchants only)
- **Optional search keyword** input (e.g., "boxing gloves", "mma shorts")
- **"Discover" button** with loading spinner
- **Results area:**
  - Count badge: "Found X product URLs"
  - Select All / Deselect All toggle
  - Scrollable list of URLs with checkboxes, each URL as a clickable external link
  - Text filter to narrow results
- **"Import Selected (N)" button** at the bottom, which reuses the existing import logic

## Why This Approach

- **Firecrawl Map is fast** -- it returns up to 5,000 URLs in seconds without scraping page content
- **No new database tables needed** -- discovery is ephemeral; only imported products get saved
- **Reuses existing import pipeline** -- selected URLs feed directly into `syncSovrnProducts`
- **Firecrawl is already connected** -- the API key is configured and ready
- **Search parameter** lets admins narrow results to specific product types (e.g., "gloves", "shorts")

