

## Audit Results: Post-Merge Health Check

### Functional Issues Found

**1. `current_participants` not incremented on admin preview join**
In `AdminFighterPreviewMissions.tsx`, `handleJoin` inserts into `mission_participations` but does NOT increment `missions.current_participants`. Compare with `AdminMissionDetail.tsx` (line 120-122) which correctly updates the count. This means the "spots" counter becomes inaccurate when joining from preview mode.

**2. Duplicated badge/helper functions across 5+ files**
`getStatusBadge`, `getMissionTypeBadge`, and similar functions are copy-pasted across:
- `AdminFighterPreviewMissions.tsx`
- `AdminFighterPreview.tsx`
- `FighterMissions.tsx`
- `FighterMissionDetail.tsx`
- `AdminMissions.tsx`
- `AdminMissionDetail.tsx`

The badge color mappings are even inconsistent between files (e.g., "review" is blue in one, purple in another; "social" is pink vs blue).

**3. `MissionWithMerchant` interface duplicated in 4 files**
The same `MissionWithMerchant` type is defined locally in `FighterMissions.tsx`, `FighterMissionDetail.tsx`, `AdminFighterPreviewMissions.tsx`, and others.

### No Breaking Issues Found
- Routes are correctly registered and protected
- RLS policies are sound; admin has full access, fighters correctly scoped
- Auth context properly handles role detection
- Notifications flow works (fighter + merchant)
- The `publish_mission` RPC with budget reservation is correctly called
- `ProtectedRoute`, `AdminRoute`, `MerchantRoute` all work correctly

### Optimization Plan

**Task 1: Fix `current_participants` increment on preview join**
- In `AdminFighterPreviewMissions.tsx`, after successful insert into `mission_participations`, add an update to `missions` incrementing `current_participants` (matching the pattern in `AdminMissionDetail.tsx` lines 120-122).

**Task 2: Extract shared mission helpers into a utility module**
- Create `src/lib/missionHelpers.tsx` containing:
  - `getStatusBadge(status)` — unified participation/fighter status badge
  - `getMissionTypeBadge(type)` — consistent color mapping
  - `getSubmissionStatusBadge(status)` — submission status badge
  - `MissionWithMerchant` type export
- Update all 6 consumer files to import from this shared module instead of defining locally.

**Task 3: Minor cleanup**
- Remove `(mission as any).merchants` casts in `AdminFighterPreviewMissions.tsx` — the type already includes `merchants`.
- Remove unused `AdminLayout` import from `AdminFighterPreviewMissions.tsx` (it's used in loading/error states but `FighterPreviewLayout` is the actual layout — the loading fallback should use the same layout or a minimal spinner).

