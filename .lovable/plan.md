
## Duplicate the Homepage for A/B Variation

### What we'll do
Create an exact copy of the current landing page as a new page called **LandingV2**. This gives the client two independent versions to compare, and any changes to V2 won't affect the original.

### Steps

1. **Create `src/pages/LandingV2.tsx`** -- a full copy of the current `Landing.tsx` file, with the component renamed to `LandingV2`.

2. **Add a new route in `src/App.tsx`** -- add `/v2` route pointing to the new `LandingV2` page, so both versions are accessible:
   - Original: `/` (unchanged)
   - Variation: `/v2`

### Technical details

- The new file will import all the same assets, components, and hooks as the original.
- The component name and default export will be `LandingV2`.
- No changes to the existing `Landing.tsx` or any other file besides `App.tsx`.
- Future variation edits will only touch `LandingV2.tsx`.
