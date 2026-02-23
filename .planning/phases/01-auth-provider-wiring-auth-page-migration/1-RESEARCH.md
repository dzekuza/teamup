# Phase 1: Auth Provider Wiring + Auth Page Migration - Research

**Researched:** 2026-02-23
**Domain:** Supabase Auth, React Context, Firebase-to-Supabase migration
**Confidence:** HIGH — all findings are grounded in direct codebase inspection of the actual files being changed

---

## Summary

Phase 1 is a surgical migration: wire `SupabaseAuthProvider` at the app root and replace all Firebase auth calls inside `Login.tsx`, `Register.tsx`, and `ResetPasswordDialog.tsx` with Supabase equivalents. The Supabase auth infrastructure (`useSupabaseAuth.ts`, `SupabaseAuthContext.tsx`, `lib/supabase.ts`) is **already fully written and correct** — it just isn't mounted yet. The work is primarily three tasks: (1) update `src/index.tsx` to mount the provider, (2) update `src/App.tsx` to import from the Supabase context instead of the Firebase hook, and (3) rewrite the two auth pages plus the password reset dialog.

The critical complexity in this phase is not the Supabase API (already coded) but the side effects that must be handled during page migration: removing the plaintext-password cookie logic, deleting all Facebook OAuth code, migrating `ResetPasswordDialog` from Firebase to Supabase, and ensuring that the `EmailVerificationBanner` continues to work with a Supabase `User` object (which stores email confirmation differently from Firebase).

**Primary recommendation:** Wire the provider first (index.tsx → App.tsx import swap), validate it works with existing pages before touching Login/Register, then migrate the pages one at a time.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | SupabaseAuthProvider mounted at app root in index.tsx | `SupabaseAuthProvider` is exported from `src/contexts/SupabaseAuthContext.tsx` and ready to use; index.tsx currently has no auth provider — only `CookieProvider` |
| AUTH-02 | App.tsx imports useAuth from SupabaseAuthContext (not Firebase) | App.tsx line 14 imports `useAuth` from `'./hooks/useAuth'` (Firebase); must change to `'./contexts/SupabaseAuthContext'` — the Supabase context exports an identically named `useAuth` |
| AUTH-03 | Auth flow validated end-to-end (login, session persist, logout) | `useSupabaseAuth.ts` uses `supabase.auth.getSession()` + `onAuthStateChange` for persistence; session is JWT-based, persists in localStorage automatically by Supabase client |
| AUTH-04 | Login page uses Supabase `auth.signInWithPassword` instead of Firebase | Login.tsx currently calls `signInWithEmailAndPassword(auth, email, password)` from Firebase; replace with `login()` from `useAuth()` context (which calls `supabase.auth.signInWithPassword`) |
| AUTH-05 | Login page uses Supabase `auth.signInWithOAuth` for Google sign-in | Login.tsx uses Firebase `signInWithPopup` + `GoogleAuthProvider`; Supabase uses redirect flow (`signInWithGoogle` in context calls `supabase.auth.signInWithOAuth`) — behavior change: popup → redirect |
| AUTH-06 | Login page plaintext password cookie removed | Login.tsx saves `savedPassword` in plaintext cookie on "remember me"; must remove `getCookie('savedPassword')`, `setCookie('savedPassword', ...)`, `removeCookie('savedPassword')` and the `rememberMe` flow that writes them |
| AUTH-07 | Login page Facebook OAuth code deleted | Login.tsx has full Facebook SDK initialization in `useEffect`, `handleFacebookLogin` function, Facebook button in step 1 and step 2; all must be deleted |
| AUTH-08 | Register page uses Supabase `auth.signUp` instead of Firebase | Register.tsx calls `createUserWithEmailAndPassword` + `setDoc` to Firestore; replace with `register()` from context (which calls `supabase.auth.signUp` + updates `profiles` table) |
| AUTH-09 | Register page uses Supabase Google OAuth for social signup | Register.tsx uses Firebase `signInWithPopup` + `GoogleAuthProvider` with `setDoc` to Firestore; replace with `signInWithGoogle()` from context |
| AUTH-10 | Register page Facebook OAuth code deleted | Register.tsx has Facebook SDK initialization, `handleFacebookRegister` function, Facebook button; all must be deleted |
</phase_requirements>

