---
phase: 02-data-page-migration-web-cleanup
plan: 01
subsystem: database
tags: [supabase, firebase-migration, react, typescript, profiles, saved-events]

# Dependency graph
requires:
  - phase: 01-auth-provider-wiring
    provides: SupabaseAuthProvider and useAuth from SupabaseAuthContext wired at index.tsx
provides:
  - Profile.tsx reads/writes from Supabase profiles table with zero Firebase imports
  - SavedEvents.tsx uses a single Supabase join query with zero Firebase imports
  - toAppEvent exported from useSupabaseEvents.ts for reuse across migrated pages
affects: [03-mobile-ui-primitives, future page migrations using toAppEvent]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase join query pattern: saved_events.select with events(*) replaces N+1 Firestore fetches"
    - "toAppEvent transform function exported for shared use across migrated pages"
    - "Supabase User uses .id not .uid — all migrated pages must use user.id"

key-files:
  created: []
  modified:
    - src/hooks/useSupabaseEvents.ts
    - src/pages/Profile.tsx
    - src/pages/SavedEvents.tsx

key-decisions:
  - "toAppEvent exported (not duplicated) so all migrated pages share one transform"
  - "SavedEvents passes empty players array [] to toAppEvent — list view does not show player avatars, acceptable tradeoff"
  - "Pre-existing build error in memory_likes (unrelated file) deferred, not in scope"

patterns-established:
  - "Profile pattern: supabase.from('profiles').select() on load, .update() on submit, no Firebase Auth updateProfile call"
  - "SavedEvents pattern: single join query supabase.from('saved_events').select(events(*)) replaces N+1 Firestore pattern"
  - "Import useAuth from contexts/SupabaseAuthContext (not hooks/useAuth) in all migrated pages"

requirements-completed: [DATA-01, DATA-02]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 02 Plan 01: Profile and SavedEvents Supabase Migration Summary

**Profile.tsx and SavedEvents.tsx migrated to Supabase with zero Firebase imports, using profiles table reads/writes and a single join query replacing N+1 Firestore fetches**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T17:01:48Z
- **Completed:** 2026-02-23T17:06:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Profile.tsx fully migrated: reads `display_name, photo_url, phone_number, level` from `profiles` table, writes updates via `.update()`, no Firebase Auth `updateProfile` call
- SavedEvents.tsx fully migrated: single Supabase join query (`saved_events` joined to `events`) replaces N+1 Firestore promise-all pattern
- `toAppEvent` exported from `useSupabaseEvents.ts` enabling reuse across all future page migrations

## Task Commits

Each task was committed atomically:

1. **Task 1: Export toAppEvent and migrate Profile.tsx to Supabase** - `13204a95` (feat)
2. **Task 2: Migrate SavedEvents.tsx to Supabase with join query** - `24429182` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/hooks/useSupabaseEvents.ts` - Added `export` keyword to `toAppEvent` function
- `src/pages/Profile.tsx` - Replaced Firebase auth+firestore imports with supabase client, migrated loadUserData and handleSubmit
- `src/pages/SavedEvents.tsx` - Replaced Firebase firestore N+1 pattern with single Supabase join query, removed SavedEventRecord interface

## Decisions Made
- `toAppEvent` exported rather than duplicated — single source of truth for Supabase row transformation
- `toAppEvent(row.events, [])` passes empty players array in SavedEvents — list view does not render player avatars, acceptable tradeoff avoiding extra query
- Pre-existing TypeScript build error in `src/pages/Community.tsx` (memory_likes insert type mismatch) is out of scope — deferred per deviation scope rules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing build error in `memory_likes` insert (unrelated to our changes, confirmed by testing stash). Logged as out-of-scope. No action taken per deviation scope boundary rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Profile.tsx and SavedEvents.tsx are fully Supabase-backed
- `toAppEvent` is now available for import by any page migration in this phase
- Remaining pages for Phase 2: MyEvents.tsx and Community.tsx (or as defined in subsequent plans)
- Pre-existing `memory_likes` build error should be addressed in a dedicated plan before production deployment

---
*Phase: 02-data-page-migration-web-cleanup*
*Completed: 2026-02-23*

## Self-Check: PASSED

- FOUND: src/hooks/useSupabaseEvents.ts
- FOUND: src/pages/Profile.tsx
- FOUND: src/pages/SavedEvents.tsx
- FOUND: .planning/phases/02-data-page-migration-web-cleanup/02-01-SUMMARY.md
- FOUND commit: 13204a95 (feat(02-01): migrate Profile.tsx to Supabase, export toAppEvent)
- FOUND commit: 24429182 (feat(02-01): migrate SavedEvents.tsx to Supabase with join query)
