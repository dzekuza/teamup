# Architecture Research

**Domain:** Cross-platform sports social app (React web + React Native Expo mobile, shared Supabase backend)
**Researched:** 2026-02-23
**Confidence:** HIGH (web patterns from codebase inspection + official docs; MEDIUM for mobile component patterns from current docs)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├────────────────────────────┬────────────────────────────────────────┤
│       WEB (React 18.2)     │      MOBILE (React Native Expo 54)     │
│  ┌─────────┐ ┌──────────┐  │  ┌──────────┐ ┌──────────────────┐   │
│  │  Pages  │ │Components│  │  │  Screens │ │  UI Components   │   │
│  └────┬────┘ └────┬─────┘  │  └────┬─────┘ └────────┬─────────┘   │
│       └───────────┘        │       └────────────────┘              │
│             ↓              │                 ↓                      │
│      Custom Hooks          │          Custom Hooks                  │
│  (useSupabaseAuth,         │     (useColorScheme, etc.)             │
│   useSupabaseEvents)       │                                        │
├────────────────────────────┴────────────────────────────────────────┤
│                        SERVICE LAYER                                 │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐   │
│  │ supabaseEmailService │  │ supabaseNotificationService        │   │
│  └─────────────────────┘  └────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                    │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌────────────────┐   │
│  │ Supabase │  │ Supabase  │  │ Supabase  │  │    Vercel      │   │
│  │   Auth   │  │  Database │  │  Storage  │  │  (send-email)  │   │
│  └──────────┘  └───────────┘  └───────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `SupabaseAuthProvider` | Single source of auth truth for web app | Wraps app root in `index.tsx`, exposes `useAuth()` hook via context |
| `useSupabaseAuth` hook | Auth state + CRUD (login, register, signOut, signInWithGoogle) | `supabase.auth.*` calls, `onAuthStateChange` subscription |
| Page components (web) | Route-level data ownership, orchestrate child components | Import Supabase hooks directly, pass data as props downward |
| UI components (web) | Presentational, receive props, emit callbacks | `src/components/` — no data fetching |
| Mobile `_layout.tsx` | Navigation shell, ThemeProvider, StatusBar | Expo Router root layout, wraps all screens |
| Mobile screen files | Route-level (same as web pages) | `app/(tabs)/*.tsx` — owns data fetching for screen |
| Mobile UI components | Reusable primitive wrappers | `components/themed-*.tsx` — wrap RN primitives with theme |
| Supabase service layer | Encapsulate multi-step Supabase operations | Notification triggers, email dispatches |

## Recommended Project Structure

### Web (`src/`)

```
src/
├── contexts/
│   └── SupabaseAuthContext.tsx    # ONLY auth context (remove legacy AuthContext.tsx post-migration)
├── hooks/
│   ├── useSupabaseAuth.ts         # auth state + actions
│   ├── useSupabaseEvents.ts       # event data operations
│   └── use*.ts                    # one hook per data domain
├── lib/
│   └── supabase.ts                # supabase client singleton
├── services/
│   ├── supabaseEmailService.ts    # email orchestration
│   └── supabaseNotificationService.ts
├── pages/                         # route-level components, own data fetching
├── components/                    # presentational, no direct Supabase calls
│   └── ui/                        # primitive wrappers (Button, Input, Card)
└── types/
    └── supabase.ts                # DB-aligned types, no Firebase types
```

### Mobile (`mobile/teamup/`)

```
mobile/teamup/
├── app/
│   ├── _layout.tsx                # Root: ThemeProvider + Stack navigator
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Tab bar config
│   │   ├── index.tsx              # Home screen
│   │   └── explore.tsx            # Explore screen
│   └── modal.tsx                  # Modal screen
├── components/
│   ├── ui/                        # Primitive wrappers (collapsible, icon-symbol)
│   ├── themed-text.tsx            # Text with dark/light theming
│   ├── themed-view.tsx            # View with dark/light theming
│   ├── parallax-scroll-view.tsx   # Animated scroll header
│   └── [feature-components].tsx   # Domain-specific reusables
├── hooks/
│   ├── use-color-scheme.ts        # Platform-aware color scheme
│   └── use-theme-color.ts         # Token resolution (light/dark)
└── constants/
    └── Colors.ts                  # Design token definitions
```

### Structure Rationale

