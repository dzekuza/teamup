---
phase: 02-data-page-migration-web-cleanup
plan: 03
subsystem: auth
tags: [supabase, firebase, auth, typescript, re-export-shim, backward-compatibility]

# Dependency graph
requires:
  - phase: 02-01
    provides: Supabase migration pattern established for page components
  - phase: 02-02
    provides: Locations/SingleLocation migrated to Supabase
provides:
  - AuthContext.tsx as thin re-export shim over SupabaseAuthContext (no Firebase code)
  - useAuth.ts as thin re-export shim over SupabaseAuthContext (no Firebase code)
  - CompatUser type: Supabase User + uid/emailVerified/displayName/photoURL aliases for Firebase backward compatibility
affects:
  - All remaining unmigrated components (Navbar, EventCard, ProtectedRoute, etc.) that use useAuth
  - Future migration phases that replace user.uid with user.id

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CompatUser type: extends Supabase User with Firebase-compatible property aliases (uid=id, emailVerified=!!email_confirmed_at)
    - Re-export shim pattern: legacy path file contains only re-export from new path, preserving all existing imports

key-files:
  created: []
  modified:
    - src/contexts/AuthContext.tsx
    - src/hooks/useAuth.ts
    - src/contexts/SupabaseAuthContext.tsx

key-decisions:
  - "CompatUser type added to SupabaseAuthContext to provide uid/emailVerified aliases — avoids modifying 50+ usages in unmigrated components"
  - "Object.assign with prototype preservation used for toCompatUser to retain Supabase User object structure"
  - "Re-export shims keep legacy import paths working — no cascade changes needed in 13+ unmigrated components"

patterns-established:
  - "Re-export shim: when retiring a legacy file, replace with single re-export pointing to new location"
  - "CompatUser: when changing user type, add alias properties rather than updating all consumers at once"

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03]

# Metrics
duration: 21min
completed: 2026-02-23
---

# Phase 02 Plan 03: Auth Context Shim Summary

**Firebase auth context and hook replaced with Supabase re-export shims using CompatUser type for backward-compatible uid/emailVerified aliases**

## Performance

- **Duration:** 21 min
- **Started:** 2026-02-23T17:13:09Z
- **Completed:** 2026-02-23T17:34:23Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- AuthContext.tsx reduced from 37 lines of Firebase auth code to 5-line re-export shim
- useAuth.ts reduced from 160 lines of Firebase auth code to 4-line re-export shim
- SupabaseAuthContext.tsx extended with CompatUser type providing uid, emailVerified, displayName, photoURL for Firebase backward compatibility
- All 13+ unmigrated components (Navbar, EventCard, ProtectedRoute, etc.) continue to resolve imports and compile without modification
- TypeScript errors from user.uid/user.emailVerified accesses on Supabase User type fully resolved

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace AuthContext.tsx and useAuth.ts with Supabase re-export shims** - `01318569` (feat)

**Plan metadata:** _(pending final metadata commit)_

## Files Created/Modified
- `src/contexts/AuthContext.tsx` - Replaced with 5-line re-export shim; no Firebase code
- `src/hooks/useAuth.ts` - Replaced with 4-line re-export shim; no Firebase code
- `src/contexts/SupabaseAuthContext.tsx` - Added CompatUser type, toCompatUser() function, and updated AuthContextType to use CompatUser

## Decisions Made
- CompatUser type added to SupabaseAuthContext rather than modifying 50+ consumer files — the type adds uid (alias for id), emailVerified (alias for !!email_confirmed_at), displayName, and photoURL for Firebase property compatibility
- toCompatUser() uses Object.assign with prototype preservation to build CompatUser from a Supabase User, ensuring all original Supabase properties remain intact
- Re-export shims keep the legacy import paths alive so unmigrated components don't require cascade changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added CompatUser type to resolve TypeScript errors from user.uid/user.emailVerified access**
- **Found during:** Task 1 (Replace AuthContext.tsx and useAuth.ts with re-export shims)
- **Issue:** After replacing shims, build failed with TS2339 errors across 13+ unmigrated components that access user.uid (Firebase) and user.emailVerified (Firebase) — Supabase User type has id and email_confirmed_at instead
- **Fix:** Added CompatUser type to SupabaseAuthContext extending Supabase User with Firebase-compatible alias properties; updated AuthContextType to use CompatUser; added toCompatUser() adapter function
- **Files modified:** src/contexts/SupabaseAuthContext.tsx
- **Verification:** CI=false npm run build now shows only pre-existing TS2769 memory_likes error (unrelated to auth migration)
- **Committed in:** 01318569 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug introduced by shim)
**Impact on plan:** Auto-fix essential for build to pass. No scope creep — CompatUser is a minimal adapter in SupabaseAuthContext, not a new architecture.

## Issues Encountered
- **Pre-existing build failure:** Build was already broken before this plan (TS2769: memory_likes insert type error in Community page area). This error is out of scope and documented in STATE.md blockers. Our changes do not affect this error — only the TS2339 auth user property errors are resolved by this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AuthContext.tsx and useAuth.ts are now Firebase-free re-export shims
- All existing import paths continue to work transparently via CompatUser backward compatibility
- Remaining work: unmigrated components (Navbar, EventCard, FriendRequestsMenu, etc.) still use user.uid in Firebase Firestore calls — those need individual migration in future plans
- Pre-existing TS2769 memory_likes build error should be addressed in a dedicated plan

## Self-Check: PASSED

- FOUND: src/contexts/AuthContext.tsx
- FOUND: src/hooks/useAuth.ts
- FOUND: src/contexts/SupabaseAuthContext.tsx
- FOUND: .planning/phases/02-data-page-migration-web-cleanup/02-03-SUMMARY.md
- FOUND: commit 01318569

---
*Phase: 02-data-page-migration-web-cleanup*
*Completed: 2026-02-23*