---

## Standard Stack

### Core (already in project, no installs needed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@supabase/supabase-js` | ^2.97.0 | Supabase client: auth, database, storage | Installed, client initialized in `src/lib/supabase.ts` |
| `firebase` | ^10.14.1 | Firebase (being replaced) | Remains in package.json — other components still depend on it |
| React Context API | React 18.2 | Auth state distribution | `SupabaseAuthContext.tsx` already implements this |
| `js-cookie` | (in package) | Cookie utilities | Used in `cookieUtils.ts`; `savedPassword` cookie must be removed |

**No new packages required for this phase.**

### Supabase Auth API Used in This Phase

```typescript
// Already implemented in src/hooks/useSupabaseAuth.ts:
supabase.auth.getSession()                    // Initial session load
supabase.auth.onAuthStateChange(cb)           // Auth state listener
supabase.auth.signInWithPassword({email, password}) // Email login
supabase.auth.signUp({email, password, options})    // Registration
supabase.auth.signInWithOAuth({provider: 'google', options: {redirectTo}}) // Google OAuth
supabase.auth.signOut()                       // Logout
supabase.auth.resetPasswordForEmail(email)    // Password reset (ResetPasswordDialog)
```

---

## Architecture Patterns

### Current State (what exists now)

```
src/index.tsx
  └── <CookieProvider>
        └── <App>  ← calls useAuth() from hooks/useAuth.ts (FIREBASE)

src/App.tsx
  └── import { useAuth } from './hooks/useAuth'   ← FIREBASE hook, not context

src/contexts/
  ├── SupabaseAuthContext.tsx  ← READY but NOT mounted
  ├── AuthContext.tsx          ← Legacy Firebase context (not used by App.tsx either)
  └── CookieContext.tsx        ← Mounted, working

src/hooks/
  ├── useSupabaseAuth.ts       ← READY, used internally by SupabaseAuthContext
  └── useAuth.ts               ← FIREBASE, used by App.tsx + 16 other files
```

### Target State After Phase 1

```
src/index.tsx
  └── <CookieProvider>
        └── <SupabaseAuthProvider>   ← NEW: wraps App
              └── <App>

src/App.tsx
  └── import { useAuth } from './contexts/SupabaseAuthContext'  ← SUPABASE context

src/pages/Login.tsx     ← uses useAuth() from context (Supabase)
src/pages/Register.tsx  ← uses useAuth() from context (Supabase)
src/components/ResetPasswordDialog.tsx  ← uses supabase directly
```

### Key Naming Insight

`SupabaseAuthContext.tsx` exports a `useAuth` hook (line 28-34). This is **intentionally named the same** as the Firebase `useAuth` from `hooks/useAuth.ts`. The swap in App.tsx is simply changing the import path — the API surface (`user`, `loading`, `login`, `register`, `signInWithGoogle`, `signOut`) is identical. This means the 16 other files that import from `hooks/useAuth.ts` will break only after Phase 2 cleanup — they are NOT part of this phase.

### Pattern: Provider Nesting in index.tsx

```typescript
// src/index.tsx — target state
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

root.render(
  <React.StrictMode>
    <CookieProvider>
      <SupabaseAuthProvider>
        <App />
      </SupabaseAuthProvider>
    </CookieProvider>
  </React.StrictMode>
);
```

`SupabaseAuthProvider` must be inside `CookieProvider` (or at minimum, both must be ancestors of `App`). Current order is fine — CookieProvider wraps SupabaseAuthProvider.

### Pattern: App.tsx Import Swap

```typescript
// BEFORE:
import { useAuth } from './hooks/useAuth';

// AFTER:
import { useAuth } from './contexts/SupabaseAuthContext';
```

No other changes to App.tsx are required. `user` from Supabase Auth has `.id` (not `.uid`), but App.tsx only uses `user` for truthiness checks (`user ? <Home /> : <LandingPage />`), so no field access changes are needed in App.tsx itself.

### Pattern: Login Page Migration

