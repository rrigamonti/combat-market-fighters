

## Findings: Missing and Broken Flows Across the Project

### Critical: Submission Approval Does NOT Create a Payout Ledger Entry

When an admin approves a fighter's submission in `AdminMissionDetail.tsx` (line 140-156), it:
- Updates `submissions.payout_amount` and `submissions.status`
- Updates `mission_participations.status` to "approved"
- Notifies the fighter

But it **never inserts a `float_ledger` record** of type `payout`. This means:
- The merchant's reserved budget is never actually debited
- The merchant billing page (`MerchantBilling.tsx`) never shows the payout transaction
- The `get_merchant_balance()` RPC returns incorrect balances — reserved money stays reserved forever after approval

**Fix:** After approving a submission, insert a `float_ledger` row with `entry_type: 'payout'` and the reward amount, debiting from the merchant's reserved balance.

---

### Missing: Mission Close Does NOT Release Unspent Budget

When an admin changes a mission status to "closed" or "paused" via the status dropdown, there is no logic to release unspent reserved budget back to the merchant's available balance. The `publish_mission` RPC correctly reserves budget on activation, but there is no corresponding `release` ledger entry when a mission ends.

**Fix:** When closing a mission, calculate unspent budget (budget minus total approved payouts) and insert a `float_ledger` `release` entry for the remainder.

---

### Duplicated Constants: `sports` and `countries` Arrays

The `sports` and `countries` arrays are copy-pasted identically in:
- `src/pages/FighterSignup.tsx` (lines 46-77)
- `src/pages/Dashboard.tsx` (lines 29-60)
- `src/pages/admin/AdminFighters.tsx`

Any addition (e.g. a new sport) must be updated in 3+ places.

**Fix:** Extract to `src/lib/constants.ts` and import everywhere.

---

### Minor: `statusColor` Helper Duplicated in 4 Files

Local `statusColor()` functions with slightly different mappings exist in:
- `AdminMissionDetail.tsx`
- `AdminMissions.tsx`
- `MerchantMissions.tsx`
- `MerchantSubmissions.tsx`

Already centralized `missionHelpers.tsx` for participation/submission badges, but mission-level status color is still local. Could be added to the same helper file.

---

### Summary of Proposed Changes

| Priority | Issue | Files Affected |
|----------|-------|---------------|
| **Critical** | Add payout ledger entry on submission approval | `AdminMissionDetail.tsx` |
| **High** | Add budget release on mission close | `AdminMissionDetail.tsx` |
| **Medium** | Extract `sports`/`countries` to shared constants | `constants.ts`, 3 consumers |
| **Low** | Centralize `statusColor` for mission statuses | `missionHelpers.tsx`, 4 consumers |