- **`app/` is routes only:** Expo Router convention — screens live here, non-screen logic goes elsewhere. This mirrors web's `pages/` containing only route-level components.
- **`components/` owns reusables:** Themed wrappers (`ThemedText`, `ThemedView`) act as design-system primitives identical to web's `src/components/ui/`. Add domain feature components here too.
- **`hooks/` owns platform logic:** Color scheme, keyboard behavior, auth state — keep out of screen files to allow reuse.
- **No shared code between web and mobile:** These are separate apps with different rendering targets. Attempting to share business logic via a monorepo workspace is valid long-term but out of scope for this milestone.

## Architectural Patterns

### Pattern 1: Single Auth Context at Root

**What:** `SupabaseAuthProvider` wraps the entire React app in `index.tsx`, making `useAuth()` available everywhere without prop drilling.

**When to use:** Always. This is table stakes for auth in React apps. The dual-context problem (`AuthContext.tsx` Firebase + `SupabaseAuthContext.tsx`) is resolved by wiring SupabaseAuthProvider at root and removing the legacy one.

**Trade-offs:** Simplest approach. Downside: any re-render of the provider re-renders all consumers. Mitigated by memoizing the context value with `useMemo`.

**Example:**
```typescript
// src/index.tsx — after migration
root.render(
  <React.StrictMode>
    <SupabaseAuthProvider>
      <CookieProvider>
        <App />
      </CookieProvider>
    </SupabaseAuthProvider>
  </React.StrictMode>
);

// src/App.tsx — import from SupabaseAuthContext
import { useAuth } from './contexts/SupabaseAuthContext';
// NOT: import { useAuth } from './hooks/useAuth' (legacy Firebase hook)
```

### Pattern 2: Page-Level Data Ownership (Web)

**What:** Each page component is responsible for fetching its own data via Supabase hooks. It does not receive data from parent components (except `user` from auth context). Components below the page receive data via props.

**When to use:** All web page migrations. Already established in codebase pattern.

**Trade-offs:** Simple, predictable. Slight redundancy if two pages need the same query — extract to shared hook in that case.

**Example:**
```typescript
// src/pages/SavedEvents.tsx — after migration
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

const SavedEvents: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const fetchSaved = async () => {
      const { data } = await supabase
        .from('saved_events')
        .select('*, events(*)')
        .eq('user_id', user?.id);
      setSavedEvents(data ?? []);
    };
    if (user) fetchSaved();
  }, [user]);
  // ...
};
```

### Pattern 3: Themed Primitive Wrappers (Mobile)

**What:** All native `Text`, `View`, and `ScrollView` usage goes through `ThemedText`, `ThemedView` wrappers that resolve color tokens from `constants/Colors.ts` via `useThemeColor`. Feature components then compose these wrappers.

**When to use:** Every mobile UI component. Already established in the existing mobile scaffold — extend this pattern for new domain components.

**Trade-offs:** Small indirection overhead. Massive benefit: changing a color token updates the entire app. Consistent with the web's CSS variable / `cn()` theming approach.

**Example:**
```typescript
// components/EventCard.tsx (mobile)
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function EventCard({ event }: { event: Event }) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle">{event.title}</ThemedText>
      <ThemedText>{event.location}</ThemedText>
    </ThemedView>
  );
}
```

### Pattern 4: Keyboard-Safe Input Containers (Mobile)

**What:** Any screen with a `TextInput` wraps its content in `KeyboardAvoidingView` (with `behavior="padding"` on iOS, `behavior="height"` on Android). Scrollable forms use `KeyboardAwareScrollView` from `react-native-keyboard-controller`.

**When to use:** Login, Register, Profile edit, Create Event screens on mobile.

**Trade-offs:** `KeyboardAvoidingView` alone is fragile — behavior differs per platform. `react-native-keyboard-controller` provides a unified, reliable API (MEDIUM confidence — Expo docs link it as the recommended solution).

**Example:**
```typescript
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* form inputs */}
  </ScrollView>
</KeyboardAvoidingView>
```

### Pattern 5: Incremental Page-by-Page Firebase Removal

**What:** Migrate one page at a time. Swap Firebase imports for Supabase equivalents. Keep Firebase SDK in `package.json` until ALL consumers are migrated. Compile-check after each page.

**When to use:** This milestone's 6-page migration (Login, Register, Profile, SavedEvents, Locations, SingleLocation).

**Trade-offs:** Leaves Firebase SDK present longer than ideal. Benefit: each page migration is independently verifiable and mergeable. Avoids "big bang" rewrite risk.