Login.tsx must be rewritten to:
1. Import and use `useAuth()` from `'../contexts/SupabaseAuthContext'`
2. Replace `handleEmailLogin` → call `login(email, password)` from context
3. Replace `handleGoogleLogin` → call `signInWithGoogle()` from context
4. Delete `handleFacebookLogin` entirely
5. Delete the Facebook SDK `useEffect`
6. Delete the `window.fbAsyncInit` and `window.FB` global type declarations
7. Delete `rememberMe` state and all cookie-read/write logic (`getCookie('savedPassword')`, `setCookie('savedPassword')`, `removeCookie('savedPassword')`, `removeCookie('savedEmail')`, `setCookie('savedEmail')`)
8. Delete the `getFirebaseErrorMessage` function and replace with generic/Supabase error handling

**Important:** The 2-step flow (enter email → step 2 enter password) can be preserved. The Google OAuth redirect flow means the page navigates away — no `navigate('/')` call needed after `signInWithGoogle()` since the redirect handles it.

```typescript
// Login.tsx — new handleEmailLogin pattern
const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  if (!email || !password) {
    setError('Email and password are required');
    return;
  }
  setIsLoading(true);
  try {
    await login(email, password);
    navigate('/');
  } catch (err: any) {
    setError(err.message ?? 'An error occurred during login. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Login.tsx — new handleGoogleLogin pattern
const handleGoogleLogin = async () => {
  setError('');
  setIsLoading(true);
  try {
    await signInWithGoogle();
    // signInWithOAuth redirects — no navigate() needed
  } catch (err: any) {
    setError(err.message ?? 'An error occurred. Please try again.');
    setIsLoading(false);
  }
};
```

### Pattern: Register Page Migration

Register.tsx must be rewritten to:
1. Import and use `useAuth()` from `'../contexts/SupabaseAuthContext'`
2. Remove imports: `auth`, `createUserWithEmailAndPassword`, `updateProfile`, `signInWithPopup`, `FacebookAuthProvider`, `GoogleAuthProvider` from firebase
3. Remove imports: `doc`, `setDoc` from firebase/firestore, `db` from firebase
4. Remove import: `sendWelcomeEmail` from sendGridService (welcome email is handled via Supabase trigger or can be deferred)
5. Replace `handleSubmit` → call `register(email, password, displayName)` from context
6. Replace `handleGoogleRegister` → call `signInWithGoogle()` from context
7. Delete `handleFacebookRegister` entirely
8. Delete the Facebook SDK `useEffect`
9. Delete all `rememberMe` cookie writes (`setCookie('savedPassword')`, etc.)
10. The `selectedSports` multi-step flow is UX-only — sports selection currently writes to Firestore in `handleSubmit`. With Supabase, the `register()` in `useSupabaseAuth.ts` does NOT write sports. This is an intentional scope decision: sports preference storage is deferred (per REQUIREMENTS.md scope). Remove Firestore write, keep UX step.

**Note on welcome email:** `sendWelcomeEmail` from `sendGridService` imports from Firebase services. Remove from Register.tsx. Welcome emails can be handled separately via Supabase edge functions or deferred — not in scope for this phase.

### Pattern: ResetPasswordDialog Migration

`ResetPasswordDialog.tsx` currently uses Firebase `sendPasswordResetEmail`. Must migrate to Supabase:

```typescript
// BEFORE:
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
await sendPasswordResetEmail(auth, emailInput);

// AFTER:
import { supabase } from '../lib/supabase';
const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
  redirectTo: `${window.location.origin}/reset-password`,
});
if (error) throw error;
```

Supabase's reset email does not need `auth/user-not-found` handling — it silently succeeds even if the email doesn't exist (security best practice). Simplify error handling accordingly.

### Pattern: EmailVerificationBanner Compatibility

`EmailVerificationBanner.tsx` checks `user.emailVerified`. Firebase `User` has `.emailVerified` (boolean). Supabase `User` does **not** have `.emailVerified` — it has `email_confirmed_at` (string | null).

**This is a breaking difference.** After the provider swap, `user.emailVerified` will always be `undefined` on a Supabase user object, and the banner will never show.

Two options:
1. **Patch the banner in this phase** (recommended): Change `user.emailVerified` to `!user.email_confirmed_at`
2. **Leave broken for now**: Banner silently hides (not catastrophic, just missing)

