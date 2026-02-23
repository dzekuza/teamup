# TeamUp (WebPadel)

## What This Is

A web and mobile application for padel and sports players to find partners, organize events, and build community. Users create/join events (max 4 players typical for padel), manage friends, share post-event memories, and browse venue locations. Focused on the Lithuanian market (Vilnius-area venues). The web app is live at teamup.lt / weteamup.app, and a React Native Expo mobile app is in development.

## Core Value

Players can quickly find partners and join padel events — the event creation and joining flow must work reliably across both web and mobile.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase. -->

- ✓ User can create account with email/password — existing (Supabase Auth)
- ✓ User can sign in with Google OAuth — existing (Supabase Auth)
- ✓ User receives email verification after signup — existing (Supabase Auth native)
- ✓ User session persists across browser refresh — existing (Supabase session)
- ✓ User can create padel events with date, time, location, player count — existing
- ✓ User can join/leave events — existing (event_players junction table)
- ✓ User can view event details with player list and location map — existing
- ✓ User can browse and filter events on home page — existing
- ✓ User can manage friend list (send/accept/remove requests) — existing
- ✓ User can invite friends when creating events — existing
- ✓ User can share post-event photo memories — existing
- ✓ User can like memories — existing (memory_likes table)
- ✓ User can save/bookmark events — existing (saved_events table)
- ✓ User receives in-app notifications — existing (Supabase Realtime)
- ✓ User receives email notifications for event invitations — existing (SendGrid)
- ✓ User can view padel venue locations on a map — existing (MapLibre GL)
- ✓ User can view community page — existing
- ✓ User can edit their profile — existing
- ✓ User can report match results — existing (match_results table)
- ✓ User can create private events with password — existing
- ✓ User can share events via QR code and link — existing

### Active

<!-- Current scope — this milestone. -->

- [ ] Mobile app UI components follow React Native best practices (inputs, buttons, sheets)
- [ ] Mobile app UI has consistent visual polish (spacing, colors, animations)
- [ ] Mobile app components handle keyboard, loading, and error states properly
- [ ] Web app Login page fully migrated from Firebase to Supabase
- [ ] Web app Register page fully migrated from Firebase to Supabase
- [ ] Web app Profile page fully migrated from Firebase to Supabase
- [ ] Web app SavedEvents page fully migrated from Firebase to Supabase
- [ ] Web app Locations page fully migrated from Firebase to Supabase
- [ ] Web app SingleLocation page fully migrated from Firebase to Supabase
- [ ] SupabaseAuthProvider wired up at app root (index.tsx)
- [ ] Legacy AuthContext.tsx removed after full migration
- [ ] Build compiles cleanly with no Firebase imports in migrated files

### Out of Scope

- Full component refactoring of CreateEventDialog (1497 LOC) — too risky without tests, separate effort
- EventCard refactoring (982 LOC) — separate effort with proper test coverage
- Test coverage improvements — valuable but not this milestone
- Removing Firebase SDK from package.json — only after ALL components migrated, not just these 6
- MUI to Tailwind migration — gradual, not this milestone
- Performance optimization (memoization, virtualization) — separate effort
- Account deletion / GDPR compliance — separate milestone
- Rate limiting — separate security effort

## Context

- **Branch:** `claude/ui-update-supabase-migration-UGrDQ` — work already started
- **Migration pattern:** Supabase hooks and services exist (`useSupabaseAuth`, `useSupabaseEvents`, `supabaseNotificationService`, `supabaseEmailService`). Remaining pages still directly import from `firebase/firestore` and `firebase/auth`.
- **Mobile app:** React Native Expo project in `mobile/teamup/` with screens and navigation already set up. UI components need quality improvements.
- **Web app auth:** `SupabaseAuthContext.tsx` exists but may not be wired at root level in `index.tsx`. App.tsx uses `useAuth()` which needs to point to Supabase.
- **Known concerns:** 32 files still import Firebase; dual auth contexts create confusion; complex components (CreateEventDialog 1497 LOC, EventCard 982 LOC) are fragile.

## Constraints

- **Tech stack (web):** React 18.2 + TypeScript + Tailwind + Supabase — no new frameworks
- **Tech stack (mobile):** React Native Expo — follow Expo conventions
- **Styling:** Primary accent `#C1FF2F`, dark theme `#111111`/`#1E1E1E`, mobile-first
- **Build target:** Must compile cleanly (`npm run build` with `CI=false`)
- **Deployment:** Vercel for web, no deployment changes needed this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate remaining 6 pages to Supabase | Complete the auth/data migration for pages that still use Firebase directly | — Pending |
| Wire SupabaseAuthProvider at root | Single source of auth truth, removes dual-context confusion | — Pending |
| Improve mobile UI with both visual polish and component quality | User wants full pass on inputs, buttons, sheets with proper patterns | — Pending |
| Keep Firebase SDK in package.json for now | Other components (EventCard, CreateEventDialog, Home, Community, EventDetails) still use it | — Pending |

---
*Last updated: 2026-02-23 after initialization*
