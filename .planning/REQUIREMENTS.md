# Requirements: TeamUp — Mobile UI + Supabase Migration

**Defined:** 2026-02-23
**Core Value:** Players can quickly find partners and join padel events — event creation and joining must work reliably across web and mobile.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Auth Wiring

- [x] **AUTH-01**: SupabaseAuthProvider mounted at app root in index.tsx
- [x] **AUTH-02**: App.tsx imports useAuth from SupabaseAuthContext (not Firebase)
- [x] **AUTH-03**: Auth flow validated end-to-end (login, session persist, logout)

### Auth Page Migration

- [ ] **AUTH-04**: Login page uses Supabase `auth.signInWithPassword` instead of Firebase
- [ ] **AUTH-05**: Login page uses Supabase `auth.signInWithOAuth` for Google sign-in
- [ ] **AUTH-06**: Login page plaintext password cookie removed (Supabase handles session natively)
- [ ] **AUTH-07**: Login page Facebook OAuth code deleted (not configured in Supabase)
- [ ] **AUTH-08**: Register page uses Supabase `auth.signUp` instead of Firebase
- [ ] **AUTH-09**: Register page uses Supabase Google OAuth for social signup
- [ ] **AUTH-10**: Register page Facebook OAuth code deleted

### Data Page Migration

- [x] **DATA-01**: Profile page reads/writes user data via `supabase.from('profiles')` instead of Firestore
- [x] **DATA-02**: SavedEvents page queries via `supabase.from('saved_events')` instead of Firestore
- [x] **DATA-03**: Locations page queries location data via Supabase instead of Firestore
- [x] **DATA-04**: SingleLocation page queries single location detail via Supabase instead of Firestore

### Web Cleanup

- [x] **CLEAN-01**: Legacy `AuthContext.tsx` deleted after all pages migrated
- [x] **CLEAN-02**: Legacy `useAuth.ts` (Firebase hook) deleted
- [x] **CLEAN-03**: Build compiles cleanly with no Firebase imports in migrated files

### Mobile UI

- [x] **MOBILE-01**: Styled TextInput component with label, focus state, error state, and disabled state
- [x] **MOBILE-02**: Primary Button variant with loading state and haptic feedback
- [x] **MOBILE-03**: Secondary Button variant with loading state and haptic feedback
- [x] **MOBILE-04**: Custom bottom sheet component using Modal + Reanimated (not gorhom)
- [x] **MOBILE-05**: Keyboard handling installed and configured via react-native-keyboard-controller
- [x] **MOBILE-06**: All mobile UI components use consistent dark theme (#111111) with #C1FF2F accent
- [x] **MOBILE-07**: Mobile UI components handle accessibility basics (labels, roles, hit targets)

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Web Refactoring

- **REFAC-01**: CreateEventDialog extracted into smaller sub-components
- **REFAC-02**: EventCard refactored with proper separation of concerns
- **REFAC-03**: MUI components replaced with Tailwind-based alternatives

### Mobile Screens

- **MSCR-01**: Mobile app domain screens (events, profile, locations) built
- **MSCR-02**: Mobile Supabase client integration for data fetching
- **MSCR-03**: Mobile push notifications configured

### Testing

- **TEST-01**: Auth flow integration tests
- **TEST-02**: Event lifecycle unit tests
- **TEST-03**: API integration tests

### Security

- **SEC-01**: Rate limiting on event creation
- **SEC-02**: Account deletion endpoint (GDPR)
- **SEC-03**: Event password hashing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Firebase SDK removal from package.json | Other components (EventCard, CreateEventDialog, Home, Community, EventDetails) still use Firebase |
| CreateEventDialog refactoring | 1497 LOC, too risky without test coverage — separate effort |
| EventCard refactoring | 982 LOC, too risky without test coverage — separate effort |
| Performance optimization | Memoization, virtualization — separate milestone |
| Deploying mobile app to stores | Mobile is in development, no store deployment this milestone |
| NativeWind/Tailwind for mobile | Conflicts with Reanimated v4, unstable on current stack |
| gorhom/bottom-sheet | Broken on Expo 54 + Reanimated 4 — using custom Modal instead |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 1 | Pending |
| AUTH-09 | Phase 1 | Pending |
| AUTH-10 | Phase 1 | Pending |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| CLEAN-01 | Phase 2 | Complete |
| CLEAN-02 | Phase 2 | Complete |
| CLEAN-03 | Phase 2 | Complete |
| MOBILE-01 | Phase 3 | Complete |
| MOBILE-02 | Phase 3 | Complete |
| MOBILE-03 | Phase 3 | Complete |
| MOBILE-04 | Phase 3 | Complete |
| MOBILE-05 | Phase 3 | Complete |
| MOBILE-06 | Phase 3 | Complete |
| MOBILE-07 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after roadmap creation — all requirements mapped*
