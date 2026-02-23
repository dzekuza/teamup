# Project Research Summary

**Project:** TeamUp (WebPadel / We Team Up)
**Domain:** Brownfield migration (Firebase to Supabase) + React Native Expo mobile UI polish
**Researched:** 2026-02-23
**Confidence:** MEDIUM-HIGH

## Executive Summary

TeamUp is a production sports-social app (teamup.lt) mid-migration from Firebase to Supabase, with a parallel React Native Expo 54 mobile app in its initial skeleton state. The web app has all Supabase infrastructure in place (hooks, context, service layer, DB schema, storage buckets) but the critical final wiring step — mounting `SupabaseAuthProvider` at the app root in `index.tsx` — has not been done. Until this single step is completed, ALL page migrations will silently run against Firebase state instead of Supabase, producing an invisible split-brain auth failure that is nearly impossible to diagnose page-by-page. This is the highest-leverage task in the entire milestone.

The recommended approach is a two-track execution: (1) on the web, wire the Supabase provider first, then migrate the six Firebase-dependent pages (Login, Register, Profile, SavedEvents, Locations, SingleLocation) one at a time in dependency order; (2) in parallel, build polished mobile UI primitives (TextInput, Button, bottom sheet) using already-installed libraries (Reanimated 4, Gesture Handler 2, expo-haptics) with no new dependencies. The one explicit library to avoid is `@gorhom/bottom-sheet` v5, which has confirmed breakage on Expo SDK 54 + Reanimated 4 — use a custom Reanimated-based modal sheet instead.

Key risks are: (a) the plaintext password stored in cookies in the existing Login.tsx — this must be stripped during migration, not ported; (b) RLS policies on Supabase silently returning empty arrays rather than errors, making query failures invisible; (c) cross-platform keyboard avoidance failures on Android that only appear on physical devices. All three are preventable with specific checks at known migration points.

---

## Key Findings

### Recommended Stack

The web stack requires no new dependencies — `@supabase/supabase-js` v2.97.0, React 18.2, and TypeScript are already in place at correct versions. The Firebase SDK should remain in `package.json` until all 32 Firebase-importing files are migrated; premature removal breaks the unmigrated components (EventCard, CreateEventDialog, Home, Community, EventDetails). The mobile stack is similarly complete: Expo SDK 54, Reanimated 4.1.1, Gesture Handler 2.28.0, expo-haptics, and safe-area-context are all installed. The one missing piece is `react-native-keyboard-controller` (install via `npx expo install react-native-keyboard-controller`) for reliable cross-platform keyboard avoidance on form screens.

**Core technologies:**
- `@supabase/supabase-js` v2.97.0: Auth + database client — already installed, no upgrade needed; all async auth methods and typed client patterns are production-ready
- `SupabaseAuthContext.tsx` + `useSupabaseAuth.ts`: Auth provider and hook — fully implemented, just not wired at root; do not rewrite
- Expo SDK 54 + expo-router v6: Mobile routing — already installed; do not upgrade mid-milestone as SDK upgrades require native rebuild
- `react-native-reanimated` v4.1.1: Animation engine for mobile — drives press feedback and custom bottom sheet; New Architecture enabled by default in SDK 54
- `react-native-keyboard-controller`: Cross-platform keyboard avoidance — only missing mobile dependency; officially recommended by Expo docs for SDK 54

**Avoid:**
- `@gorhom/bottom-sheet` v5: Active breakage on Expo SDK 54 + Reanimated 4; GitHub issues #2471 and #2528 confirm "Cannot read property 'level' of undefined" crash; no confirmed fix as of Feb 2026
- NativeWind v4/v5: Unstable for new installs with Reanimated 4; use `StyleSheet.create()` with brand color constants instead
- Supabase `service_role` key in any `REACT_APP_*` env var: bypasses all RLS — belongs only in Vercel server-side API routes

### Expected Features

The milestone has two parallel feature tracks. The web migration track is primarily a series of low-complexity API substitutions — the key complexity is in the provider wiring and the nuances of specific pages (SavedEvents requires a join query; Login requires removing the password-in-cookie security bug and Facebook OAuth).