**Recommendation:** Patch `EmailVerificationBanner.tsx` in this phase because it renders in App.tsx and depends on the auth user. Also, `sendEmailVerification(auth.currentUser!)` must be replaced with `supabase.auth.resend({ type: 'signup', email: user.email! })`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence across refresh | Custom localStorage session storage | Supabase client built-in | `@supabase/supabase-js` stores session in localStorage automatically |
| JWT token refresh | Manual token refresh logic | Supabase client built-in | Auto-refreshes tokens before expiry |
| Google OAuth flow | Custom OAuth popup handler | `supabase.auth.signInWithOAuth` | Handles PKCE, redirect, code exchange automatically |
| Password reset emails | Custom email sending from frontend | `supabase.auth.resetPasswordForEmail` | Built into Supabase Auth |

**Key insight:** The Supabase client handles all session lifecycle. Do not add any manual token management.

---

## Common Pitfalls

### Pitfall 1: `user.uid` vs `user.id`
**What goes wrong:** Code that references `user.uid` (Firebase pattern) will be `undefined` on Supabase `User`. Supabase uses `user.id`.
**Why it happens:** Firebase and Supabase use different field names for the user identifier.
**How to avoid:** In App.tsx and migrated pages, use `user.id`. The Supabase `useAuth` hook returns a Supabase `User` object directly.
**Warning signs:** Features that look up user records by ID silently fail; no TypeScript error if the Firebase `User` type was typed as `any`.
**Scope for this phase:** App.tsx only checks `user` for truthiness — not an issue there. Login/Register pages don't access `user.uid` after successful auth. Safe.

### Pitfall 2: Google OAuth Popup → Redirect Behavior Change
**What goes wrong:** Firebase used `signInWithPopup` (blocking call that returns a result). Supabase uses `signInWithOAuth` which redirects the browser away. Code that calls `navigate('/')` after `signInWithGoogle()` will never execute.
**Why it happens:** `signInWithOAuth` initiates a browser redirect — execution stops at that line.
**How to avoid:** Remove `navigate('/')` after `signInWithGoogle()` calls. The redirect brings the user back to `window.location.origin` and `onAuthStateChange` fires to set the user state.
**Warning signs:** Navigation never happens after Google login (silent — not an error).

### Pitfall 3: 16 Files Still Import Firebase `useAuth` — They Still Work
**What goes wrong:** Panic that switching App.tsx breaks all other components.
**Why it happens:** 16 components import `useAuth` from `'../hooks/useAuth'` (Firebase). After Phase 1, they still import from that path — they continue working against Firebase. This is intentional and correct for Phase 1.
**How to avoid:** Do NOT change the import path in any component other than `App.tsx`. Those files are Phase 2+ work.
**Warning signs:** If TypeScript errors appear in those 16 files after Phase 1, something went wrong.

### Pitfall 4: `SupabaseAuthProvider` Not Mounted = Context Error
**What goes wrong:** If index.tsx is not updated before App.tsx import is changed, `useAuth()` throws "useAuth must be used within a SupabaseAuthProvider".
**Why it happens:** The Supabase `useAuth` validates its context, and without the provider, it throws.
**How to avoid:** Update index.tsx FIRST, verify app loads, THEN update App.tsx import.

### Pitfall 5: `savedPassword` Cookie Cleanup
**What goes wrong:** Existing users may have `savedPassword` in their cookies from the old login. The old `useEffect` in Login reads it on mount and pre-fills the password field.
**Why it happens:** The cookie was set by old Firebase login with "Remember me" checked.
**How to avoid:** In the new Login.tsx, do NOT read `savedPassword` cookie. Optionally add a `removeCookie('savedPassword')` call on mount to clean up legacy cookies. Supabase session persistence (localStorage) handles "remember me" natively — no cookies needed.

### Pitfall 6: `emailVerified` on Supabase User
**What goes wrong:** `user.emailVerified` is `undefined` on Supabase User. `EmailVerificationBanner` returns null (silently hides).
**Why it happens:** Supabase uses `email_confirmed_at: string | null` instead of `emailVerified: boolean`.
**How to avoid:** Update `EmailVerificationBanner.tsx`: change `user.emailVerified` check to `!user.email_confirmed_at`.

