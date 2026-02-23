# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Players can quickly find partners and join padel events — event creation and joining must work reliably across web and mobile.
**Current focus:** Phase 2 — Data Page Migration Web Cleanup

## Current Position

Phase: 2 of 3 (Data Page Migration Web Cleanup)
Plan: 2 of TBD in current phase
Status: In progress
Last activity: 2026-02-23 — Completed 02-02: Locations.tsx and SingleLocation.tsx migrated to Supabase

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 7 min
- Total execution time: 0.24 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-data-page-migration-web-cleanup | 2 | 14 min | 7 min |

**Recent Trend:**
- Last 5 plans: 5 min, 9 min
- Trend: Stable

*Updated after each plan completion*
| Phase 03-mobile-ui-primitives P01 | 3 | 2 tasks | 3 files |
| Phase 03-mobile-ui-primitives P02 | 2 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Wire SupabaseAuthProvider at index.tsx first — hard prerequisite before any page migration
- Roadmap: Remove plaintext password cookie during Login migration, not after
- Roadmap: Phase 3 (mobile) is parallel-safe with web migration phases
- Roadmap: Facebook OAuth removed entirely; Supabase does not have it configured
- 02-01: toAppEvent exported (not duplicated) — single source of truth for Supabase row transformation
- 02-01: SavedEvents passes empty players [] to toAppEvent — list view does not render player avatars, acceptable tradeoff
- 02-02: Location pages pass empty players [] to toAppEvent — Locations/SingleLocation do not render player lists, correct behavior
- 02-02: Firebase Storage CDN URLs in MOCK_GALLERY are static assets, not Firebase SDK usage — left unchanged
- [Phase 03-mobile-ui-primitives]: Mobile directory is mobile/ not mobile/teamup/ - plan path discrepancy resolved silently
- [Phase 03-mobile-ui-primitives]: expo-haptics was not installed despite research claiming it was - auto-installed as Rule 3 blocking fix
- [Phase 03-mobile-ui-primitives]: Brand tokens pattern established: always import from @/constants/theme, never hardcode hex in component files
- [Phase 03-mobile-ui-primitives]: 03-02: Used Modal + Reanimated 4 for BottomSheet instead of gorhom (broken on Expo 54 + Reanimated 4)
- [Phase 03-mobile-ui-primitives]: 03-02: KeyboardProvider as outermost wrapper in RootLayout enables global KeyboardAwareScrollView support
- [Phase 03-mobile-ui-primitives]: 03-02: runOnJS delayed unmount pattern prevents modal flash on dismiss

### Pending Todos

None yet.

### Blockers/Concerns

- `SupabaseAuthProvider` is not yet wired at `src/index.tsx` — all page migrations silently run against Firebase until this is done. Must be first task of Phase 1.
- 32 files still import Firebase — Firebase SDK must remain in `package.json` until unmigrated components (EventCard, CreateEventDialog, Home, Community, EventDetails) are addressed in a future milestone.
- RLS policies may silently return empty arrays instead of errors — each migrated page in Phase 2 must be verified with a real authenticated test account.
- Pre-existing TypeScript build error in memory_likes insert (Community page area) — unrelated to current migration, should be addressed in a dedicated plan.

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 02-02-PLAN.md — Locations.tsx and SingleLocation.tsx migrated to Supabase
Resume file: None
