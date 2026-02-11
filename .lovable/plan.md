

# Add "Forgot Password" to Login Page

## Overview
Add a password reset flow to the login page so users can recover their accounts. This uses the built-in authentication password reset functionality, which sends a magic link email to reset the password.

## What You'll See
- A "Forgot your password?" link below the password field on the login page
- Clicking it shows an inline email input to request a reset link
- A confirmation message after the reset email is sent
- A new `/reset-password` page where users land after clicking the email link, allowing them to set a new password

## Implementation Steps

### 1. Update Login Page (`src/pages/Login.tsx`)
- Add a "Forgot your password?" toggle link between the password field and the Sign In button
- When clicked, switch to a "reset mode" that shows only the email field and a "Send Reset Link" button
- Call `supabase.auth.resetPasswordForEmail()` with `redirectTo` pointing to the app's `/reset-password` route
- Show a success toast confirming the email was sent
- Provide a "Back to login" link to return to the normal form

### 2. Create Reset Password Page (`src/pages/ResetPassword.tsx`)
- A simple page with two password fields (new password + confirm)
- On mount, the page detects the auth session from the magic link in the URL (handled automatically by the auth library)
- Calls `supabase.auth.updateUser({ password })` to set the new password
- Validates passwords match and meet minimum length (8 characters)
- On success, redirects to `/login` with a success toast

### 3. Add Route (`src/App.tsx`)
- Add `<Route path="/reset-password" element={<ResetPassword />} />` alongside the existing auth routes

## Technical Details

- **Password reset email**: Uses `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- **Password update**: Uses `supabase.auth.updateUser({ password: newPassword })`
- **Validation**: Zod schema for password (min 8 chars) and confirmation match
- **No database changes needed** -- this uses built-in auth functionality

