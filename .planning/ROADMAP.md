# Roadmap: TeamUp — Mobile UI + Supabase Migration

## Overview

This milestone completes the Firebase-to-Supabase migration for the web app's remaining six pages and builds the mobile UI primitive layer. The web track must run in dependency order — auth provider wired at root first, then auth pages, then data pages, then legacy cleanup. The mobile track is parallel-safe and builds TextInput, Button, and bottom sheet components using already-installed Reanimated 4 dependencies.

## Phases

- [ ] **Phase 1: Auth Provider Wiring + Auth Page Migration** - Wire SupabaseAuthProvider at app root and migrate Login/Register to Supabase auth
- [ ] **Phase 2: Data Page Migration + Web Cleanup** - Migrate Profile, SavedEvents, Locations, SingleLocation to Supabase and remove legacy Firebase auth artifacts
- [ ] **Phase 3: Mobile UI Primitives** - Build brand-consistent TextInput, Button, and bottom sheet components for the React Native Expo app

## Phase Details

### Phase 1: Auth Provider Wiring + Auth Page Migration
**Goal**: Users authenticate entirely through Supabase — the provider is wired at app root, Login and Register work via Supabase, and the plaintext-password security bug is eliminated.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10
**Success Criteria** (what must be TRUE):
  1. User can log in with email/password and the session persists across browser refresh — no Firebase auth calls are made
  2. User can sign in with Google OAuth via Supabase redirect flow from both Login and Register pages
  3. No plaintext password is stored in any cookie — the savedPassword cookie logic is gone
  4. Facebook OAuth buttons are absent from Login and Register pages
  5. `grep "SupabaseAuthProvider" src/index.tsx` returns a match; `useAuth()` in App.tsx returns a Supabase user object (`.id` not `.uid`)
**Plans:** 3 plans
Plans:
- [ ] 01-01-PLAN.md — Wire SupabaseAuthProvider at root + App.tsx import swap + EmailVerificationBanner patch
- [ ] 01-02-PLAN.md — Migrate Login page + ResetPasswordDialog to Supabase
- [ ] 01-03-PLAN.md — Migrate Register page to Supabase

### Phase 2: Data Page Migration + Web Cleanup
**Goal**: All six scoped pages use Supabase for data — Profile, SavedEvents, Locations, and SingleLocation query Supabase tables, and the legacy Firebase auth context and hook are deleted.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):
  1. User can view and edit their profile and the changes persist in the Supabase `profiles` table
  2. User can view their saved events list populated from `supabase.from('saved_events')` with a real test account — no empty-array RLS silent failures
  3. User can view padel venue locations loaded from Supabase instead of Firestore
  4. `AuthContext.tsx` and `useAuth.ts` contain no Firebase auth code — they are re-export shims pointing to SupabaseAuthContext
  5. `npm run build` completes with no Firebase imports in the six migrated files
**Plans:** 2/3 plans executed
Plans:
- [ ] 02-01-PLAN.md — Migrate Profile + SavedEvents to Supabase (export toAppEvent, join query)
- [ ] 02-02-PLAN.md — Migrate Locations + SingleLocation to Supabase (remove convertTimestampsToStrings)
- [ ] 02-03-PLAN.md — Replace AuthContext.tsx + useAuth.ts with Supabase re-export shims + build verify

### Phase 3: Mobile UI Primitives
**Goal**: The React Native Expo app has a set of brand-consistent, production-quality UI primitives — TextInput, Button (primary + secondary), and a custom bottom sheet — that all future mobile screens can build on.
**Depends on**: Nothing (parallel-safe with Phase 1 and Phase 2)
**Requirements**: MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04, MOBILE-05, MOBILE-06, MOBILE-07
**Success Criteria** (what must be TRUE):
  1. A developer can import and render a TextInput with label, placeholder, focus ring, error message, and disabled state — all styled in the dark theme with `#C1FF2F` accent
  2. A developer can render a Primary Button and Secondary Button that each show a loading spinner, fire haptic feedback on press, and animate scale with Reanimated
  3. A developer can open and dismiss a bottom sheet that slides up from the bottom with a handle, dark backdrop, and `#C1FF2F` handle accent — implemented with Reanimated 4, not gorhom
  4. All form screens in the mobile app have keyboard avoidance that works on both iOS and Android via `react-native-keyboard-controller`
  5. All components pass basic accessibility checks — inputs have accessible labels, buttons have roles and sufficient hit targets (44x44pt minimum)
**Plans:** 2 plans
Plans:
- [ ] 03-01-PLAN.md — Theme tokens + TextInput + Button primitives
- [ ] 03-02-PLAN.md — BottomSheet component + KeyboardProvider wiring

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Provider Wiring + Auth Page Migration | 0/3 | Not started | - |
| 2. Data Page Migration + Web Cleanup | 2/3 | In Progress|  |
| 3. Mobile UI Primitives | 0/2 | Not started | - |
