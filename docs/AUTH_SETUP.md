# Authentication Setup Guide

SoundSteps supports five authentication methods. This document explains how each one works, what configuration is needed, and how to activate them.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Email + Password](#1-email--password)
3. [Google OAuth](#2-google-oauth)
4. [Apple OAuth](#3-apple-oauth)
5. [Magic Link (Passwordless)](#4-magic-link-passwordless)
6. [Forgot Password](#5-forgot-password)
7. [Supabase Dashboard Configuration](#supabase-dashboard-configuration)
8. [Redirect URL Configuration](#redirect-url-configuration)
9. [How Auth Flows Work (Technical)](#how-auth-flows-work-technical)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Stack
- **Supabase Auth** — handles all authentication, token management, and email delivery
- **Supabase JS Client (v2)** — browser SDK that manages sessions automatically
- **React SPA** — single-page app deployed on Vercel

### Key Files
| File | Purpose |
|------|---------|
| `src/components/auth/AuthModal.tsx` | All auth UI (sign-in, sign-up, OAuth, magic link, forgot password) |
| `src/pages/ResetPassword.tsx` | Password reset form (user arrives here from email link) |
| `src/store/UserContext.tsx` | Auth state management, `onAuthStateChange` listener |
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/components/RequireAuth.tsx` | Route guard for protected pages |

### Auth Flow Diagram
```
┌─────────────────────────────────────────────────────┐
│                    AuthModal                         │
│                                                     │
│  [Continue with Google]  → Supabase OAuth → Google  │
│  [Continue with Apple]   → Supabase OAuth → Apple   │
│                                                     │
│  Email + Password        → signInWithPassword()     │
│  Magic Link              → signInWithOtp()          │
│  Forgot Password         → resetPasswordForEmail()  │
│                                                     │
│  Sign Up                 → signUp() + email confirm │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              UserContext.onAuthStateChange           │
│                                                     │
│  SIGNED_IN  → fetch profile, migrate guest data     │
│  SIGNED_OUT → clear profile                         │
│  PASSWORD_RECOVERY → handled by ResetPassword page  │
└─────────────────────────────────────────────────────┘
```

---

## 1. Email + Password

### Status: Working (no configuration needed)

This is the default auth method. Users create an account with email + password.

### Behavior
- **Sign Up**: Creates account. If email confirmation is enabled in Supabase (the default), user receives a confirmation email and must click the link before signing in.
- **Sign In**: Validates credentials. Returns a session.
- **Error Handling**: Friendly messages for "Invalid login credentials" and "Email not confirmed".

### Configuration
None required — works out of the box with Supabase.

### Email Confirmation Setting
By default, Supabase requires email confirmation. To change this:

1. Go to **Supabase Dashboard → Authentication → Providers → Email**
2. Toggle **"Confirm email"** on or off
3. If OFF: users can sign in immediately after sign-up (no email needed)
4. If ON: users must click confirmation link in email first

**Recommendation**: Keep confirmation ON for production (prevents fake accounts, validates email ownership).

---

## 2. Google OAuth

### Status: UI ready, needs provider configuration

Users click "Continue with Google" → redirected to Google → redirected back to app with session.

### Setup Steps

#### A. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `SoundSteps`
7. **Authorized redirect URIs**: Add your Supabase callback URL:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   (Find your project ref in Supabase Dashboard → Settings → General)
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

#### B. Google OAuth Consent Screen
1. In Google Cloud Console, go to **APIs & Services → OAuth consent screen**
2. User Type: **External**
3. Fill in:
   - App name: `SoundSteps`
   - User support email: your email
   - Developer contact: your email
4. Scopes: Add `email` and `profile` (openid is automatic)
5. Test users: Add your email while in testing mode
6. Publish the app when ready for production

#### C. Supabase Dashboard
1. Go to **Supabase Dashboard → Authentication → Providers → Google**
2. Toggle **Enable Google provider** ON
3. Paste the **Client ID** from Google
4. Paste the **Client Secret** from Google
5. Click **Save**

#### D. Verify
- Visit the app in a browser (clear cookies first)
- Click "Continue with Google"
- Should redirect to Google sign-in → back to app → signed in

### What happens without configuration
If Google is not configured in Supabase, clicking the button will show an error message in the modal: "google sign-in failed" or similar Supabase error. This is graceful — the button is always visible but only works when the provider is configured.

---

## 3. Apple OAuth

### Status: UI ready, needs provider configuration

Users click "Continue with Apple" → redirected to Apple → redirected back to app with session.

### Setup Steps

#### A. Apple Developer Account
You need an [Apple Developer account](https://developer.apple.com/) ($99/year).

1. Go to **Certificates, Identifiers & Profiles → Identifiers**
2. Create a new **App ID**:
   - Description: `SoundSteps`
   - Bundle ID: `com.soundsteps.app` (or your actual bundle ID)
   - Enable **Sign in with Apple**
3. Create a new **Services ID**:
   - Description: `SoundSteps Web Auth`
   - Identifier: `com.soundsteps.auth` (used as the Client ID)
   - Enable **Sign in with Apple**
   - Configure: Add your domain and redirect URL:
     - Domain: `<YOUR_PROJECT_REF>.supabase.co`
     - Return URL: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
4. Create a **Key** for Sign in with Apple:
   - Go to **Keys → Create a new key**
   - Enable **Sign in with Apple**
   - Download the `.p8` key file (you can only download it once!)
   - Note the **Key ID**

#### B. Generate Client Secret
Apple uses a JWT as the client secret (rotates every 6 months). You need:
- **Team ID** (from Apple Developer account → Membership)
- **Key ID** (from the key you created)
- **Services ID** (the identifier like `com.soundsteps.auth`)
- **Private key** (the `.p8` file contents)

Supabase can generate this for you:
1. Go to **Supabase Dashboard → Authentication → Providers → Apple**
2. Toggle **Enable Apple provider** ON
3. Enter:
   - **Client ID**: Your Services ID (e.g., `com.soundsteps.auth`)
   - **Secret Key**: The contents of your `.p8` file
   - **Key ID**: From the Apple key
   - **Team ID**: From Apple Developer membership
4. Click **Save**

#### C. Verify
- Visit the app on Safari (Apple Sign-In works best on Apple devices)
- Click "Continue with Apple"
- Should redirect to Apple sign-in → back to app → signed in

### Important Notes
- **Required for App Store**: If you ship to the App Store and offer any social login, Apple requires you to also offer Sign in with Apple.
- **Email relay**: Apple lets users hide their real email. Supabase handles this automatically — you'll get a relay address like `xyz@privaterelay.appleid.com`.
- **First sign-in only shares name**: Apple only sends the user's name on the very first sign-in. Make sure to capture it if needed.

---

## 4. Magic Link (Passwordless)

### Status: Working (no additional configuration needed)

Users enter their email → receive a sign-in link → click it → signed in. No password required.

### How It Works
1. User clicks "Use email link instead" on the sign-in screen
2. Enters their email and clicks "Send Sign-In Link"
3. Supabase sends an email with a one-time sign-in link
4. User clicks the link → redirected to app with a valid session
5. `onAuthStateChange` fires with `SIGNED_IN` → user is logged in

### Configuration
None required beyond standard Supabase email setup. Uses the same email delivery as confirmation emails.

### Email Template Customization
To customize the magic link email:
1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. Select **"Magic Link"** template
3. Customize the subject and body
4. The `{{ .ConfirmationURL }}` variable contains the sign-in link

### Behavior Details
- Link expires after 24 hours (Supabase default)
- If the email doesn't exist, Supabase still returns success (prevents email enumeration)
- If the user doesn't have an account, `signInWithOtp` creates one automatically
- Works on any device — user can open the link on a different device/browser

---

## 5. Forgot Password

### Status: Working (no additional configuration needed)

Users enter their email → receive a password reset link → click it → set new password.

### How It Works
1. User clicks "Forgot password?" on the sign-in screen
2. Enters their email and clicks "Send Reset Link"
3. Supabase sends an email with a reset link pointing to `/reset-password`
4. User clicks the link → arrives at `/reset-password` with a recovery session
5. User enters new password (with confirmation) → calls `updateUser({ password })`
6. Success → redirect to Dashboard

### Code Path
```
AuthModal (forgot-password view)
  → supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })
  → Email sent → User clicks link
  → Supabase verifies token → redirects to /reset-password with session
  → ResetPassword.tsx detects PASSWORD_RECOVERY event
  → User enters new password
  → supabase.auth.updateUser({ password })
  → Success screen → "Go to Dashboard"
```

### Edge Cases Handled
- **Invalid/expired link**: Shows "Invalid Reset Link" message with link to home
- **Loading state**: Shows spinner while verifying the reset token
- **Password mismatch**: Client-side validation before API call
- **Minimum length**: 6 characters (matches sign-up requirement)

### Email Template Customization
1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. Select **"Reset Password"** template
3. Customize the subject and body
4. The `{{ .ConfirmationURL }}` variable contains the reset link

---

## Supabase Dashboard Configuration

### Required Settings (Authentication → URL Configuration)

Add these to the **"Redirect URLs"** allowlist:

```
http://localhost:5173           ← local development
http://localhost:5173/**        ← local development (wildcard)
https://your-app.vercel.app    ← production (your Vercel domain)
https://your-app.vercel.app/** ← production (wildcard)
https://soundsteps.app         ← custom domain (if applicable)
https://soundsteps.app/**      ← custom domain (wildcard)
```

### Site URL
Set the **Site URL** to your production URL:
```
https://your-app.vercel.app
```
(or your custom domain)

This is the default redirect target for auth emails.

---

## Redirect URL Configuration

### How Supabase Redirects Work
For OAuth, magic link, and password reset, the flow is:

1. **App → Supabase Auth Server** (with redirect URL)
2. **Supabase → Provider** (Google/Apple) or sends email
3. **Provider/Email Link → Supabase Auth Server** (with auth code)
4. **Supabase → Your App** (with session tokens in URL hash)

The Supabase JS client automatically detects the tokens in the URL hash and establishes a session.

### Redirect URLs Used in Code
| Feature | Redirect URL | Set In |
|---------|-------------|--------|
| Google OAuth | `window.location.origin` | AuthModal.tsx |
| Apple OAuth | `window.location.origin` | AuthModal.tsx |
| Magic Link | `window.location.origin` | AuthModal.tsx |
| Password Reset | `window.location.origin/reset-password` | AuthModal.tsx |
| Email Confirmation | Supabase default (Site URL) | Supabase Dashboard |

---

## How Auth Flows Work (Technical)

### OAuth Flow (Google / Apple)
```
1. User clicks "Continue with Google"
2. Code: supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
3. Browser redirects to: https://<project>.supabase.co/auth/v1/authorize?provider=google&redirect_to=...
4. Supabase redirects to Google's OAuth consent screen
5. User signs in with Google
6. Google redirects back to: https://<project>.supabase.co/auth/v1/callback?code=...
7. Supabase exchanges code for tokens
8. Supabase redirects to app: https://your-app.com/#access_token=...&refresh_token=...
9. Supabase JS client detects hash, establishes session
10. UserContext.onAuthStateChange fires with 'SIGNED_IN'
11. App fetches profile, migrates guest data, etc.
```

### Magic Link Flow
```
1. User enters email, clicks "Send Sign-In Link"
2. Code: supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
3. Supabase sends email with link: https://<project>.supabase.co/auth/v1/verify?token=...&redirect_to=...
4. User clicks link in email
5. Supabase verifies token, creates session
6. Redirects to app: https://your-app.com/#access_token=...&refresh_token=...
7. Supabase JS client detects hash, establishes session
8. UserContext.onAuthStateChange fires with 'SIGNED_IN'
```

### Password Reset Flow
```
1. User enters email, clicks "Send Reset Link"
2. Code: supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../reset-password' })
3. Supabase sends email with link: https://<project>.supabase.co/auth/v1/verify?type=recovery&token=...&redirect_to=.../reset-password
4. User clicks link in email
5. Supabase verifies token, creates recovery session
6. Redirects to: https://your-app.com/reset-password#access_token=...&type=recovery
7. ResetPassword.tsx detects the session via onAuthStateChange('PASSWORD_RECOVERY')
8. User enters new password
9. Code: supabase.auth.updateUser({ password })
10. Success → navigate to Dashboard
```

---

## Troubleshooting

### "Provider not enabled" error when clicking Google/Apple
**Cause**: The OAuth provider is not enabled in Supabase Dashboard.
**Fix**: Go to Authentication → Providers → Enable the provider and add credentials.

### OAuth redirects to wrong URL
**Cause**: Redirect URL not in Supabase's allowlist.
**Fix**: Add your app URL to Authentication → URL Configuration → Redirect URLs.

### Magic link / password reset email not arriving
**Cause**: Supabase's built-in email has rate limits (3-4 emails/hour in free tier).
**Fix**:
1. Check spam folder
2. Wait a few minutes and retry
3. For production, configure a custom SMTP provider in Supabase Dashboard → Settings → Auth → SMTP Settings (recommended: Resend, Postmark, or SendGrid)

### "Email not confirmed" error on sign-in
**Cause**: User signed up but didn't click the confirmation link.
**Fix**: User should check their email. If the link expired, they can sign up again with the same email to receive a new confirmation.

### Password reset link shows "Invalid Reset Link"
**Cause**: Link expired (default: 24 hours) or was already used.
**Fix**: Request a new password reset from the sign-in screen.

### Apple Sign-In doesn't show user's name
**Cause**: Apple only sends the user's name on the very first sign-in.
**Fix**: This is Apple's design. If you need the name, capture it on first sign-in.

### Sessions expire too quickly
**Cause**: Default Supabase JWT expiry is 1 hour, with automatic refresh.
**Fix**: The Supabase JS client handles refresh tokens automatically. If issues persist, check Authentication → Settings → JWT expiry.

### "redirect_uri_mismatch" from Google
**Cause**: The redirect URI in Google Cloud Console doesn't match Supabase's callback URL.
**Fix**: In Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs, add:
```
https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
```

---

## Production Checklist

- [ ] **Email confirmation** enabled in Supabase (Authentication → Providers → Email)
- [ ] **Site URL** set to production domain (Authentication → URL Configuration)
- [ ] **Redirect URLs** include production domain + localhost (Authentication → URL Configuration)
- [ ] **Google OAuth** configured (Google Cloud Console + Supabase Providers)
- [ ] **Apple OAuth** configured (Apple Developer + Supabase Providers)
- [ ] **Custom SMTP** configured for reliable email delivery (Settings → Auth → SMTP)
- [ ] **Email templates** customized with SoundSteps branding (Authentication → Email Templates)
- [ ] **Rate limits** reviewed (Authentication → Rate Limits)
- [ ] **Test all flows** on mobile Safari, Chrome, and desktop browsers
