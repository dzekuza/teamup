# TeamUp (WebPadel)

## What This Is

A web and mobile application for padel and sports players to find partners, organize events, and build community. Users create/join events (max 4 players typical for padel), manage friends, share post-event memories, and browse venue locations. Focused on the Lithuanian market (Vilnius-area venues). The web app is live at teamup.lt / weteamup.app, and a React Native Expo mobile app is in early development with UI primitives built.

## Core Value

Players can quickly find partners and join padel events — the event creation and joining flow must work reliably across both web and mobile.

## Requirements

### Validated

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
- ✓ SupabaseAuthProvider wired at app root — v1.0
- ✓ Login page fully migrated from Firebase to Supabase — v1.0
- ✓ Register page fully migrated from Firebase to Supabase — v1.0
- ✓ Profile page fully migrated from Firebase to Supabase — v1.0
- ✓ SavedEvents page fully migrated from Firebase to Supabase — v1.0
- ✓ Locations page fully migrated from Firebase to Supabase — v1.0
- ✓ SingleLocation page fully migrated from Firebase to Supabase — v1.0
- ✓ Legacy AuthContext.tsx replaced with Supabase re-export shim — v1.0
- ✓ Build compiles cleanly with no Firebase imports in migrated files — v1.0
- ✓ Mobile UI primitives (TextInput, Button, BottomSheet) built with brand theming — v1.0
- ✓ Mobile keyboard handling configured globally — v1.0

### Active

(None — define with `/gsd:new-milestone`)

### Out of Scope

- Full component refactoring of CreateEventDialog (1497 LOC) — too risky without tests, separate effort
- EventCard refactoring (982 LOC) — separate effort with proper test coverage
- Removing Firebase SDK from package.json — only after ALL components migrated (32 files still import Firebase)
- MUI to Tailwind migration — gradual, not this milestone
- Performance optimization (memoization, virtualization) — separate effort
- Account deletion / GDPR compliance — separate milestone
- Rate limiting — separate security effort
- NativeWind/Tailwind for mobile — conflicts with Reanimated v4, unstable on current stack
- gorhom/bottom-sheet — broken on Expo 54 + Reanimated 4, using custom Modal instead

## Context

Shipped v1.0 with 3 phases (8 plans) on 2026-02-23.
- **Web auth:** All auth flows (login, register, password reset, Google OAuth) use Supabase. SupabaseAuthProvider at root, legacy auth files are re-export shims with CompatUser for backward compatibility.
- **Web data:** 6 pages migrated to Supabase (Login, Register, Profile, SavedEvents, Locations, SingleLocation). 32 files still import Firebase (EventCard, CreateEventDialog, Home, Community, EventDetails, etc.).
- **Mobile:** React Native Expo app in `mobile/` with brand tokens, AppTextInput, AppButton (haptics + Reanimated 4), custom BottomSheet, and KeyboardProvider wired. No domain screens yet.
- **Known issues:** Pre-existing TS2769 build error in Community.tsx (memory_likes insert type mismatch). Firebase Storage CDN URLs still used for static assets.
- **Tech stack:** React 18.2 + TypeScript + Tailwind + Supabase (web), React Native Expo + Reanimated 4 (mobile).

## Constraints

- **Tech stack (web):** React 18.2 + TypeScript + Tailwind + Supabase — no new frameworks
- **Tech stack (mobile):** React Native Expo — follow Expo conventions
- **Styling:** Primary accent `#C1FF2F`, dark theme `#111111`/`#1E1E1E`, mobile-first
- **Build target:** Must compile cleanly (`npm run build` with `CI=false`)
- **Deployment:** Vercel for web, no deployment changes needed this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate remaining 6 pages to Supabase | Complete the auth/data migration for pages that still use Firebase directly | ✓ Good — all 6 pages migrated cleanly |
| Wire SupabaseAuthProvider at root | Single source of auth truth, removes dual-context confusion | ✓ Good — all route guards use Supabase |
| Improve mobile UI with both visual polish and component quality | User wants full pass on inputs, buttons, sheets with proper patterns | ✓ Good — brand-consistent primitives built |
| Keep Firebase SDK in package.json for now | Other components (EventCard, CreateEventDialog, Home, Community, EventDetails) still use it | ✓ Good — 32 files still import Firebase |
| CompatUser type for backward compatibility | Avoids modifying 50+ usages in unmigrated components | ✓ Good — zero cascade changes needed |
| Re-export shim pattern for legacy auth files | Preserves all existing imports without modifying consumers | ✓ Good — clean migration path |
| Custom BottomSheet via Modal + Reanimated 4 | gorhom broken on Expo 54 + Reanimated 4 | ✓ Good — smooth spring animation, no dep issues |
| Remove plaintext password cookie during Login migration | Security bug — storing plaintext passwords in cookies | ✓ Good — security vulnerability eliminated |
| Remove Facebook OAuth entirely | Not configured in Supabase, no plans to add | ✓ Good — dead code removed |

---
*Last updated: 2026-02-23 after v1.0 milestone*
