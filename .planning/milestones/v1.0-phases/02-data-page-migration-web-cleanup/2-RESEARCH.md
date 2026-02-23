# Phase 2: Data Page Migration + Web Cleanup - Research

**Researched:** 2026-02-23
**Domain:** Supabase data access patterns, Firebase→Supabase migration, React context cleanup
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Profile page reads/writes user data via `supabase.from('profiles')` instead of Firestore | Supabase `profiles` table exists with matching columns; `upsert` pattern for profile writes; `useAuth` from SupabaseAuthContext provides `user.id` |
| DATA-02 | SavedEvents page queries via `supabase.from('saved_events')` instead of Firestore | `saved_events` table exists with RLS `auth.uid() = user_id`; join to `events` table needed; RLS silent-failure risk flagged |
| DATA-03 | Locations page queries location data via Supabase instead of Firestore | Locations page only uses Firestore for event-by-location queries; the location list itself is the hardcoded `PADEL_LOCATIONS` constant — no Firestore read for locations; only the events-at-location query needs migrating |
| DATA-04 | SingleLocation page queries single location detail via Supabase instead of Firestore | Same pattern as DATA-03 — static data stays; only events-at-location Firestore query needs replacing |
| CLEAN-01 | Legacy `AuthContext.tsx` deleted after all pages migrated | 18 files currently import from `AuthContext`/`useAuth`; only pages in scope for this phase (Profile, SavedEvents, Locations, SingleLocation) need migrating before deletion is safe; remaining importers (EventCard, Navbar, etc.) are out of scope — deletion is NOT safe this phase |
| CLEAN-02 | Legacy `useAuth.ts` (Firebase hook) deleted | Same constraint as CLEAN-01 — depends on all non-out-of-scope importers being migrated first |
| CLEAN-03 | Build compiles cleanly with no Firebase imports in the six migrated files | Six files = Profile, SavedEvents, Locations, SingleLocation + App.tsx + index.tsx (or just the 4 page files depending on Phase 1 scope) |
</phase_requirements>

---

## Summary

Phase 2 migrates four page components from Firebase/Firestore to Supabase and then deletes the legacy Firebase auth hook and context. The data migration work is straightforward — all four target tables (`profiles`, `saved_events`, `events`) already exist in Supabase with correct RLS policies and typed schema in `src/types/supabase.ts`. The Supabase client is initialized and typed at `src/lib/supabase.ts`.

The critical complexity is not the API syntax (Supabase is simpler than Firestore) but two structural issues: (1) `SavedEvents` in Firestore does a two-step fetch (savedEvents → then N individual event fetches), which should be replaced by a single Supabase join; (2) the cleanup requirements (CLEAN-01, CLEAN-02) depend on ALL importers of `AuthContext.tsx` and `useAuth.ts` being migrated, but 14+ components outside this phase's scope still import those files. This means the delete of those two files cannot happen this phase unless Phase 1 also migrated `App.tsx`, `Navbar`, etc.

**Primary recommendation:** Migrate the four data pages cleanly, verify each with a real authenticated session, and for CLEAN-01/CLEAN-02 assess whether the remaining 14 importer files were addressed in Phase 1 before deleting. If they were not, CLEAN-01 and CLEAN-02 are blocked.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | Already installed | Supabase client for auth + data | Project standard, typed with `Database` generic |
| `src/lib/supabase.ts` | Project file | Typed `supabase` client singleton | Already configured with `Database` type |
| `src/types/supabase.ts` | Project file | Full DB type definitions | All tables typed, use `Profile`, `SavedEvent`, `Event` aliases |
| `src/contexts/SupabaseAuthContext.tsx` | Project file | `useAuth()` hook providing Supabase `User` | Replaces `AuthContext.tsx` for the migrated pages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/types/index.ts` | Project file | Legacy `Event`, `Player` shapes consumed by `EventCard` | `EventCard` still expects the legacy shape — the `toAppEvent()` transformer pattern from `useSupabaseEvents.ts` must be reused |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `supabase.from()` calls in each page | Shared custom hook | Custom hook adds abstraction; for 4 pages with distinct queries, inline calls are simpler and match the existing `useSupabaseEvents` pattern |

**Installation:** No new packages needed. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. All files stay in their existing locations:
```
src/
├── pages/
│   ├── Profile.tsx          # Migrate: replace firebase/firestore + firebase/auth
│   ├── SavedEvents.tsx      # Migrate: replace firebase/firestore
│   ├── Locations.tsx        # Migrate: replace firebase/firestore events query
│   └── SingleLocation.tsx   # Migrate: replace firebase/firestore events query
├── contexts/
│   ├── AuthContext.tsx       # DELETE (CLEAN-01) — only after all importers migrated
│   └── SupabaseAuthContext.tsx  # Already exists; pages import useAuth from here
├── hooks/
│   ├── useAuth.ts           # DELETE (CLEAN-02) — only after all importers migrated
│   └── useSupabaseAuth.ts   # Already exists; used by SupabaseAuthContext
```

### Pattern 1: Auth Hook Swap

**What:** Each migrated page imports `useAuth` from `SupabaseAuthContext` instead of the Firebase `AuthContext`.
**When to use:** Every page migration in this phase.

```typescript
// BEFORE (Firebase)
import { useAuth } from '../hooks/useAuth';
// or
import { useAuth } from '../contexts/AuthContext';
// user.uid is a string

