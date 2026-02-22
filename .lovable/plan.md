

## Compliance Audit: PDF Spec vs Current Implementation

### Homepage V2 (`/v2`) -- Gaps Found

| Section | PDF Spec | Current State | Status |
|---|---|---|---|
| Hero (Split Layout) | Left text, right fighter portrait, mobile text-first | Matches | OK |
| Hero Copy | "Turn Your Routine Into Revenue" | Matches | OK |
| Hero CTA | "Claim Your Storefront" (filled red) | Matches | OK |
| Hero Fighter | Frosted "{Name}'s Store" button, entire image clickable | Matches | OK |
| Platform Scale Stats | $20B+, 450M+, 5M+, 150+ | Matches | OK |
| Trusted Brands | 12 brands (Venum, Nike, Everlast, RDX, Adidas, Hayabusa, Kong, WHOOP, Onnit, Under Armour, Gymshark, Therabody), scrolling strip | Only 6 brands (wrong ones), static layout | NEEDS FIX |
| Featured Fighters | 3 rotating cards, arrows, auto-rotate, "View Full Directory" | Matches | OK |
| Why Combat Market | 3 bullets about influence going unpaid | Different bullet text | NEEDS FIX |
| How It Works | 3 steps: Claim, Add Brands, Share and Earn | Matches | OK |
| Built For Every Discipline | MMA, Boxing, BJJ, Muay Thai, Wrestling, Bare Knuckle | Matches (has Kick Boxing instead of Wrestling) | NEEDS FIX |
| For Brands | "Partner With Fighters" CTA | Matches | OK |
| Final CTA | "ARE YOU A FIGHTER?" + "Claim Your Storefront" | Matches | OK |
| FAQ | 4 items | Matches | OK |

### Fighter Directory (`/fighter-directory`) -- Gaps Found

| Section | PDF Spec | Current State | Status |
|---|---|---|---|
| Directory Hero | "FIND YOUR FIGHTER." + CTA | Matches | OK |
| Featured Fighters | 3 rotating tiles, "JUST JOINED" badges | Matches | OK |
| Filter Bar | Search, Discipline, Country, Status dropdowns | Missing "Status" dropdown | MINOR GAP |
| Fighter Grid | 3 cols desktop, 2 tablet, 1 mobile | Currently 4 cols desktop | NEEDS FIX |
| Load More | Button, no infinite scroll | Matches | OK |
| Join CTA | "ARE YOU A FIGHTER?" | Matches | OK |

---

### Changes Required

#### 1. Fix Trusted Brands list and add scrolling animation
**File:** `src/components/landing/PlatformStatsStrip.tsx`

Update the `brandLogos` array to match the 12 brands from the PDF. Since we don't have logo files for all 12, we'll use text placeholders for missing ones and add a CSS-based infinite scrolling animation to the logo strip.

#### 2. Fix "Why Combat Market" bullet text
**File:** `src/pages/LandingV2.tsx`

Update `whyCombatMarketBullets` to match the PDF:
- "Combat athletes influence thousands of purchasing decisions every year."
- "Most of that influence goes unpaid."
- "Combat Market gives fighters a structured way to earn from the brands they already trust."

#### 3. Fix Disciplines list
**File:** `src/pages/LandingV2.tsx`

Change "KICK BOXING" to "WRESTLING" in the `sportsCategories` array (PDF lists: MMA, Boxing, BJJ, Muay Thai, Wrestling, Bare Knuckle).

#### 4. Fix Directory grid columns
**File:** `src/pages/ComingSoon.tsx`

Change grid from `lg:grid-cols-4` to `lg:grid-cols-3 sm:grid-cols-2` to match the PDF spec (3 desktop, 2 tablet, 1 mobile). Apply to both the loading skeleton grid and the actual fighter grid.

---

### Technical Details

- Brand logos: We currently only have image files for 6 brands. For the remaining 6, we'll either need logo images added to `public/brand-logos/` or use styled text placeholders until real logos are available.
- The scrolling logo strip will use a CSS `@keyframes` animation with duplicated logos for a seamless infinite scroll effect.
- The Wrestling discipline card will need a new image (currently using the kickboxing image slot).

