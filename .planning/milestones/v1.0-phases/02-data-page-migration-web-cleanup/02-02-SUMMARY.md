---
phase: 02-data-page-migration-web-cleanup
plan: 02
subsystem: database
tags: [supabase, firebase-migration, react, typescript, locations]

# Dependency graph
requires: []
provides:
  - Locations.tsx queries events via Supabase instead of Firestore
  - SingleLocation.tsx queries events via Supabase instead of Firestore
  - convertTimestampsToStrings helper deleted from both pages
  - Server-side ordering replaces manual JS sort in both pages
affects: [03-mobile-ui-primitives]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Events-at-location query: supabase.from('events').select('*').eq('location', name).order('date').order('time')"
    - "Row transform: toAppEvent(row, []) with empty players array for pages that don't display player lists"

key-files:
  created: []
  modified:
    - src/pages/Locations.tsx
    - src/pages/SingleLocation.tsx

key-decisions:
  - "Pass empty players array [] to toAppEvent() for location pages — player lists are not displayed on these pages, empty array is correct"
  - "Firebase Storage CDN URLs in MOCK_GALLERY and fallback image strings are static assets, not Firebase SDK usage — left unchanged per plan instructions"
  - "Pre-existing build error in memory_likes component is out-of-scope — logged as deferred item"

patterns-established:
  - "Location events query: supabase.from('events').select('*').eq('location', name).order('date', {ascending: true}).order('time', {ascending: true})"

requirements-completed:
  - DATA-03
  - DATA-04

# Metrics
duration: 9min
completed: 2026-02-23
---

# Phase 02 Plan 02: Locations and SingleLocation Supabase Migration Summary

**Locations.tsx and SingleLocation.tsx events queries migrated from Firestore to Supabase with convertTimestampsToStrings helper deleted and server-side ordering via `.order()` clauses**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-23T17:01:46Z
- **Completed:** 2026-02-23T17:10:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Removed all Firebase/Firestore SDK imports from Locations.tsx and SingleLocation.tsx
- Deleted the `convertTimestampsToStrings` helper function from both files (Supabase returns ISO strings natively)
- Replaced Firestore `collection/query/where/getDocs` pattern with `supabase.from('events').select().eq().order()` in both `fetchEventsForLocation` and `handleEventUpdated` functions
- Events now sorted server-side via `.order('date').order('time')` instead of manual JS `.sort()` calls
- Events transformed via `toAppEvent(row, [])` for EventCard compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Locations.tsx events query to Supabase** - `fda1b765` (feat)
2. **Task 2: Migrate SingleLocation.tsx events query to Supabase** - `2f8d980d` (feat)

## Files Created/Modified
- `src/pages/Locations.tsx` - Removed Firebase imports, deleted convertTimestampsToStrings, rewrote events query and refresh to use Supabase
- `src/pages/SingleLocation.tsx` - Same migration: Firebase removed, convertTimestampsToStrings deleted, Supabase queries added; MOCK_GALLERY/MOCK_WORKING_HOURS/MOCK_DESCRIPTIONS/MOCK_REVIEWS/MOCK_CONTACT unchanged

## Decisions Made
- Passed empty `[]` for players in `toAppEvent(row, [])` — the Locations and SingleLocation pages display event cards without showing individual player details, so an empty array is correct
- Left Firebase Storage CDN URLs intact in MOCK_GALLERY and fallback image strings — these are static asset URLs, not Firebase SDK imports; the plan explicitly preserved all mock data unchanged

## Deviations from Plan

None — plan executed exactly as written.

Note: A pre-existing TypeScript build error exists in a separate component (`memory_likes` insert) that was present before this plan. It is out of scope for this plan and has been deferred.

## Issues Encountered
- During verification, `git stash` was used to confirm the build error was pre-existing. The stash pop failed due to mobile/node_modules changes, requiring the SingleLocation.tsx changes to be re-applied. Both files were verified clean before committing.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both Locations pages now query events from Supabase — phase 02 data page migration goals for these pages are complete
- The pre-existing memory_likes TypeScript error should be addressed in a future plan before a production build is required
- MOCK_GALLERY images are still served from Firebase Storage CDN — migrating static assets to Supabase Storage is a separate future task

---
*Phase: 02-data-page-migration-web-cleanup*
*Completed: 2026-02-23*

## Self-Check: PASSED

- FOUND: src/pages/Locations.tsx
- FOUND: src/pages/SingleLocation.tsx
- FOUND: .planning/phases/02-data-page-migration-web-cleanup/02-02-SUMMARY.md
- FOUND: commit fda1b765 (Task 1 - Locations.tsx)
- FOUND: commit 2f8d980d (Task 2 - SingleLocation.tsx)
- FOUND: commit 2eb98c8e (metadata)