**Must have (table stakes — this milestone):**
- `SupabaseAuthProvider` wired at `index.tsx` — unblocks all six page migrations; two-line change with maximum downstream impact
- Login + Register migrated to Supabase auth — core entry points; includes removing password-in-cookie vulnerability and Facebook OAuth
- Profile, SavedEvents, Locations, SingleLocation migrated to Supabase data queries — completes the six-page scope
- Mobile TextInput: focus ring, error state, label, keyboard chaining — users expect this on every form
- Mobile Button: Pressable with animated scale + haptics + loading state — table stakes for native-feel UX
- Mobile bottom sheet: custom Reanimated 4 implementation with backdrop, snap points, handle — avoids gorhom breakage entirely

**Should have (competitive, this milestone):**
- Remove legacy `AuthContext.tsx` and `hooks/useAuth.ts` after all pages migrated — eliminates dual-context confusion for all future development
- Keyboard toolbar (Next/Done) via `react-native-keyboard-controller` `KeyboardToolbar` — professional UX detail on multi-field mobile forms
- Brand-consistent bottom sheet styling (lime `#C1FF2F` handle, dark `#1E1E1E` background) — visual identity consistency with web

**Defer (v2+):**
- Migrate Home, Community, EventDetails, EventCard, CreateEventDialog from Firebase — these are large, complex, and have no test coverage; scope explicitly excludes them
- Remove Firebase SDK from `package.json` — only valid after all 32 Firebase-importing files are migrated
- Mobile app screens (event list, event detail, create event) — this milestone only polishes UI primitives
- Facebook OAuth on mobile — requires Supabase Facebook provider config, Meta App Review, and test user management; not worth the scope for Lithuanian padel market
- Account deletion / GDPR, offline support, rate limiting — v2+

### Architecture Approach

The architecture is a two-tier client system (React web + React Native mobile) sharing a single Supabase backend (Auth, PostgreSQL, Storage, Realtime) with no shared code between web and mobile clients. The web follows a page-owns-data pattern: `SupabaseAuthProvider` at root feeds auth state down via context, pages own their Supabase queries, and presentational components receive data as props only. The mobile follows Expo Router's file-based routing with themed primitive wrappers (`ThemedText`, `ThemedView`) that resolve design tokens from `constants/Colors.ts`.

**Major components:**
1. `SupabaseAuthProvider` (web root) — single source of auth truth; exposes `useAuth()` hook; resolves dual-context split-brain when wired at `index.tsx`
2. Page components (web) — own Supabase data fetching via `useEffect`; pass data down to presentational components via props; no Firestore calls after migration
3. Mobile `_layout.tsx` — navigation shell wrapping all screens; must mount `GestureHandlerRootView` at root for bottom sheet and gesture interactions
4. Mobile UI primitives (TextInput, Button, BottomSheet) — brand-consistent, Reanimated-driven; consume theme tokens; no data fetching
5. Supabase service layer (`supabaseEmailService`, `supabaseNotificationService`) — encapsulate multi-step operations; never called from presentational components

### Critical Pitfalls

1. **SupabaseAuthProvider not wired at root** — All page migrations silently run against Firebase user state. Prevention: wire `<SupabaseAuthProvider>` in `index.tsx` and update `App.tsx` `useAuth` import before touching any page. Verification: `grep "SupabaseAuthProvider" src/index.tsx` must return a match; `useAuth().user?.id` (not `uid`) confirms Supabase context is active.

2. **Plaintext password in cookies** — Login.tsx saves raw password to a 30-day cookie as "remember me." This is a critical security vulnerability. Prevention: during Login migration, delete ALL `setCookie('savedPassword', ...)` calls; Supabase's native session persistence via `localStorage` handles "remember me" automatically. Verification: `grep "savedPassword" src/pages/Login.tsx` must return zero matches.

3. **RLS silently returning empty arrays** — Supabase returns `[]` not errors when RLS policies block queries, making broken queries look like empty data. Prevention: test every Supabase query through the JS client SDK with a real authenticated user (not the SQL editor which runs as superuser); add `console.log('data:', data, 'error:', error)` during migration. Verification: each migrated page must show real data from a test account.

4. **Facebook Auth left on Firebase during migration** — If the Facebook button still uses Firebase OAuth after the Login page is migrated, users who click it create Firebase accounts without Supabase profiles. Prevention: remove Facebook buttons entirely during Login and Register migration; add `// TODO` comment if Facebook OAuth is desired later.

