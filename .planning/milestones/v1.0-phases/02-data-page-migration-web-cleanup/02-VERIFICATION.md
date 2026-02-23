---
phase: 02-data-page-migration-web-cleanup
verified: 2026-02-23T18:00:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "npm run build completes with no Firebase imports in the six migrated files"
    status: failed
    reason: "Build fails due to pre-existing TS2769 error in Community.tsx (memory_likes insert type mismatch). The six scoped files themselves contain zero Firebase imports and are individually clean, but the build does not complete successfully."
    artifacts:
      - path: "src/pages/Community.tsx"
        issue: "Pre-existing TS2769: memory_likes insert argument type 'never' — unrelated to Phase 2 scope but blocks the build from completing"
    missing:
      - "Fix the memory_likes TypeScript error in Community.tsx so that npm run build completes successfully (deferred from Phase 2 per plan decision)"
---

# Phase 2: Data Page Migration + Web Cleanup Verification Report

**Phase Goal:** All six scoped pages use Supabase for data — Profile, SavedEvents, Locations, and SingleLocation query Supabase tables, and the legacy Firebase auth context and hook are deleted.
**Verified:** 2026-02-23T18:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Derived from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can view and edit their profile; changes persist in Supabase `profiles` table | VERIFIED | Profile.tsx reads via `supabase.from('profiles').select(...)` (line 40) and writes via `.update(...)` (line 68); uses `user.id` throughout; zero Firebase imports |
| 2 | User can view saved events populated from `supabase.from('saved_events')` | VERIFIED | SavedEvents.tsx uses single join query `saved_events.select(events(*)).eq('user_id', user.id)` (lines 58-66); transforms via `toAppEvent`; zero Firebase imports |
| 3 | User can view padel venue locations/events loaded from Supabase instead of Firestore | VERIFIED | Locations.tsx queries `supabase.from('events').eq('location', ...).order(...)` (lines 85-90); SingleLocation.tsx does the same (lines 264-272); `convertTimestampsToStrings` deleted from both; zero Firebase SDK imports |
| 4 | `AuthContext.tsx` and `useAuth.ts` contain no Firebase auth code — re-export shims pointing to SupabaseAuthContext | VERIFIED | AuthContext.tsx is 5 lines: re-exports `SupabaseAuthProvider as AuthProvider, useAuth` from `./SupabaseAuthContext`. useAuth.ts is 4 lines: re-exports `useAuth` from `../contexts/SupabaseAuthContext`. Zero Firebase code in either file. |
| 5 | `npm run build` completes with no Firebase imports in the six migrated files | FAILED | Build fails with TS2769 in `Community.tsx` (memory_likes insert type mismatch) — pre-existing error documented in all three plan summaries as out-of-scope. The six scoped files have zero Firebase SDK imports verified individually. |

**Score:** 4/5 success criteria verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/pages/Profile.tsx` | Supabase profiles reads + writes, zero Firebase imports | VERIFIED | Reads `display_name, photo_url, phone_number, level` from profiles; updates via `.update()`; imports `useAuth` from `SupabaseAuthContext` directly |
| `src/pages/SavedEvents.tsx` | Supabase join query on saved_events, zero Firebase imports | VERIFIED | Single join query replacing N+1 Firestore pattern; uses `toAppEvent`; zero Firebase |
| `src/pages/Locations.tsx` | Supabase events-at-location query, zero Firebase imports | VERIFIED | `supabase.from('events').select('*').eq('location', selectedLocation.name).order(...)` — both `fetchEventsForLocation` and `handleEventUpdated` use Supabase |
| `src/pages/SingleLocation.tsx` | Supabase events-at-location query, zero Firebase imports | VERIFIED | Same pattern as Locations.tsx; Firebase CDN URLs in MOCK_GALLERY are static string constants, not Firebase SDK imports |
| `src/contexts/AuthContext.tsx` | Re-export shim: no Firebase auth code | VERIFIED | 5-line file: single re-export of `{ SupabaseAuthProvider as AuthProvider, useAuth }` from `./SupabaseAuthContext` |
| `src/hooks/useAuth.ts` | Re-export shim: no Firebase hook code | VERIFIED | 4-line file: single re-export of `{ useAuth }` from `../contexts/SupabaseAuthContext` |
| `src/hooks/useSupabaseEvents.ts` | `toAppEvent` exported | VERIFIED | `export function toAppEvent(row: any, players: any[]): AppEvent` at line 6 |
| `src/contexts/SupabaseAuthContext.tsx` | CompatUser type with uid/emailVerified aliases | VERIFIED | `CompatUser = User & { uid, emailVerified, displayName, photoURL }` added; `toCompatUser()` adapter function wraps Supabase User for Firebase backward compatibility |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Profile.tsx` | `supabase.from('profiles')` | select + update calls | WIRED | Lines 40-43 (read), 67-75 (write) both connected and result consumed (`setDisplayName`, error handling) |
| `SavedEvents.tsx` | `supabase.from('saved_events')` | join query with events(*) | WIRED | Lines 58-66 select with `events (*)` nested query; result mapped through `toAppEvent` at line 72 |
| `SavedEvents.tsx` | `toAppEvent` | import from `useSupabaseEvents` | WIRED | `import { toAppEvent } from '../hooks/useSupabaseEvents'` (line 11); called at line 72 |
| `Locations.tsx` | `supabase.from('events').eq('location', ...)` | events-at-location query | WIRED | Line 85-90 (fetchEventsForLocation), lines 137-142 (handleEventUpdated) |
| `SingleLocation.tsx` | `supabase.from('events').eq('location', ...)` | events-at-location query | WIRED | Lines 264-272 (fetchEventsForLocation), lines 289-297 (handleEventUpdated) |
| `AuthContext.tsx` | `SupabaseAuthContext.tsx` | re-export of AuthProvider, useAuth | WIRED | `export { SupabaseAuthProvider as AuthProvider, useAuth } from './SupabaseAuthContext'` |
| `useAuth.ts` | `SupabaseAuthContext.tsx` | re-export of useAuth | WIRED | `export { useAuth } from '../contexts/SupabaseAuthContext'` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DATA-01 | 02-01 | Profile page reads/writes via `supabase.from('profiles')` | SATISFIED | Profile.tsx verified: select on load (line 40), update on submit (line 67), zero Firebase imports |
| DATA-02 | 02-01 | SavedEvents queries via `supabase.from('saved_events')` | SATISFIED | SavedEvents.tsx verified: join query line 59, result rendered via EventCard grid |
| DATA-03 | 02-02 | Locations page queries via Supabase | SATISFIED | Locations.tsx verified: events query line 85-90, no convertTimestampsToStrings, no Firebase SDK |
| DATA-04 | 02-02 | SingleLocation page queries via Supabase | SATISFIED | SingleLocation.tsx verified: events query lines 264-272, Firebase CDN URLs are static strings not SDK |
| CLEAN-01 | 02-03 | Legacy AuthContext.tsx deleted (no Firebase auth code) | SATISFIED (SHIM) | File was replaced with a 5-line re-export shim — zero Firebase auth code remains. Files was not literally deleted because 13+ unmigrated components still import from this path. The requirement's intent (no Firebase auth code) is met. |
| CLEAN-02 | 02-03 | Legacy useAuth.ts (Firebase hook) deleted | SATISFIED (SHIM) | File was replaced with a 4-line re-export shim — zero Firebase hook code remains. Same rationale as CLEAN-01. |
| CLEAN-03 | 02-03 | Build compiles cleanly, no Firebase imports in migrated files | BLOCKED | `npm run build` fails on Community.tsx TS2769 (memory_likes) — pre-existing, out-of-scope error. The six scoped files have zero Firebase imports. Build failure is not caused by Phase 2 changes. |