**Migration Checklist per page:**
1. Replace `import { auth } from '../firebase'` → `import { useAuth } from '../contexts/SupabaseAuthContext'`
2. Replace `import { db } from '../firebase'` → `import { supabase } from '../lib/supabase'`
3. Replace `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword`
4. Replace `getDocs/getDoc` with `supabase.from().select()`
5. Replace `setDoc/updateDoc` with `supabase.from().upsert()/update()`
6. Replace Firebase error codes with Supabase `AuthError` handling

## Data Flow

### Auth Flow (after SupabaseAuthProvider wired at root)

```
App Load
    ↓
SupabaseAuthProvider mounts
    ↓
useSupabaseAuth: supabase.auth.getSession()
    ↓ (resolves)
user/session populated in context
    ↓
App.tsx: useAuth() → { user, loading }
    ↓
Protected routes render (user present) or redirect to /login (null)
```

### Page Data Flow (Web, post-migration)

```
User navigates to /saved-events
    ↓
SavedEvents.tsx mounts
    ↓
useAuth() → user.id
    ↓
supabase.from('saved_events').select('*, events(*)').eq('user_id', user.id)
    ↓
State: setSavedEvents(data)
    ↓
Render EventCard components with data as props
    ↓
User action (unsave) → supabase.from('saved_events').delete()
    ↓
Re-fetch or optimistic state update
```

### Auth State Change (Realtime)

```
supabase.auth.onAuthStateChange listener (in useSupabaseAuth)
    ↓ (fires on login / logout / token refresh)
setUser / setSession updated
    ↓
React Context re-renders consumers
    ↓
App.tsx route guard re-evaluates
```

### Key Data Flows

1. **Event join:** `event_players` insert → notification service → SendGrid API via `/api/send-email` Vercel route
2. **Profile save (post-migration):** `supabase.from('profiles').update()` + Supabase Auth user metadata update via `supabase.auth.updateUser()`
3. **Friend request:** `friend_requests` insert → notification service → realtime subscription fires on recipient's client

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k users | Current monolith is fine. Supabase free tier handles it. No changes needed. |
| 10k-100k users | Enable Supabase connection pooling (PgBouncer). Add indexes on `event_players.user_id` and `events.date`. Profile hot path may benefit from caching. |
| 100k+ users | Consider edge functions for heavy computations. Read replicas for analytics queries. CDN for storage assets (Supabase Storage already uses CDN). |

### Scaling Priorities

1. **First bottleneck:** Supabase real-time subscriptions per connection limit. Mitigation: scope subscriptions narrowly (per-user channels, not global broadcast).
2. **Second bottleneck:** Locations page doing full event scans across all locations. Mitigation: spatial index on venue coordinates, partial indexes on active events.

## Anti-Patterns

### Anti-Pattern 1: Dual Auth Contexts Coexisting

**What people do:** Keep both `AuthContext.tsx` (Firebase) and `SupabaseAuthContext.tsx` active, with different pages importing from each.

**Why it's wrong:** `App.tsx` currently calls `useAuth()` from `hooks/useAuth` (Firebase hook). Pages migrated to Supabase call `useAuth()` from `contexts/SupabaseAuthContext`. Two different hooks with the same name from different modules. User state may diverge. One context shows user as logged in while the other hasn't loaded.

**Do this instead:** Wire `SupabaseAuthProvider` at root in `index.tsx`. Update `App.tsx` to import `useAuth` from `contexts/SupabaseAuthContext`. Delete `AuthContext.tsx` and `hooks/useAuth.ts` only after ALL pages are migrated.

### Anti-Pattern 2: Firebase Calls Inside Components (Not Pages)

**What people do:** `CreateEventDialog`, `EventCard` make Firestore calls internally. Each renders independently without coordinating with the page's data fetch.

**Why it's wrong:** These are 1497-LOC and 982-LOC components respectively — complex, fragile, and outside this milestone's scope. Touching them without tests risks regressions to the core event flow.

**Do this instead:** Leave these components on Firebase for this milestone. The project scope explicitly excludes them. Only migrate the 6 listed pages where Firebase usage is isolated and replaceable.

### Anti-Pattern 3: Importing Supabase Client Directly in UI Components

**What people do:** Call `supabase.from('events').select()` directly inside a button's `onClick` in a presentational component.

**Why it's wrong:** Presentational components become stateful data-fetchers. They're harder to test, harder to reuse, and violate the boundary between display and data.

**Do this instead:** Pass callbacks as props from page-level components. The page owns data, the component owns display.

### Anti-Pattern 4: React Native StyleSheet Inline Objects