5. **Keyboard avoidance broken on Android** — `KeyboardAvoidingView` behaves differently per Android OEM; inputs can be covered by the soft keyboard. Prevention: use `react-native-keyboard-controller`'s `KeyboardAwareScrollView` on all mobile form screens; test on a physical Android device before considering any form screen complete.

---

## Implications for Roadmap

Based on the dependency chain identified in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, the natural phase structure is:

### Phase 1: Auth Provider Wiring + Auth Page Migration
**Rationale:** The SupabaseAuthProvider not being wired at root is the single blocking dependency for all six page migrations. Every subsequent phase depends on `useAuth()` returning Supabase state. Auth pages (Login, Register) are the first to migrate because they have no data dependencies beyond auth itself, and they surface the two highest-severity security issues (password-in-cookie, Facebook OAuth). Doing this phase first validates the full auth flow end-to-end before touching data pages.
**Delivers:** Working Supabase authentication for all new and migrated pages; security vulnerability removed; Google OAuth via Supabase redirect flow
**Addresses:** Wire SupabaseAuthProvider (P1), Login migration (P1), Register migration (P1), remove password-in-cookie (P1), remove Facebook OAuth (P1)
**Avoids:** Dual-auth split-brain pitfall, plaintext password pitfall, Facebook OAuth pitfall

### Phase 2: Data Page Migration (Profile, SavedEvents, Locations, SingleLocation)
**Rationale:** These four pages all depend on Phase 1 completing (auth context must return Supabase user for `user.id` lookups to work against Supabase tables). They are independent of each other and can be migrated in any order. SavedEvents and Locations have MEDIUM complexity due to join queries and event table scans; Profile and SingleLocation are LOW complexity. Grouping them in one phase keeps the migration narrative clean.
**Delivers:** All six originally-scoped Firebase pages fully migrated to Supabase; legacy `AuthContext.tsx` can be deleted at end of phase; Firebase SDK usage reduced to unmigrated components only
**Uses:** `supabase.from('saved_events').select('*, events(*)')` join pattern, `supabase.from('profiles').update()`, Supabase Storage for avatar uploads
**Avoids:** RLS-silent-empty-array pitfall (verify each page with real test user data)

### Phase 3: Mobile UI Primitives
**Rationale:** Fully independent of the web migration track. Can run in parallel with Phase 1 or Phase 2, but is separated here for clarity. The mobile app is in Expo starter state — no TeamUp screens exist yet. Before any TeamUp screens can be built, the UI primitive layer (TextInput, Button, bottom sheet) must exist. This phase builds those primitives using already-installed dependencies, avoiding the gorhom bottom sheet compatibility trap.
**Delivers:** Brand-consistent, production-quality mobile UI components reusable across all future mobile screens; `react-native-keyboard-controller` installed and working
**Uses:** Reanimated 4 (`useAnimatedStyle`, `withSpring`, `withTiming`), Gesture Handler 2 (`GestureDetector`, `PanGesture`), expo-haptics, safe-area-context, StyleSheet with `#C1FF2F` / `#111111` brand tokens
**Avoids:** gorhom/bottom-sheet breakage (custom implementation), keyboard avoidance Android failure (keyboard-controller), `TouchableOpacity` deprecation (Pressable), inline style object rerender trap (StyleSheet.create)

### Phase Ordering Rationale

