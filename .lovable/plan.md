
# Implementation Plan: Update Open Graph Preview Image

## Overview
Update the OG (Open Graph) image so that when the Combat Market link is shared on social media, messaging apps, or other platforms, it displays the new hero screenshot showing the landing page with "TURN YOUR ROUTINE INTO REVENUE" headline.

---

## What Will Change

When someone shares the Combat Market link on WhatsApp, Twitter, Facebook, LinkedIn, Discord, or any other platform, they'll see this new preview image instead of the current one.

---

## Technical Steps

### Step 1: Copy the New Image
Copy the uploaded image to the `public` folder as `og-image.jpg`, replacing the existing OG image.

**File**: `public/og-image.jpg`

The image needs to be in the `public` folder (not `src/assets`) because OG images must be accessible via a direct URL for social media crawlers to fetch them.

---

## Files to Modify

| File | Action |
|------|--------|
| `public/og-image.jpg` | Replace with the new image |

---

## Notes

- No code changes are needed since the existing `index.html` and `PageMeta.tsx` already reference `/og-image.jpg`
- After publishing, it may take some time for social platforms to update their cached previews (you can use tools like Facebook's Sharing Debugger or Twitter Card Validator to force a refresh)