**What people do:** `style={{ backgroundColor: '#C1FF2F', padding: 16 }}` directly on every `View`.

**Why it's wrong:** Creates new object references on every render. React Native's reconciler treats them as changed props even if values are identical.

**Do this instead:** Use `StyleSheet.create()` at module level, or use NativeWind/Tailwind class strings if NativeWind is added. The existing mobile scaffold uses `StyleSheet.create()` — follow that pattern.

### Anti-Pattern 5: Skipping `KeyboardAvoidingView` on Mobile Forms

**What people do:** Render TextInput fields in a plain `View` or `ScrollView` without keyboard-aware wrapping.

**Why it's wrong:** On iOS, the soft keyboard will cover input fields, making the form unusable. On Android, behavior depends on `windowSoftInputMode`.

**Do this instead:** Always wrap forms in `KeyboardAvoidingView` with platform-specific behavior, and use `ScrollView` with `keyboardShouldPersistTaps="handled"` inside it.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `supabase.auth.*` via `useSupabaseAuth` hook | Session auto-refreshed by Supabase client |
| Supabase DB | `supabase.from().select/insert/update/delete` in hooks + pages | Use generated types from `src/types/supabase.ts` |
| Supabase Realtime | `supabase.channel().on('postgres_changes')` in service layer | Subscribe in hooks, unsubscribe on unmount |
| Supabase Storage | `supabase.storage.from('bucket').upload()` | 3 buckets: avatars, event-covers, memory-images |
| SendGrid | HTTP POST to `/api/send-email` Vercel route from `supabaseEmailService.ts` | Never call SendGrid directly from client |
| MapLibre GL (web) | `<Map>` component in Locations/SingleLocation pages | Only used on web, not in mobile |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `index.tsx` ↔ `App.tsx` | `SupabaseAuthProvider` wraps `App` | Context value flows down |
| `App.tsx` ↔ Pages | React Router `<Route>` + `useAuth()` for guard | Pages never import from App |
| Pages ↔ Components | Props only (data down, callbacks up) | No cross-component Supabase calls |
| Pages ↔ Service layer | Direct import + function call | Services are not classes, just async functions |
| Web ↔ Mobile | None — separate apps | Shared: Supabase project, design tokens (manually kept in sync) |
| Mobile `app/` ↔ `components/` | Import via `@/components/` path alias | `@/` resolves to project root via tsconfig paths |

## Build Order Implications

The dependency chain determines migration order:

1. **Wire `SupabaseAuthProvider` at root first** — every other migration depends on `useAuth()` returning Supabase user, not Firebase user. All page migrations fail to work correctly until auth context is unified.

2. **Migrate auth pages next (Login, Register)** — these have no data dependencies beyond auth. Simplest migrations. Validate auth flow end-to-end before proceeding.

3. **Migrate profile page** — depends on auth (user.id) + profile data from Supabase `profiles` table. Must verify profile trigger works on Supabase.

4. **Migrate data pages (SavedEvents, Locations, SingleLocation)** — depend on working auth from step 1-2. Each is independent of the others.

5. **Mobile UI improvements** — independent of web migration. Can be done in parallel. No Supabase wiring needed for pure UI work.

6. **Remove legacy `AuthContext.tsx`** — only after all 6 pages migrated and build is clean. This is the final cleanup step.

## Sources

- [Expo Router: Core concepts](https://docs.expo.dev/router/basics/core-concepts/) — file-based routing architecture (HIGH confidence, official docs)
- [Expo Router: Navigation layouts](https://docs.expo.dev/router/basics/layout/) — `_layout.tsx` patterns (HIGH confidence, official docs)
- [Supabase: Migrate from Firebase Auth](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth) — auth migration patterns (HIGH confidence, official docs)
- [Expo: Keyboard handling](https://docs.expo.dev/guides/keyboard-handling/) — KeyboardAvoidingView best practices (HIGH confidence, official docs)
- [Expo UI SDK](https://docs.expo.dev/versions/latest/sdk/ui/) — native component availability (MEDIUM confidence — SDK is in beta as of research date)
- [LogRocket: Best React Native UI libraries 2026](https://blog.logrocket.com/best-react-native-ui-component-libraries/) — UI library ecosystem overview (MEDIUM confidence)
- Codebase inspection: `src/`, `mobile/teamup/` direct file reads (HIGH confidence)

---
*Architecture research for: TeamUp — React web + React Native Expo mobile, Supabase backend*
*Researched: 2026-02-23*