- Phase 1 must come first because `SupabaseAuthProvider` wiring is a prerequisite for any page migration to function correctly — this is not an architectural preference, it is a hard technical dependency
- Phase 2 depends on Phase 1 completing, but each of the four pages within Phase 2 is independent of the others
- Phase 3 is parallel-safe with Phases 1 and 2 — mobile UI work has zero dependency on web migration state
- Unmigrated large components (EventCard 982 LOC, CreateEventDialog 1497 LOC, Home, Community, EventDetails) are intentionally excluded from all three phases; they belong in a subsequent test-first milestone
- Firebase SDK removal is the final cleanup step after a future milestone completes the remaining component migrations

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (SavedEvents):** The joined Supabase query `select('*, events(*)')` pattern should be validated against the actual RLS policies on `saved_events` and `events` tables; confirm the anon vs. authenticated policy on `events` allows the join read
- **Phase 3 (custom bottom sheet):** The custom Reanimated 4 + Gesture Handler 2 bottom sheet implementation has no prior art in this codebase; the gesture conflict between inner ScrollView and outer pan gesture requires careful setup — recommend a focused implementation spike before building the full component

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (auth wiring):** Patterns are fully documented in `useSupabaseAuth.ts`, STACK.md migration tables, and Supabase official docs; no additional research needed
- **Phase 2 (Profile, Locations, SingleLocation):** Standard Supabase CRUD substitutions; patterns are in STACK.md migration tables and the existing codebase hooks

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core web stack verified against official Supabase JS v2.97.0 docs; Expo SDK 54 compatibility verified against official changelog; gorhom breakage verified against primary GitHub issue reports |
| Features | MEDIUM | Web migration features derived from direct codebase inspection (HIGH confidence); mobile UI feature patterns from official RN + Expo docs (HIGH); competitor analysis from public apps (MEDIUM) |
| Architecture | HIGH | Web architecture patterns from direct `src/` codebase inspection + official Supabase Auth docs; mobile architecture from official Expo Router docs; scaling considerations are forward projections (MEDIUM) |
| Pitfalls | MEDIUM-HIGH | Web pitfalls are HIGH confidence — derived from direct code review (password cookie confirmed in Login.tsx, missing provider confirmed in index.tsx); mobile pitfalls are MEDIUM — mobile screen code not yet written so some pitfalls are anticipatory |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **gorhom/bottom-sheet SDK 54 fix status:** If the maintainers release a confirmed fix before Phase 3 begins, the custom implementation recommendation should be revisited. Monitor GitHub issue #2528 before starting mobile sheet work.
- **Supabase Facebook OAuth feasibility:** Research file recommends removing Facebook OAuth entirely. If product requires it, a separate spike is needed to configure the Supabase Facebook provider and validate the Meta App Review requirements.
- **RLS policy audit:** The migration schema in `supabase/migrations/20250223000001_initial_schema.sql` should be reviewed per-table before each page migration to confirm the RLS policy matches expected data access patterns. This is flagged but not pre-solved in research.
- **Supabase Realtime vs. plain queries for migrated pages:** Research determines that Realtime is not needed for the 6 pages in scope. If notifications or live event updates are surfaced during planning, this decision should be revisited for those specific pages.

---

## Sources

### Primary (HIGH confidence)
- Supabase JS auth reference — https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Supabase Firebase Auth migration guide — https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth
- Expo SDK 54 Changelog — https://expo.dev/changelog/sdk-54
- Expo Keyboard Handling Guide — https://docs.expo.dev/guides/keyboard-handling/
- Expo Router core concepts — https://docs.expo.dev/router/basics/core-concepts/
- React Native Pressable docs — https://reactnative.dev/docs/pressable
- Reanimated v4 docs — https://docs.swmansion.com/react-native-reanimated/examples/bottomsheet/
- Supabase RLS documentation — https://supabase.com/docs/guides/database/postgres/row-level-security
- Expo safe areas guide — https://docs.expo.dev/develop/user-interface/safe-areas/
- Direct codebase inspection: `src/index.tsx`, `src/App.tsx`, `src/pages/Login.tsx`, `src/contexts/SupabaseAuthContext.tsx`, `src/hooks/useSupabaseAuth.ts`, `mobile/teamup/`

### Secondary (MEDIUM confidence)
- gorhom/react-native-bottom-sheet GitHub issues #2471, #2476, #2507, #2528 — SDK 54 + Reanimated v4 breakage confirmed
- Expo UI SDK docs — https://docs.expo.dev/versions/latest/sdk/ui/ (SDK in beta as of research date)
- Expo SDK 54 + Reanimated 4 migration notes — https://medium.com/@shanavascruise/upgrading-to-expo-54-and-react-native-0-81-a-developers-survival-story-2f58abf0e326
- React Native FlatList performance (2025) — https://reactnativeexample.com/react-native-flatlist-performance-issues-expert-solutions-2025/

### Tertiary (LOW confidence)
- NativeWind v4 + SDK 54 setup — multiple Medium articles and GitHub discussions (compatible but requires babel config; not recommended for this project mid-migration)

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
