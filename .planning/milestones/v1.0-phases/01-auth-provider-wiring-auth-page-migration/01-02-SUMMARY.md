---
phase: 01-auth-provider-wiring-auth-page-migration
plan: 02
subsystem: auth
tags: [supabase, firebase, auth-migration, login, password-reset, google-oauth]

# Dependency graph
requires:
  - phase: 01-auth-provider-wiring-auth-page-migration
    plan: 01
    provides: SupabaseAuthProvider mounted at root with login/signInWithGoogle exported from useAuth
provides:
  - Login.tsx uses Supabase email/password login and Google OAuth via SupabaseAuthContext
  - ResetPasswordDialog.tsx uses supabase.auth.resetPasswordForEmail (no Firebase)
  - Plaintext password cookie security bug removed from codebase
  - Facebook OAuth and Facebook SDK entirely removed from Login page
affects:
  - 01-auth-provider-wiring-auth-page-migration (remaining plans can reference Login as migrated)
  - any future plan touching Login or password reset flow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migrated pages import useAuth from contexts/SupabaseAuthContext (not hooks/useAuth)"
    - "Google OAuth via signInWithGoogle() — no navigate() after call (browser redirect, code won't execute)"
    - "Password reset uses supabase.auth.resetPasswordForEmail with redirectTo: window.location.origin/reset-password"
    - "Error messages use err.message directly — no Firebase error code mapping needed"

key-files:
  created: []
  modified:
    - src/pages/Login.tsx
    - src/components/ResetPasswordDialog.tsx

key-decisions:
  - "Remove rememberMe checkbox and state entirely — it only controlled the plaintext password cookie, which is being removed as a security fix"
  - "Keep savedEmail cookie logic in Login — saving email for convenience is acceptable; saving password is the security bug"
  - "signInWithGoogle handler does NOT call navigate('/') after the call — Supabase OAuth triggers a browser redirect, so subsequent code won't execute; navigate is only in the catch block cleanup"
  - "Pre-existing TS2769 build error in Community page (memory_likes insert) confirmed pre-existing — not introduced by this plan, out of scope"

patterns-established:
  - "Pattern: Login page step 2 — 'Remember me' checkbox removed when the sole purpose was password cookie storage"

requirements-completed: [AUTH-04, AUTH-05, AUTH-06, AUTH-07]

# Metrics
duration: 4min
completed: 2026-02-23
---

# Phase 01 Plan 02: Login and ResetPasswordDialog Supabase Migration Summary

**Login page and ResetPasswordDialog migrated to Supabase auth: email/password via login(), Google OAuth via signInWithGoogle(), password reset via supabase.auth.resetPasswordForEmail — Facebook OAuth and plaintext password cookie removed entirely**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-23T17:32:53Z
- **Completed:** 2026-02-23T17:36:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `Login.tsx` migrated from Firebase to Supabase: `login()` and `signInWithGoogle()` from `SupabaseAuthContext`, Firebase imports removed, Facebook OAuth deleted, plaintext password cookie security bug fixed
- `ResetPasswordDialog.tsx` migrated from Firebase to Supabase: `supabase.auth.resetPasswordForEmail` replaces `sendPasswordResetEmail`, Firebase imports removed, error handling simplified
- Security improvement: `savedPassword` cookie no longer written anywhere; legacy cookies cleared on Login mount via `removeCookie('savedPassword')`

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Login page from Firebase to Supabase auth** - `27208916` (feat)
2. **Task 2: Migrate ResetPasswordDialog from Firebase to Supabase** - `33a112d9` (feat)

## Files Created/Modified
- `src/pages/Login.tsx` - Replaced Firebase signIn calls with Supabase login()/signInWithGoogle() from SupabaseAuthContext; deleted Facebook OAuth button and SDK useEffect; removed plaintext password cookie writes; added removeCookie('savedPassword') cleanup on mount; removed getFirebaseErrorMessage helper; preserved 2-step UI flow and all styling
- `src/components/ResetPasswordDialog.tsx` - Replaced Firebase sendPasswordResetEmail with supabase.auth.resetPasswordForEmail; removed Firebase imports; simplified error handling to use err.message directly; all JSX/styling preserved

## Decisions Made
- Removed `rememberMe` state and checkbox from Login — its only function was gating `setCookie('savedPassword', ...)` writes, which is the security bug being fixed. Email-only saving (savedEmail) is kept.
- `signInWithGoogle()` handler does NOT call `navigate('/')` after the call — Supabase OAuth triggers a full browser redirect to Google and back via callback URL, so any code after `await signInWithGoogle()` is unreachable. Navigate is only called in catch to clean up loading state.
- `redirectTo` in `resetPasswordForEmail` set to `${window.location.origin}/reset-password` — ensures the reset link deep-links back into the app's password-reset flow rather than a generic Supabase page.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `TS2769` build error in Community page (`memory_likes` insert) blocked `npm run build`. Verified via `git stash` that this error existed before our changes. It is documented in STATE.md blockers and is out of scope for this plan. Both our files compile without TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Login and ResetPasswordDialog are fully Supabase-powered — no Firebase code remains in these files
- Register page migration can proceed as the next auth page in the sequence
- The pre-existing `TS2769` Community page error should be addressed in a dedicated plan before the full build is declared clean

---
*Phase: 01-auth-provider-wiring-auth-page-migration*
*Completed: 2026-02-23*
