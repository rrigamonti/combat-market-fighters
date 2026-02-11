
# Add Email Field to Fighters

## Overview
Add an `email` column to the fighters table so admins can set and manage fighter email addresses directly, independent of whether a fighter has a linked user account.

## What Changes

### 1. Database Migration
- Add a nullable `email` column (type `text`) to the `fighters` table

### 2. Admin Fighters Page (`src/pages/admin/AdminFighters.tsx`)
- Add `email` to the `Fighter` interface
- Add an email input field to the **Create Fighter** dialog
- Add an email input field to the **Edit Fighter** dialog
- Include `email` in the create insert and edit update payloads
- Display the email in the fighters table (new column)

## Technical Details

### Migration SQL
```sql
ALTER TABLE public.fighters ADD COLUMN email text;
```

### UI Changes
- The email field will be placed near the top of both dialogs (after full name / handle)
- The fighters table will show the email in a new column between the name and sport columns
- The notification system (`updateStatus`) currently fetches email from `profiles` -- this could be updated to fall back to the fighter's own email field when no `user_id` is present

### Files to modify
- `src/pages/admin/AdminFighters.tsx` -- add email to interface, create/edit forms, table display, and data payloads