// AFTER (Supabase)
import { useAuth } from '../contexts/SupabaseAuthContext';
// user.id is a string (same concept, different property name)
```

Key difference: Firebase `User` uses `user.uid`; Supabase `User` uses `user.id`.

### Pattern 2: Profile Read + Update

**What:** Replace Firestore `getDoc(doc(db, 'users', user.uid))` + `setDoc` with Supabase `select` + `update/upsert`.
**When to use:** Profile.tsx migration (DATA-01).

```typescript
// BEFORE (Firestore)
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

// Load
const userDoc = await getDoc(doc(db, 'users', user.uid));
const userData = userDoc.data();

// Save
await updateProfile(auth.currentUser!, { displayName, photoURL: selectedAvatar });
await setDoc(doc(db, 'users', user.uid), { displayName, photoURL: selectedAvatar, ... }, { merge: true });

// AFTER (Supabase)
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

// Load
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
// profile.display_name, profile.photo_url, profile.phone_number, profile.level

// Save — upsert handles both insert and update
const { error } = await supabase
  .from('profiles')
  .update({
    display_name: displayName,
    photo_url: selectedAvatar,
    phone_number: phoneNumber,
    level: level,
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id);
```

Note: Supabase Auth does not have a `updateProfile()` equivalent the way Firebase does for `displayName`/`photoURL` on the auth user object. All profile data is stored in the `profiles` table, not in the Supabase auth user metadata. The `update` on `profiles` is sufficient — no separate auth profile update needed.

### Pattern 3: SavedEvents — Join Query (Replaces N+1 Fetches)

**What:** Firestore does a two-step fetch (query `savedEvents` → loop and fetch each `events` doc). Supabase can do this in one join.
**When to use:** SavedEvents.tsx migration (DATA-02).

```typescript
// BEFORE (Firestore) — N+1 problem
const savedEventsQuery = query(collection(db, 'savedEvents'), where('userId', '==', user.uid));
const savedEventsSnapshot = await getDocs(savedEventsQuery);
// Then loops: savedEventRecords.map(async record => getDoc(doc(db, 'events', record.eventId)))

// AFTER (Supabase) — single join query
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('saved_events')
  .select(`
    id,
    saved_at,
    events (*)
  `)
  .eq('user_id', user.id);

// data is: Array<{ id, saved_at, events: EventRow | null }>
// Filter nulls (deleted events), then transform with toAppEvent() if EventCard needs legacy shape
const events = (data ?? [])
  .map(row => row.events)
  .filter(Boolean);
```

The `events (*)` syntax is Supabase's PostgREST foreign key join syntax. Since `saved_events.event_id` references `events.id`, Supabase resolves the relationship automatically.

### Pattern 4: Events-at-Location Query

**What:** Replace Firestore `where('location', '==', selectedLocation.name)` query with Supabase equivalent.
**When to use:** Locations.tsx and SingleLocation.tsx migration (DATA-03, DATA-04).

```typescript
// BEFORE (Firestore)
const eventsQuery = query(
  collection(db, 'events'),
  where('location', '==', selectedLocation.name)
);
const querySnapshot = await getDocs(eventsQuery);
// Then complex Timestamp → string conversion

// AFTER (Supabase)
import { supabase } from '../lib/supabase';

const { data: eventsData, error } = await supabase
  .from('events')
  .select('*')
  .eq('location', selectedLocation.name)
  .order('date', { ascending: true })
  .order('time', { ascending: true });

// No Timestamp conversion needed — Supabase returns ISO strings directly
// data rows are typed as Database['public']['Tables']['events']['Row']
```

The `convertTimestampsToStrings()` helper function in both Locations.tsx and SingleLocation.tsx can be removed entirely — it exists solely to handle Firebase Timestamp objects, which Supabase does not produce.

### Pattern 5: useAuth Import Path Change

**What:** The `SupabaseAuthContext.tsx` already exports a `useAuth` hook with the same interface as the Firebase one. The import path changes, and the user object property changes from `.uid` to `.id`.

```typescript
// Profile.tsx — change:
import { useAuth } from '../hooks/useAuth';           // OLD
import { useAuth } from '../contexts/SupabaseAuthContext'; // NEW

// Profile.tsx — change all user.uid references:
const userDoc = await getDoc(doc(db, 'users', user.uid)); // OLD
const { data } = await supabase.from('profiles').eq('id', user.id); // NEW
```

### Anti-Patterns to Avoid

- **N+1 query pattern:** Do not replicate the Firestore two-step fetch in Supabase. Use join syntax instead.
- **Keeping `convertTimestampsToStrings`:** Remove it. Supabase returns plain ISO strings, not Timestamp objects.
- **Deleting AuthContext before all consumers migrated:** 18 files import from `AuthContext`/`useAuth` (Firebase). Deleting before all are migrated will break the build.
- **Using `user.uid` with Supabase user:** Supabase `User` has `user.id`, not `user.uid`. TypeScript will catch this only if the type import is correct.
- **Assuming RLS returns errors on failure:** Supabase RLS violations on SELECT return empty arrays, not errors. A misconfigured session silently returns `[]`. Verify with a real authenticated user.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Joining saved_events to events | Manual loop + individual fetches | Supabase PostgREST join (`events (*)`) | Single round-trip, typed, handles nulls cleanly |
| Timestamp conversion | `convertTimestampsToStrings` helper | Nothing — Supabase returns ISO strings | Firebase problem only; Supabase stores and returns ISO 8601 strings from `timestamptz` columns |
| Auth state reading | New auth state hook | `useAuth` from `SupabaseAuthContext` | Already implemented and working |

**Key insight:** The Firebase-era complexity in Locations.tsx and SingleLocation.tsx (the `convertTimestampsToStrings` recursive function, the `instanceof Timestamp` checks) exists entirely because Firestore returns Timestamp objects. Supabase returns strings. Delete all of it.

---

## Common Pitfalls

### Pitfall 1: RLS Silent Failure on `saved_events`

**What goes wrong:** `supabase.from('saved_events').select().eq('user_id', user.id)` returns `[]` with no error, even when data exists.
**Why it happens:** The RLS policy `auth.uid() = user_id` requires a valid authenticated session in the Supabase client. If Phase 1 is not complete (SupabaseAuthProvider not mounted, or user session not passed correctly), `auth.uid()` is null and RLS filters out all rows silently.
**How to avoid:** Phase 2 DEPENDS on Phase 1 completing `SupabaseAuthProvider` wiring. After migration, verify with a real test account that has saved events — do not trust `[]` as correct without confirmation.
**Warning signs:** `savedEvents.length === 0` in the UI when the test account has saved events in Supabase.

### Pitfall 2: `user.uid` vs `user.id`

**What goes wrong:** Runtime: `user.uid` is `undefined`; Supabase queries use `undefined` as the filter value, returning all rows (or none due to RLS).
**Why it happens:** Firebase `User` type has `.uid`; Supabase `User` type has `.id`. TypeScript may not catch this if the old import is still in place.
**How to avoid:** After swapping the import path, search each migrated file for `.uid` and replace with `.id`.
**Warning signs:** TypeScript error "Property 'uid' does not exist on type 'User'" after switching imports — this is the TypeScript guard working correctly.

### Pitfall 3: Deleting `AuthContext.tsx` Too Early

**What goes wrong:** Build fails — 14+ non-phase-2 components still import from `AuthContext.tsx`.
**Why it happens:** 18 total files import `useAuth` or `AuthContext` (confirmed by grep). Phase 2 only migrates 4 of them. The rest (EventCard, Navbar, MobileNavigation, ProtectedRoute, NotificationsDropdown, etc.) are out of scope.
**How to avoid:** Run `grep -r "from '../contexts/AuthContext'\|from '../hooks/useAuth'" src/` after phase 2 migrations. Delete only when the result is empty (or only shows SupabaseAuthContext itself).
**Warning signs:** Build output listing multiple "Cannot find module '../contexts/AuthContext'" errors.

### Pitfall 4: `profiles` Column Name Mismatch

**What goes wrong:** Profile page submits `displayName` (camelCase) but the Supabase column is `display_name` (snake_case).
**Why it happens:** Firestore used camelCase field names; Supabase follows PostgreSQL snake_case convention.
**How to avoid:** Use the typed `Profile` type from `src/types/supabase.ts` as reference. Column names: `display_name`, `photo_url`, `phone_number`, `level`, `phone_number`.
**Warning signs:** `update` call succeeds (no error) but profile data does not change in the database.

### Pitfall 5: Locations / SingleLocation Scope Misunderstanding

**What goes wrong:** Developer spends time trying to migrate the location list itself from Firestore, which doesn't exist — the location list is `PADEL_LOCATIONS`, a hardcoded constant.
**Why it happens:** Requirements DATA-03 and DATA-04 say "queries location data via Supabase instead of Firestore" — the only Firestore usage in those pages is the events-at-location query.
**How to avoid:** The only Firestore call in `Locations.tsx` and `SingleLocation.tsx` is `query(collection(db, 'events'), where('location', '==', ...))`. That is the only thing to migrate. The `PADEL_LOCATIONS` import stays unchanged.
**Warning signs:** Over-engineering a locations table in Supabase when none is needed.

---

## Code Examples

Verified patterns from direct codebase inspection:

### Profile: Load from Supabase `profiles`
```typescript
// Source: src/types/supabase.ts (columns verified), src/lib/supabase.ts (client)
useEffect(() => {
  const loadUserData = async () => {
    if (!user) return;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('display_name, photo_url, phone_number, level')
      .eq('id', user.id)
      .single();
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSelectedAvatar(profile.photo_url || 'Avatar1');
      setPhoneNumber(profile.phone_number || '');
      setLevel(profile.level || '');
    }
  };
  loadUserData();
}, [user]);
```

### Profile: Update `profiles`
```typescript
// Source: src/types/supabase.ts (Update shape verified)
const { error } = await supabase
  .from('profiles')
  .update({
    display_name: displayName,
    photo_url: selectedAvatar,
    phone_number: phoneNumber,
    level: level,
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id);
if (error) throw error;
```

### SavedEvents: Join Query
```typescript
// Source: src/types/supabase.ts (saved_events + events tables verified)
const { data, error } = await supabase
  .from('saved_events')
  .select(`
    id,
    saved_at,
    events (
      id, title, date, time, end_time, location, level,
      max_players, created_by, price, status, is_private,
      password, sport_type, description, cover_image_url,
      custom_location_lat, custom_location_lng, created_at
    )
  `)
  .eq('user_id', user.id);

// Map to legacy Event shape for EventCard compatibility
// reuse the toAppEvent() pattern from src/hooks/useSupabaseEvents.ts
```

### Locations / SingleLocation: Events-at-Location
```typescript
// Source: events table schema + index idx_events_location_date confirmed
const { data: eventsData, error } = await supabase
  .from('events')
  .select('*')
  .eq('location', selectedLocation.name)
  .order('date', { ascending: true })
  .order('time', { ascending: true });

// No Timestamp conversion. data rows are typed Event rows (snake_case).
// Transform with toAppEvent() from useSupabaseEvents.ts if EventCard needs camelCase shape.
```

### EventCard Compatibility (Legacy Shape)
```typescript
// EventCard still uses the legacy Event type from src/types/index.ts
// Reuse toAppEvent() from src/hooks/useSupabaseEvents.ts
import { toAppEvent } from '../hooks/useSupabaseEvents'; // if exported
// or copy the transform inline:
const appEvent: AppEvent = {
  id: row.id,
  title: row.title,
  date: row.date,
  time: row.time,
  endTime: row.end_time,
  location: row.location,
  level: row.level,
  players: [], // event_players join needed separately or omitted
  maxPlayers: row.max_players,
  createdBy: row.created_by,
  price: Number(row.price),
  status: row.status,
  isPrivate: row.is_private,
  sportType: row.sport_type,
  description: row.description ?? undefined,
  coverImageURL: row.cover_image_url ?? undefined,
  createdAt: row.created_at,
};
```

Note: `toAppEvent` in `useSupabaseEvents.ts` is not exported. The planner should decide whether to export it or inline the transform.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firestore Timestamps → manual conversion | Supabase returns ISO 8601 strings from `timestamptz` | This phase | Delete `convertTimestampsToStrings` helper in both Locations/SingleLocation |
| Firebase `user.uid` | Supabase `user.id` | This phase | All four pages need this change |
| Firestore N+1 event fetch | Single Supabase join | This phase | SavedEvents query becomes one round-trip |
| `updateProfile(auth.currentUser!)` | `supabase.from('profiles').update()` | This phase | Firebase Auth profile metadata not used in Supabase; everything in `profiles` table |

**Deprecated/outdated in migrated files:**
- `convertTimestampsToStrings` function: Remove. Firebase-only concept.
- `import { Timestamp } from 'firebase/firestore'`: Remove with the function.
- `import { updateProfile } from 'firebase/auth'`: Remove. Profile data lives in `profiles` table.
- `import { auth } from '../firebase'`: Remove from Profile.tsx.
- `import { db } from '../firebase'`: Remove from all four pages.

---

## Open Questions

1. **Can `AuthContext.tsx` and `useAuth.ts` actually be deleted this phase?**
   - What we know: 18 files import these. Phase 2 migrates 4. Phase 1 handles App.tsx, Login, Register (possibly Navbar, ProtectedRoute if they were in scope).
   - What's unclear: The exact scope of Phase 1 is not known from the research materials — `STATE.md` only says Phase 1 is "Auth Provider Wiring + Auth Page Migration." Navbar, ProtectedRoute, EventCard etc. are not auth pages and likely were not in Phase 1 scope.
   - Recommendation: Before planning CLEAN-01/CLEAN-02 tasks, verify what Phase 1 actually migrates. If Navbar, ProtectedRoute, EventCard, MobileNavigation, BottomNav, FriendRequestsMenu, etc. still import the Firebase `useAuth`, the delete is blocked. Consider either narrowing CLEAN-01/CLEAN-02 to a future phase, or expanding Phase 2 scope to also migrate those remaining importers.

2. **Does `toAppEvent` need to be exported from `useSupabaseEvents.ts`?**
   - What we know: `toAppEvent` is currently an unexported module-internal function. SavedEvents, Locations, and SingleLocation all render `<EventCard>`, which expects the legacy `Event` shape from `src/types/index.ts`.
   - What's unclear: Whether it's cleaner to export `toAppEvent` or duplicate/inline the mapping.
   - Recommendation: Export `toAppEvent` from `useSupabaseEvents.ts` and reuse it across the four pages. Avoids duplication.

3. **Do Locations/SingleLocation event queries need player data for EventCard?**
   - What we know: `EventCard` renders player avatars — it expects `event.players[]`. Supabase events query returns rows without the `event_players` join.
   - What's unclear: Whether a single join or a separate query for players is better here.
   - Recommendation: For locations pages, fetch events + players in two queries (matching `useSupabaseEvents` pattern), or use a select with `event_players (*)` join. Two queries are acceptable for the scale.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/pages/Profile.tsx`, `src/pages/SavedEvents.tsx`, `src/pages/Locations.tsx`, `src/pages/SingleLocation.tsx` — confirmed all Firebase usage and scope
- `src/types/supabase.ts` — confirmed all target table schemas, column names, and type aliases
- `src/lib/supabase.ts` — confirmed typed Supabase client
- `src/contexts/SupabaseAuthContext.tsx` — confirmed `useAuth` hook interface
- `src/hooks/useSupabaseAuth.ts` — confirmed `user.id` (not `user.uid`) shape
- `src/hooks/useSupabaseEvents.ts` — confirmed `toAppEvent` transform pattern, verified Supabase query patterns
- `supabase/migrations/20250223000001_initial_schema.sql` — confirmed RLS policies for `profiles`, `saved_events`, `events`
- `grep` on all 18 importers of `AuthContext`/`useAuth` — confirmed cleanup scope
- `.planning/REQUIREMENTS.md` and `.planning/STATE.md` — confirmed phase requirements and known blockers

### Secondary (MEDIUM confidence)
- Supabase PostgREST join syntax (`events (*)`) — consistent with established Supabase JS client documentation patterns as of 2025; verified approach matches the typed client API

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and configured; no new dependencies
- Architecture: HIGH — all patterns derived from direct codebase inspection of existing Supabase hooks
- Pitfalls: HIGH — RLS silent failure and uid/id mismatch are directly observed from codebase; AuthContext deletion risk confirmed by grep count
- CLEAN-01/CLEAN-02 feasibility: MEDIUM — depends on Phase 1 scope which is not fully known from available files

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable — no fast-moving dependencies; Supabase client API is stable)