### Pitfall 7: Register Page Sports Selection vs. Supabase Profile
**What goes wrong:** Register.tsx step 1 collects `selectedSports`. The old code wrote sports to `doc(db, 'users', uid)` in Firestore. The new `register()` in `useSupabaseAuth.ts` does NOT write sports to the `profiles` table.
**Why it happens:** The Supabase `register` function only calls `auth.signUp` and updates `display_name`. The `profiles` table has no `sports` column in the current migration schema.
**How to avoid:** Remove the sports Firestore write. Keep the sports selection UX intact (it's good UX). The sports data is simply not persisted in Phase 1 — this is acceptable per scope. If needed later, add a `sports` column to `profiles` in a future migration.

---

## Code Examples

### Mounting Provider in index.tsx

```typescript
// src/index.tsx — final state
import './setupReact';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CookieProvider } from './contexts/CookieContext';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <CookieProvider>
      <SupabaseAuthProvider>
        <App />
      </SupabaseAuthProvider>
    </CookieProvider>
  </React.StrictMode>
);

reportWebVitals();
```

### App.tsx Import Swap (one-line change)

```typescript
// BEFORE (line 14 of App.tsx):
import { useAuth } from './hooks/useAuth';

// AFTER:
import { useAuth } from './contexts/SupabaseAuthContext';
```

No other changes to App.tsx. `user` is checked only for truthiness in App.tsx.

### EmailVerificationBanner Patch

```typescript
// BEFORE:
import { useAuth } from '../hooks/useAuth';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

// ...
if (!user || user.emailVerified) { return null; }
// ...
await sendEmailVerification(auth.currentUser!);

// AFTER:
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

// ...
if (!user || user.email_confirmed_at) { return null; }
// ...
const { error } = await supabase.auth.resend({ type: 'signup', email: user.email! });
if (error) throw error;
```

### ResetPasswordDialog Supabase Migration

```typescript
// src/components/ResetPasswordDialog.tsx — key changes
import { supabase } from '../lib/supabase';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!emailInput) {
    setError('Please enter your email address');
    return;
  }
  setIsLoading(true);
  setError('');
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    setSuccess(true);
  } catch (error: any) {
    setError(error.message ?? 'An error occurred. Please try again later');
  } finally {
    setIsLoading(false);
  }
};
```

### Supabase Error Handling Pattern

Supabase errors throw with `.message` (string), not `.code` (Firebase pattern). Replace `getFirebaseErrorMessage(error)` switch statements with:

```typescript
setError(err.message ?? 'An error occurred. Please try again.');
```

Common Supabase auth error messages (from `@supabase/supabase-js`):
- `"Invalid login credentials"` — wrong email/password
- `"Email not confirmed"` — unverified email trying to sign in
- `"User already registered"` — email already exists on signup
- `"Password should be at least 6 characters"` — weak password

---

## State of the Art

| Old Approach (Firebase) | Current Approach (Supabase) | Impact |
|------------------------|----------------------------|--------|
| `signInWithEmailAndPassword(auth, e, p)` | `supabase.auth.signInWithPassword({email, password})` | Direct swap |
| `createUserWithEmailAndPassword(auth, e, p)` | `supabase.auth.signUp({email, password, options})` | Direct swap |
| `signInWithPopup(auth, provider)` | `supabase.auth.signInWithOAuth({provider, options})` | **Popup → Redirect** (behavior change) |
| `onAuthStateChanged(auth, cb)` | `supabase.auth.onAuthStateChange(cb)` | Direct swap |
| `sendPasswordResetEmail(auth, email)` | `supabase.auth.resetPasswordForEmail(email, options)` | Direct swap |
| `user.uid` | `user.id` | Field name change |
| `user.emailVerified` | `user.email_confirmed_at !== null` | Field name + type change |
| Manual Firestore profile write in register | Automatic via PostgreSQL trigger | Profile created automatically |
| Plaintext password in cookie | Session token in localStorage (automatic) | Security improvement |

---

## Open Questions

1. **Welcome email on registration**
   - What we know: `sendWelcomeEmail` from `sendGridService` is imported in Register.tsx and called after successful Firebase registration
   - What's unclear: Should this be triggered in Phase 1? The Supabase `register()` hook doesn't call it. Supabase can trigger emails via Database webhooks or Edge Functions but that's not wired up yet.
   - Recommendation: Remove the `sendWelcomeEmail` call from Register.tsx for Phase 1. Log it as a known regression. Wire it in a future phase via Supabase function or keep calling the Vercel `/api/send-email` endpoint from the register hook.

2. **Supabase Google OAuth redirect URL configuration**
   - What we know: `signInWithGoogle()` passes `redirectTo: window.location.origin` which is `https://weteamup.app` or `http://localhost:3000`
   - What's unclear: Whether the Supabase project dashboard has these redirect URLs whitelisted in Authentication > URL Configuration
   - Recommendation: Verify in Supabase dashboard before testing. Add both `https://weteamup.app` and `http://localhost:3000` to allowed redirect URLs.

3. **Sports preferences data loss**
   - What we know: The 3-step register flow collects sports selection; the old code wrote this to Firestore; the new `register()` hook does not persist it
   - What's unclear: Whether product cares about sports being persisted at registration time
   - Recommendation: Drop sports persistence in Phase 1 (no `sports` column in profiles table). Document as known gap. The UX step is harmless to keep.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `src/index.tsx` — Current provider mounting (no auth provider)
- `src/App.tsx` — Current `useAuth` import from Firebase hook
- `src/hooks/useAuth.ts` — Full Firebase auth implementation
- `src/contexts/SupabaseAuthContext.tsx` — Full Supabase context, ready to use
- `src/hooks/useSupabaseAuth.ts` — Full Supabase hook implementation
- `src/pages/Login.tsx` — Complete current Firebase login implementation
- `src/pages/Register.tsx` — Complete current Firebase register implementation
- `src/components/ResetPasswordDialog.tsx` — Firebase password reset
- `src/components/EmailVerificationBanner.tsx` — Uses `user.emailVerified`
- `src/lib/supabase.ts` — Supabase client initialization
- `src/utils/cookieUtils.ts` — Cookie utilities (`savedPassword` storage mechanism)
- `package.json` — `@supabase/supabase-js` ^2.97.0, `firebase` ^10.14.1

### Secondary (MEDIUM confidence)

- Supabase JS client API — `signInWithOAuth`, `resetPasswordForEmail`, `resend` APIs consistent with `@supabase/supabase-js` v2 documentation patterns as implemented in `useSupabaseAuth.ts`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json and existing implementation files
- Architecture patterns: HIGH — derived from reading actual source files, not assumptions
- Pitfalls: HIGH — derived from reading the exact code that will be changed
- Open questions: MEDIUM — involve external configuration (Supabase dashboard) or product decisions

**Research date:** 2026-02-23
**Valid until:** 2026-03-25 (stable stack, 30-day validity)

---

## File Change Summary

For the planner: exact files changed in this phase.

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/index.tsx` | Edit | Add `SupabaseAuthProvider` import + wrap `<App>` |
| `src/App.tsx` | Edit | Change `useAuth` import from `'./hooks/useAuth'` to `'./contexts/SupabaseAuthContext'` |
| `src/pages/Login.tsx` | Rewrite | Replace Firebase auth + delete Facebook code + delete password cookie logic |
| `src/pages/Register.tsx` | Rewrite | Replace Firebase auth + delete Facebook code + delete password cookie logic + delete Firestore write |
| `src/components/ResetPasswordDialog.tsx` | Edit | Replace Firebase `sendPasswordResetEmail` with Supabase equivalent |
| `src/components/EmailVerificationBanner.tsx` | Edit | Fix `user.emailVerified` → `user.email_confirmed_at`; fix resend call |

**Files NOT changed in Phase 1** (still use Firebase `useAuth` from `hooks/useAuth.ts`):
- `src/components/Navbar.tsx`
- `src/components/MobileNavigation.tsx`
- `src/components/BottomNav.tsx`
- `src/components/EventCard.tsx`
- `src/components/FriendRequestsMenu.tsx`
- `src/components/MatchResultsDialog.tsx`
- `src/components/NotificationsDropdown.tsx`
- `src/components/NotificationsPage.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RegisterDialog.tsx`
- `src/components/ShareMemoryDialog.tsx`
- `src/components/UserProfileDialog.tsx`
- `src/pages/Profile.tsx`
- `src/pages/SavedEvents.tsx`
(These are Phase 2+ work)
