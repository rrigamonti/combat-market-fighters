

## Implement Client's Homepage V2 and Fighter Directory Redesign

This plan covers two major pieces from the client's PDF brief and reference screenshots: rebuilding the **LandingV2** page with the new section structure, and redesigning the **Fighter Directory** page (`/fighter-directory`) to match the premium card-based layout shown in the mockups.

---

### Part 1: Homepage V2 (`/v2` -- LandingV2.tsx)

The client's PDF specifies a new section order and content. We'll rebuild `LandingV2.tsx` with these sections, top to bottom:

**Section 1 -- Hero (Split Layout)**
- Left: headline "Turn Your Routine Into Revenue", subheading, primary CTA ("Claim Your Storefront"), no secondary CTA button (the featured fighter image IS the secondary action)
- Right: Featured Fighter block -- a large cinematic fighter portrait with an overlay showing fighter name, discipline, country, and a frosted "Name's Store" button. Entire image links to the fighter's storefront.
- For now, we'll use a hardcoded featured fighter (e.g., Paul Weir or whichever fighter is the current demo). This can later be made dynamic via the database.

**Section 2 -- Platform Scale Strip**
- Stats bar: "$20B+ Global Combat Sports Market", "450M+ Fans", "5M+ Athletes", "150+ Countries"
- Trusted Brands: scrolling greyscale logo strip with subtle hover glow (reuse existing brand logos in `public/brand-logos/`)

**Section 3 -- Featured Fighters Carousel**
- Heading: "FEATURED FIGHTERS" with subtitle "Athletes building their storefronts on Combat Market."
- 3 large rotating fighter cards fetched from the database (approved fighters), with auto-rotate and arrow navigation using `embla-carousel-react` (already installed)
- Each card: fighter image, name, discipline, country flag, frosted personalized button ("James's Store")
- Below carousel: "View Full Directory" link to `/fighter-directory`

**Section 4 -- Why Combat Market**
- 3 bullet points about fighter influence and the platform's value proposition

**Section 5 -- How It Works**
- 3-step layout: Claim Your Storefront, Add Brands You Use, Share and Earn (reuse existing step images)

**Section 6 -- Built For Every Discipline**
- Sports grid with the existing real action photos (MMA, Boxing, BJJ, Muay Thai, Wrestling, Bare Knuckle)

**Section 7 -- For Brands**
- Short section targeting brand partners with bullet points and a "Partner With Fighters" CTA

**Section 8 -- Final CTA**
- "ARE YOU A FIGHTER?" heading, subtext, "Claim Your Storefront" button

**Section 9 -- FAQ**
- Accordion with existing FAQ items

---

### Part 2: Fighter Directory Redesign (`/fighter-directory` -- ComingSoon.tsx)

Complete visual overhaul to match the reference screenshots:

**Section 1 -- Directory Hero**
- Full-width dark hero with a large action photo background
- Headline: "FIND YOUR FIGHTER."
- Subtext: "Discover professional and rising combat athletes building their storefronts on Combat Market."
- CTA: "Claim Your Storefront"

**Section 2 -- Featured Fighters (Top of Directory)**
- Same carousel component as homepage (3 large featured cards with "JUST JOINED" badges)
- Heading: "FEATURED FIGHTERS" with subtitle and navigation arrows

**Section 3 -- Filter Bar**
- Horizontal layout: Search by name, Discipline dropdown, Country dropdown, Status toggle
- The "Weight Class" and "Verified Only" from the mockup will be deferred until those fields exist in the database

**Section 4 -- Fighter Grid**
- Premium card design matching the reference: large fighter image filling the card, name overlay at bottom, discipline + country with flag emoji, frosted "VIEW STOREFRONT" button with arrow
- 4 columns desktop, 2 tablet, 1 mobile (matching the mockup's 4-col layout)

**Section 5 -- Load More**
- "Load More Fighters" button (no infinite scroll, per client spec)

**Section 6 -- Join CTA**
- "ARE YOU A FIGHTER?" section with "Claim Your Storefront" button

---

### Database Considerations

The current `fighters` table already has `profile_image_url`, `hero_image_url`, `full_name`, `sport`, `country`, `handle` -- all fields needed for the cards. We may want to add a `is_featured` boolean column so admins can mark which fighters appear in the featured carousel. We'll add this via a migration.

---

### New Shared Components

1. **`FighterCard`** -- Reusable premium fighter card component used on both homepage and directory. Shows fighter image, name, sport, country (with flag emoji), and personalized frosted store button.

2. **`FeaturedFightersCarousel`** -- Carousel of 3 large featured fighter cards with auto-rotate and arrows. Used on both homepage and directory.

3. **`PlatformStatsStrip`** -- Stats bar + brand logos strip.

4. **`DirectoryHero`** -- Hero section for the directory page with background image.

---

### Technical Details

**Files to create:**
- `src/components/landing/FighterCard.tsx` -- reusable premium card
- `src/components/landing/FeaturedFightersCarousel.tsx` -- carousel with database query
- `src/components/landing/PlatformStatsStrip.tsx` -- stats + brand logos
- `src/components/landing/JoinCTA.tsx` -- shared "Are You A Fighter?" CTA section

**Files to modify:**
- `src/pages/LandingV2.tsx` -- complete rebuild with new sections
- `src/pages/ComingSoon.tsx` -- complete redesign as Fighter Directory
- Database migration: add `is_featured` boolean to `fighters` table (default false)

**Dependencies used (already installed):**
- `embla-carousel-react` for the fighter carousel
- `lucide-react` for icons
- Existing UI components (Button, Badge, Input, Select, etc.)

**Approach for country flags:**
- Use flag emoji derived from country name (a simple lookup map for common countries)

**"Load More" implementation:**
- Fetch fighters in pages of 12, with a "Load More Fighters" button that appends the next batch