**Note on CLEAN-01/CLEAN-02:** REQUIREMENTS.md describes these as "deleted" but the phase plan explicitly chose re-export shims as the safe strategy since deletion would break 13+ unmigrated components. The shim strategy satisfies the requirement's goal (Firebase auth code gone) while preserving build stability. The TODO comment in both shim files documents the planned eventual deletion.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/Locations.tsx` | 262 | Firebase CDN URL as `onError` fallback image string | Info | Static string constant, not Firebase SDK usage. No import from firebase. Acceptable — planned for future static asset migration. |
| `src/pages/SingleLocation.tsx` | 149-171 | Firebase Storage CDN URLs in MOCK_GALLERY constants | Info | Static hardcoded strings, not Firebase SDK. Plan explicitly noted: "Firebase Storage CDN URLs in MOCK_GALLERY are static assets, not Firebase SDK usage — left unchanged." |
| `src/pages/Community.tsx` | 110 | TS2769 memory_likes insert type error | Blocker (pre-existing) | Prevents `npm run build` from completing. Pre-dates Phase 2 — present before any Phase 2 changes (confirmed by git stash in 02-02-SUMMARY). Blocks CLEAN-03. |

---

## Human Verification Required

### 1. Profile Edits Persist in Supabase

**Test:** Log in with a real test account, navigate to /profile, change display name and avatar, click "Update Profile."
**Expected:** Success message appears; refreshing the page shows the updated values loaded back from the `profiles` table.
**Why human:** RLS policies on `profiles` table could silently block the update without returning an error. Needs a live Supabase connection with a real authenticated user.

### 2. SavedEvents Empty-Array RLS Silent Failure Check

**Test:** Log in with a real test account that has at least one saved event in the `saved_events` table.
**Expected:** The saved events list populates with actual event cards. If the list is empty when events are expected, it indicates an RLS policy is silently returning an empty result.
**Why human:** Success criterion 2 explicitly requires validation against RLS silent failures — this cannot be verified without a live Supabase connection and test data.

### 3. Location Events Load from Supabase

**Test:** Navigate to /locations, select a venue, open its detail page (/location/:name).
**Expected:** Event cards for that venue appear if events exist in the `events` table with `location` matching the venue name. No Firestore errors in the console.
**Why human:** Requires live data — the location name string matching between the `PADEL_LOCATIONS` constants and the `events.location` column values must align exactly.

---

## Gaps Summary

One gap blocks full goal achievement:

**Build does not complete (CLEAN-03):** `npm run build` fails with a pre-existing TypeScript error in `Community.tsx` at the `memory_likes` insert call. This error predates Phase 2 and was explicitly documented as out-of-scope in all three plan summaries. All six Phase 2 scoped files are individually clean — zero Firebase SDK imports, correct Supabase queries, proper wiring. The gap is a deferred pre-existing error that needs a dedicated fix plan.

**What the fix requires:** Add the `memory_likes` table type to the Supabase TypeScript types in `src/types/supabase.ts` (or fix the insert call in Community.tsx to match the existing type definition), so the TypeScript compiler accepts the insert argument type.

---

## Summary

Phase 2 achieved its primary goal: all four data pages (Profile, SavedEvents, Locations, SingleLocation) now query Supabase exclusively. AuthContext.tsx and useAuth.ts are Firebase-free re-export shims. The CompatUser type bridges Firebase property names (uid, emailVerified) to Supabase equivalents, enabling backward compatibility for 13+ unmigrated components without breaking the build.

The sole gap is a pre-existing TypeScript error in Community.tsx that blocks `npm run build` from completing. This error was present before Phase 2 began and is unrelated to any Phase 2 change.

---

_Verified: 2026-02-23T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
