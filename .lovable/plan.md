

# Fighter Directory Page

## Overview
Replace the current "Coming Soon" placeholder at `/fighter-directory` with a real directory page that displays all approved fighters in a searchable, filterable grid.

## What It Will Look Like
- A page header with title "Fighter Directory" and a subtitle
- Search bar to filter fighters by name
- Filter dropdown for sport/discipline (e.g., MMA, Boxing, Muay Thai, etc.)
- Filter dropdown for country
- A responsive card grid showing each fighter with:
  - Profile image (with initials fallback)
  - Full name
  - Sport badge
  - Country
  - Short bio (truncated)
  - Link to their storefront (`/:handle`)

## Data Source
- Query the `fighters` table filtered by `status = 'approved'` (already publicly readable via RLS)
- No database changes needed

## Technical Details

### File: `src/pages/ComingSoon.tsx` -- Replace with Fighter Directory

This file currently serves as a placeholder. It will be rewritten as a full directory page:

- Fetch all approved fighters from the `fighters` table
- Client-side search filtering on `full_name` and `short_bio`
- Client-side filtering by `sport` and `country` (derived from the data itself)
- Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Each card links to `/${fighter.handle}`
- Loading skeleton state while data loads
- Empty state if no fighters match filters

### File: `src/App.tsx` -- No changes needed
The route `/fighter-directory` already points to the `ComingSoon` component, so renaming/rewriting it in place keeps routing intact.

### Patterns to Follow
- Same search/filter pattern as the existing Marketplace page (`src/pages/Marketplace.tsx`)
- Same Navbar + Footer layout wrapper
- Uses existing UI components: Input, Select, Badge, Avatar, Card, Skeleton
- Dark theme compatible using existing design tokens

### No Database or Migration Changes
All approved fighters are already publicly queryable via the existing RLS policy "Anyone can view approved fighters".

