

# Plan: Add Search Functionality to Product Assignments

## Overview
Add search bars to the Product Assignments page (AdminAssignments.tsx) to make it easier for admins to find fighters and products when managing assignments. The Fighters Dashboard (AdminFighters.tsx) already has search implemented.

---

## Changes Required

### AdminAssignments.tsx

#### 1. Fighter Selection with Search
Replace the current Select dropdown with a searchable combobox (using the existing Command component from shadcn/ui):

```text
Current:
┌─────────────────────────────┐
│ Select a fighter... ▼      │
└─────────────────────────────┘

Enhanced:
┌─────────────────────────────┐
│ 🔍 Search fighters...       │
├─────────────────────────────┤
│ Marcus Rodriguez (@marcus)  │
│ Sarah Chen (@sarah)         │
│ ...filtered results...      │
└─────────────────────────────┘
```

#### 2. Bulk Assignment Dialog - Fighters List Search
Add a search input above the fighters checkbox list:

```text
┌─────────────────────────────────────┐
│ Fighters (3 selected)    Select All │
├─────────────────────────────────────┤
│ 🔍 Search fighters...               │
├─────────────────────────────────────┤
│ ☐ Marcus Rodriguez (@marcus)        │
│ ☑ Sarah Chen (@sarah)               │
│ ...                                 │
└─────────────────────────────────────┘
```

#### 3. Bulk Assignment Dialog - Products List Search
Add a search input above the products checkbox list:

```text
┌─────────────────────────────────────┐
│ Products (5 selected)    Select All │
├─────────────────────────────────────┤
│ 🔍 Search products...               │
├─────────────────────────────────────┤
│ ☐ Boxing Gloves (Everlast)          │
│ ☑ MMA Shorts (Venum)                │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## Technical Details

### New State Variables
- `fighterSearchQuery` - Filter for main fighter selector
- `bulkFighterSearch` - Filter for bulk dialog fighters list  
- `bulkProductSearch` - Filter for bulk dialog products list

### Filtering Logic
Use `useMemo` to create filtered lists that update as search queries change:

- **Fighters**: Filter by `full_name` and `handle`
- **Products**: Filter by `name`, `brand`, and `category`

### Components Used
- `Input` with Search icon for simple search inputs
- Optionally use `Command` (cmdk) for the main fighter selector for better UX with keyboard navigation

---

## Files to Modify

| File | Changes |
|------|---------|
| src/pages/admin/AdminAssignments.tsx | Add search state, filtering logic, and search UI components |

---

## Implementation Steps

1. Add new state variables for search queries
2. Create filtered lists using useMemo for fighters and products
3. Add search input to the main fighter selection area
4. Add search inputs inside the bulk assignment dialog for both lists
5. Update the Select All buttons to work with filtered results

---

## Backward Compatibility

This change is purely additive:
- No database changes required
- No API changes required
- Existing functionality remains intact
- Search is optional - lists still show all items when search is empty

