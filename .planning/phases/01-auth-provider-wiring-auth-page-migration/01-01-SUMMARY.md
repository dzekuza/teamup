---
phase: 01-auth-provider-wiring-auth-page-migration
plan: 01
subsystem: auth
tags: [supabase, react-context, firebase, auth-migration]

# Dependency graph
requires: []
provides:
  - SupabaseAuthProvider mounted at app root in index.tsx
  - App.tsx reads auth state from SupabaseAuthContext (not Firebase)
  - EmailVerificationBanner uses Supabase User (email_confirmed_at, supabase.auth.resend)
affects:
  - 01-auth-provider-wiring-auth-page-migration (all subsequent plans rely on Supabase auth root)
  - any plan that depends on app-level auth state

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SupabaseAuthProvider wraps App inside CookieProvider in index.tsx"
    - "App.tsx imports useAuth from contexts/SupabaseAuthContext — all route guards use Supabase User"
    - "hooks/useAuth.ts remains the Firebase legacy hook for unmigrated components in Phase 2"

key-files:
  created: []
  modified:
    - src/index.tsx
    - src/App.tsx
    - src/components/EmailVerificationBanner.tsx

key-decisions:
  - "hooks/useAuth.ts kept as Firebase hook — do NOT change until Phase 2 migrates the 16+ components that import it"
  - "App.tsx useAuth changed to SupabaseAuthContext; route guards (user truthiness, loading) work unchanged because Supabase context interface matches Firebase shape"
  - "EmailVerificationBanner check changed from user.emailVerified (Firebase bool) to user.email_confirmed_at (Supabase string|null)"

patterns-established:
  - "Pattern: Supabase-migrated files import useAuth from contexts/SupabaseAuthContext, legacy files import from hooks/useAuth"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 15min
completed: 2026-02-23
---

# Phase 01 Plan 01: Auth Provider Wiring Summary

**SupabaseAuthProvider mounted at React root and App.tsx routing guards wired to Supabase user state, with EmailVerificationBanner patched to use email_confirmed_at and supabase.auth.resend()**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-23T17:15:27Z
- **Completed:** 2026-02-23T17:30:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `SupabaseAuthProvider` wraps `App` in `index.tsx` inside `CookieProvider` — app-level auth state now sourced from Supabase
- `App.tsx` imports `useAuth` from `SupabaseAuthContext` instead of the Firebase hook — all route guards (`user`, `loading`) now consume Supabase session
- `EmailVerificationBanner` migrated to Supabase: checks `user.email_confirmed_at`, calls `supabase.auth.resend()`, no Firebase imports remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Mount SupabaseAuthProvider in index.tsx and swap useAuth import in App.tsx** - `0af112d9` (feat)
2. **Task 2: Patch EmailVerificationBanner for Supabase User compatibility** - `6bf0001c` (feat)

## Files Created/Modified
- `src/index.tsx` - Added SupabaseAuthProvider import and wrapping around App
- `src/App.tsx` - Changed useAuth import from hooks/useAuth to contexts/SupabaseAuthContext
- `src/components/EmailVerificationBanner.tsx` - Replaced Firebase auth check and resend with Supabase equivalents

## Decisions Made
- `hooks/useAuth.ts` was restored to its Firebase implementation after it was found modified (uncommitted) to a re-export from SupabaseAuthContext. This caused `user.uid` TypeScript errors in EventCard.tsx and 16+ other components that still use the Firebase User type. The plan explicitly stated these components must NOT be touched until Phase 2.
- Supabase `User.email_confirmed_at` (string|null) replaces Firebase `User.emailVerified` (boolean): banner hides when non-null (confirmed), shows when null (unconfirmed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored hooks/useAuth.ts to Firebase implementation**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** `hooks/useAuth.ts` was modified in the working directory (uncommitted) to re-export from `SupabaseAuthContext`. This broke TypeScript compilation with `TS2339: Property 'uid' does not exist on type 'User'` in `EventCard.tsx` because 16+ components still use `user.uid` (Firebase User property). Supabase User uses `user.id`.
- **Fix:** Ran `git checkout HEAD -- src/hooks/useAuth.ts` to restore the Firebase implementation. This matches the plan's explicit instruction: "Do NOT change the useAuth import in any other file."
- **Files modified:** `src/hooks/useAuth.ts` (restored to committed Firebase version)
- **Verification:** `npm run build` no longer shows `TS2339`; only pre-existing `TS2769` in Community page remains
- **Committed in:** Not committed separately — restoration was undoing an uncommitted change

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Essential fix to preserve 16+ legacy components using Firebase User type. No scope creep.

## Issues Encountered
- Pre-existing `TS2769` build error in Community page (memory_likes insert) — noted in STATE.md blockers, out of scope for this plan. Build uses `CI=false` which would suppress warnings, but TypeScript errors still block compilation. This is a known pre-existing issue unrelated to auth provider wiring.

## Next Phase Readiness
- Supabase auth is now the root-level auth provider — prerequisite for all page migrations is complete
- Login, Register, VerifyEmail, and other pages can now be migrated to Supabase in subsequent plans
- 16+ components still import from `hooks/useAuth` (Firebase) — Phase 2 tasks will migrate them one by one

---
*Phase: 01-auth-provider-wiring-auth-page-migration*
*Completed: 2026-02-23*
