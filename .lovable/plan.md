
# Plan: Product Request Functionality for Fighters Dashboard

## Overview
Add a feature that allows fighters to request products they'd like to promote on their storefront. Admins can then review, approve (by adding the product), or reject these requests. This follows the existing approval pattern used for profile changes.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     FIGHTER DASHBOARD                                │
│  New section: "Request a Product"                                   │
│  - Product name/description                                          │
│  - Product URL (optional)                                           │
│  - Why they want to promote it                                      │
│  - View pending/past requests                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PRODUCT_REQUESTS TABLE                             │
│  fighter_id, product_name, product_url, reason, status, notes       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ADMIN: PRODUCT REQUESTS PAGE                       │
│  Review pending requests → Approve/Reject                           │
│  Optional: Link to existing product or add new                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### New Table: `product_requests`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | uuid | No | gen_random_uuid() | Primary key |
| fighter_id | uuid | No | - | FK to fighters |
| product_name | text | No | - | Name of requested product |
| product_url | text | Yes | NULL | URL where product can be found |
| brand_name | text | Yes | NULL | Brand if known |
| reason | text | Yes | NULL | Why they want to promote it |
| status | text | No | 'pending' | pending/approved/rejected |
| admin_notes | text | Yes | NULL | Notes from admin |
| linked_product_id | uuid | Yes | NULL | FK to products (if approved and linked) |
| created_at | timestamptz | No | now() | When submitted |
| updated_at | timestamptz | No | now() | Last updated |
| reviewed_at | timestamptz | Yes | NULL | When reviewed by admin |
| reviewed_by | uuid | Yes | NULL | Admin who reviewed |

### RLS Policies

| Policy | Command | Expression |
|--------|---------|------------|
| Fighters can insert own requests | INSERT | auth.uid() = (SELECT user_id FROM fighters WHERE id = fighter_id) |
| Fighters can view own requests | SELECT | fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) |
| Admins can manage all requests | ALL | has_role(auth.uid(), 'admin') |

---

## Component Changes

### 1. Fighter Dashboard (Dashboard.tsx)

Add a new section below the storefront URL card:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Request a Product                                           [+ New] │
├─────────────────────────────────────────────────────────────────────┤
│ Want to promote a product that's not in our catalog?               │
│ Submit a request and we'll look into adding it for you.            │
├─────────────────────────────────────────────────────────────────────┤
│ Your Recent Requests:                                               │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Hayabusa T3 Boxing Gloves                      [Pending] 2d ago │ │
│ │ Venum Challenger MMA Gloves                    [Approved] 1w ago│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Button to open request dialog
- List of recent requests with status badges
- Dialog form with fields: product name, URL (optional), brand (optional), reason

### 2. New Admin Page: AdminProductRequests.tsx

A new page at `/admin/product-requests` to manage incoming requests:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Product Requests                                                     │
│ Review and manage product requests from fighters                    │
├─────────────────────────────────────────────────────────────────────┤
│ [Filter: All ▼] [Search: _________________]                         │
├─────────────────────────────────────────────────────────────────────┤
│ Fighter    | Product         | Brand    | Status  | Date    | Action│
├─────────────────────────────────────────────────────────────────────┤
│ @marcus    | Hayabusa T3     | Hayabusa | Pending | 2d ago  | [···] │
│ @sarah     | RDX Speed Bag   | RDX      | Pending | 3d ago  | [···] │
└─────────────────────────────────────────────────────────────────────┘
```

**Actions:**
- **View details**: See full request with fighter info
- **Approve**: Optionally link to existing product or note that it will be added
- **Reject**: Add rejection reason

### 3. Admin Navigation Update

Add "Product Requests" link to the admin sidebar with a badge showing pending count.

---

## Implementation Details

### Fighter Dashboard Request Form

```text
┌─────────────────────────────────────────────────────────┐
│ Request a Product                                    [X] │
├─────────────────────────────────────────────────────────┤
│ Product Name *                                          │
│ [_________________________________________________]     │
│                                                         │
│ Product URL (optional)                                  │
│ [_________________________________________________]     │
│                                                         │
│ Brand (optional)                                        │
│ [_________________________________________________]     │
│                                                         │
│ Why do you want to promote this? (optional)            │
│ [                                                  ]    │
│ [                                                  ]    │
│                                                         │
│                              [Cancel] [Submit Request]  │
└─────────────────────────────────────────────────────────┘
```

### Validation Rules
- Product name: Required, max 200 characters
- Product URL: Optional, must be valid URL if provided
- Brand: Optional, max 100 characters
- Reason: Optional, max 500 characters

### Status Flow
1. Fighter submits request → **pending**
2. Admin reviews:
   - Approves → **approved** (product added/linked, fighter notified)
   - Rejects → **rejected** (reason provided, fighter can see)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Add `product_requests` table with RLS |
| src/pages/Dashboard.tsx | Modify | Add product request section and dialog |
| src/pages/admin/AdminProductRequests.tsx | Create | New admin page for managing requests |
| src/components/admin/AdminLayout.tsx | Modify | Add sidebar link with pending count |
| src/App.tsx | Modify | Add route for /admin/product-requests |
| src/lib/notifications.ts | Modify | Add product request notification types |
| supabase/functions/send-notification/index.ts | Modify | Add email templates for request status |

---

## Notification Integration

### New Email Types
1. **product_request_received**: Sent to admin (optional) when new request comes in
2. **product_request_approved**: Sent to fighter when request is approved
3. **product_request_rejected**: Sent to fighter when request is rejected

---

## Backward Compatibility

This feature is entirely additive:
- New database table (no changes to existing tables)
- New UI components in existing pages
- New admin page
- Existing functionality remains unchanged

---

## Implementation Order

1. **Database migration**: Create `product_requests` table with RLS policies
2. **Dashboard.tsx**: Add request section and form dialog
3. **AdminProductRequests.tsx**: Create admin management page
4. **AdminLayout.tsx**: Add sidebar navigation link
5. **App.tsx**: Add admin route
6. **Notifications**: Add email templates for request status updates

---

## Testing Checklist

**Fighter functionality:**
- [ ] Can submit a product request with name only
- [ ] Can submit a product request with all fields
- [ ] Can view list of their requests
- [ ] Can see status badges (pending/approved/rejected)
- [ ] Cannot edit or delete submitted requests

**Admin functionality:**
- [ ] Can view all product requests
- [ ] Can filter by status
- [ ] Can search by product name or fighter
- [ ] Can approve request with optional notes
- [ ] Can reject request with reason
- [ ] Pending count shows in sidebar

**Existing functionality:**
- [ ] Dashboard profile editing still works
- [ ] Dashboard storefront URL still displays
- [ ] Admin products page still works
- [ ] Fighter storefronts still display correctly
