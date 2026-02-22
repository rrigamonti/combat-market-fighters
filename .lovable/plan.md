

## Filter Carousel Fighters: Distinct Hero vs Profile Images

### Problem
Some fighters in the carousel have hero images that are the same as (or very similar to) their profile images, making the cards look repetitive.

### Solution
Add a filter in the `FeaturedFightersCarousel` query so it only picks fighters where `hero_image_url` is different from `profile_image_url`. This ensures each card shows a unique, dedicated hero image rather than a re-used avatar.

### Technical Change

**File:** `src/components/landing/FeaturedFightersCarousel.tsx`

Update the query (around line 32-38) to add a filter ensuring `hero_image_url` does not equal `profile_image_url`:

```typescript
const { data, error } = await supabase
  .from("fighters")
  .select("id, handle, full_name, sport, country, profile_image_url, hero_image_url")
  .eq("status", "approved")
  .not("hero_image_url", "is", null)
  .filter("hero_image_url", "neq", "profile_image_url")  // NEW: only fighters with distinct hero images
  .order("full_name")
  .limit(6);
```

This is a one-line addition. No other files need to change.

