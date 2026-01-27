
# Implementation Plan: Four Requested Changes

## Overview
This plan covers items 3-6 from the requested changes list:
- **Item 3**: Update hero headline text
- **Item 4**: Update default banner image (requires new asset)
- **Item 5**: Change demo storefront link to Paul Weir
- **Item 6**: Add Tapology social link support

---

## Change 1: Hero Text Update (Item 3)

**File**: `src/pages/Landing.tsx`

Update the hero headline from:
> "Turn Your Fight Gear Into Income"

To:
> "TURN YOUR ROUTINE INTO REVENUE"

Also update the PageMeta title to match the new messaging.

---

## Change 2: Default Banner Image (Item 4)

**Dependency**: A new default banner image asset is needed.

**Current State**: The default hero image is `src/assets/demo-hero-marcus.jpg`, imported in `FighterStorefront.tsx`.

**Action Required**:
- You will need to provide a new default banner image
- Once provided, I will replace the asset at `src/assets/demo-hero-marcus.jpg` or create a new file and update the import

**Note**: Without a new image asset, I cannot complete this change. Please upload the new default banner image when you approve this plan.

---

## Change 3: Default Demo Storefront Link (Item 5)

**Files to Update**:
1. `src/pages/Landing.tsx` - Line 144: Change `/marcus-rodriguez` to `/paul-weir`
2. `src/pages/ComingSoon.tsx` - Line 44: Change `/marcus-rodriguez` to `/paul-weir`

**Prerequisite**: A fighter with the handle `paul-weir` must exist in the database with status `approved`. If this fighter doesn't exist yet, you'll need to create them via the Admin Fighters page first.

---

## Change 4: Add Tapology Social Link Support (Item 6)

This requires updates across multiple layers:

### 4.1 Database Migration
Add a new column to the `fighters` table:
```sql
ALTER TABLE public.fighters 
ADD COLUMN social_tapology text;
```

### 4.2 Update Fighter Storefront Display
**File**: `src/pages/FighterStorefront.tsx`

- Add Tapology to the `Fighter` interface
- Create a Tapology icon in `SocialIcons` (orange/red theme to match Tapology branding)
- Add Tapology to the `socialLinks` array that renders icons

### 4.3 Update Admin Fighters Page
**File**: `src/pages/admin/AdminFighters.tsx`

- Add `social_tapology` to the `Fighter` interface
- Add `social_tapology` field to edit/create data state
- Add input field in the Edit Fighter dialog
- Add input field in the Create Fighter dialog
- Include `social_tapology` in database insert/update operations

### 4.4 Update Fighter Signup Page
**File**: `src/pages/FighterSignup.tsx`

- Add `socialTapology` to the Zod schema
- Add `socialTapology` to form state
- Add input field in the social media section
- Include `social_tapology` in the fighter insert operation

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Landing.tsx` | Hero text, demo link |
| `src/pages/ComingSoon.tsx` | Demo link |
| `src/pages/FighterStorefront.tsx` | Tapology icon + social link |
| `src/pages/admin/AdminFighters.tsx` | Tapology input fields |
| `src/pages/FighterSignup.tsx` | Tapology input field |
| Database | New `social_tapology` column |

---

## Technical Details

### Tapology Icon Design
Tapology uses an orange/red color scheme. The icon will be a circular badge matching the existing social icon style:
```tsx
tapology: (
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E54B2E]">
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
      {/* T letter or custom icon */}
    </svg>
  </div>
)
```

### Database Types
After migration, the TypeScript types in `src/integrations/supabase/types.ts` will auto-update to include the new `social_tapology` column.

---

## Questions Before Implementation

1. **Default Banner (Item 4)**: Do you have a new banner image to upload, or should I skip this change for now?

2. **Paul Weir Storefront (Item 5)**: Does a fighter with handle `paul-weir` already exist in the database? If not, you'll need to create them first via Admin > Fighters.
