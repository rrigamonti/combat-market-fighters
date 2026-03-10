

## Findings: Evident Flaws and Missing Parts

### 1. Bug: Fighter join does NOT increment `current_participants`
In `FighterMissions.tsx` (line 72-76), when a fighter joins a mission via their own dashboard, `handleJoin` inserts into `mission_participations` but **never updates** `missions.current_participants`. This means the "spots left" counter drifts out of sync. The admin preview (`AdminFighterPreviewMissions.tsx`) was fixed, but the actual fighter-facing page was not.

### 2. Missing: No notifications when admin joins fighter from preview
In `AdminMissionDetail.tsx`, the `assignMutation` sends notifications to both the fighter ("You've been assigned to mission X") and the merchant ("A fighter has been assigned"). In `AdminFighterPreviewMissions.tsx`, `handleJoin` does neither — the fighter and merchant are never notified.

### 3. Missing: No notification when fighter self-joins
In `FighterMissions.tsx`, `handleJoin` inserts the participation but sends no notification to the merchant that a fighter has joined their mission.

---

### Fix Plan

**Task 1: Fix `FighterMissions.tsx` — increment participants + notify merchant**
- After successful insert, update `missions.current_participants` (same pattern as admin preview).
- Call `notifyMerchant(mission.merchant_id, ...)` to inform the brand a fighter joined.

**Task 2: Fix `AdminFighterPreviewMissions.tsx` — add notifications**
- After successful join, call `notifyFighter(fighterId, ...)` and `notifyMerchant(mission.merchant_id, ...)` matching the pattern in `AdminMissionDetail.tsx`.

Both are small, surgical changes — ~5-10 lines each.

