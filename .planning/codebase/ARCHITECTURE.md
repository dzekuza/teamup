# Architecture

**Analysis Date:** 2026-02-23

## Pattern Overview

**Overall:** Layered architecture with React Context for state management and component-driven UI. The application follows a clear separation between pages (route-level components), reusable components, hooks for stateful logic, and services for external integrations.

**Key Characteristics:**
- **Dual-stack migration:** Firebase and Supabase coexist; new work uses Supabase primitives
- **Context-driven state:** React Context API (not Redux/Zustand) for auth, cookies, theme
- **Hooks-first data:** Custom hooks (`useSupabaseAuth`, `useSupabaseEvents`) encapsulate API calls and state
- **SPA with protected routes:** React Router 6 with conditional rendering based on auth state
- **Component composition:** Flat component structure with Material-UI and shadcn/ui primitives

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/pages/`, `src/components/`
- Contains: Page components, dialog components, UI primitives
- Depends on: Hooks, contexts, services, types
- Used by: React Router (page components); other components compose UI components

**State & Logic Layer:**
- Purpose: Manage application state, authentication, and side effects
- Location: `src/hooks/`, `src/contexts/`
- Contains: Custom hooks for data fetching and state management, context providers
- Depends on: Supabase client, types
- Used by: Page and component layers

**Data Access Layer:**
- Purpose: Interact with Supabase database and storage
- Location: `src/services/`, `src/lib/supabase.ts`
- Contains: Supabase client initialization, business logic for notifications, emails, etc.
- Depends on: Supabase SDK, environment configuration
- Used by: Hooks, components, API routes

**API/Integration Layer:**
- Purpose: Serverless endpoints and external service bridges
- Location: `api/` (Vercel serverless), `src/services/`
- Contains: SendGrid email bridging, notification publishing
- Depends on: Supabase, external APIs (SendGrid)
- Used by: Frontend services, browser

**Constants & Configuration:**
- Purpose: Static data, type definitions, utility functions
- Location: `src/constants/`, `src/types/`, `src/lib/`
- Contains: Venue locations, TypeScript types, class-name utilities
- Depends on: Nothing (pure data)
- Used by: All layers

## Data Flow

**Event Creation Flow:**

1. User clicks "Create Event" → `CreateEventDialog` opens (managed in `Home.tsx`)
2. Multi-step form (`CreateEventDialog.tsx`) collects event details
3. On submit:
   - Insert event row → `supabase.from('events').insert()`
   - Insert event_players junction rows → `supabase.from('event_players').insert()` (creator + invited friends)
   - Upload cover image if provided → `supabase.storage.from('event-covers').upload()`
4. Send invitations:
   - Call `sendEventCreationEmail()` from `src/services/supabaseEmailService.ts`
   - Email service POSTs to `api/send-email.ts` endpoint
   - Endpoint calls SendGrid API
5. Create notifications:
   - Call `createNotification()` from `src/services/supabaseNotificationService.ts`
   - Insert rows into `notifications` table
6. Callback `onEventCreated()` → reload page or refresh data

**Event Viewing Flow:**

1. User navigates to `/event/:id`
2. `EventDetails.tsx` loads:
   - Fetch event row → `supabase.from('events').select().eq('id', id)`
   - Fetch event_players → `supabase.from('event_players').select().eq('event_id', id)`
   - Fetch creator profile → `supabase.from('profiles').select().eq('id', createdBy)`
3. Render event details, player list, location map
4. User actions (join, leave, add memory, edit):
   - Insert/update/delete junction table rows
   - Call services to send notifications

**Authentication Flow:**

1. App initializes → `index.tsx` wraps `CookieProvider` → `App`
2. `App.tsx` renders → checks `useAuth()` (Supabase) for initial session
3. If loading, show `Preloader`
4. If authenticated:
   - Show `Navbar` (desktop) / `MobileNavigation` (mobile)
   - Show `EmailVerificationBanner` if email not verified
5. Routes conditional on `user` state:
   - `/` → `Home` (authenticated) or `LandingPage` (guest)
   - `/event/:id` → redirect to `/login` if not authenticated
6. Session changes detected via `useSupabaseAuth` hook → automatic re-render

**Notifications Realtime Flow:**

1. User logged in → `Home` component or any page can subscribe
2. Call `subscribeToNotifications(userId, callback)` from `supabaseNotificationService.ts`
3. Hook initializes:
   - Initial fetch of notifications from `notifications` table
   - Supabase Realtime channel listens for `postgres_changes` on `notifications` table
4. When event creator publishes notification:
   - Insert row into `notifications` table
5. Realtime listener triggers callback → re-fetch notifications → component updates

**State Management:**

- **Auth state:** Held in `SupabaseAuthContext` (wraps `useSupabaseAuth` hook)
  - Single source of truth: Supabase session
  - Synced via `onAuthStateChange` listener
  - Exposed via `useAuth()` hook → returns `{ user, session, loading, userFriends, login, register, signInWithGoogle, signOut }`

- **Local page state:** React `useState` in page/dialog components
  - Form inputs, filter selections, dialog open/close state
  - No global state for form data

- **Cookie-based preferences:** `CookieContext` wraps cookie hooks
  - User preferences (theme, cookie consent)
  - Authentication data cache (legacy pattern)

- **Theme state:** `ThemeContext` (not currently used; dark theme hardcoded)
  - Toggleable between light/dark
  - Persisted to localStorage

## Key Abstractions

**Supabase Client:**
- Purpose: Singleton database and auth client
- Examples: `src/lib/supabase.ts`
- Pattern: Initialized once with environment variables, exported as named export `supabase`

**useSupabaseAuth Hook:**
- Purpose: Encapsulate Supabase auth logic and session state
- Examples: `src/hooks/useSupabaseAuth.ts`
- Pattern:
  - Returns `{ user, session, loading, userFriends, login, register, signInWithGoogle, signOut }`
  - Manages auth state changes via listener
  - Fetches friends list on user change
  - Used by `SupabaseAuthContext` to provide auth to entire app

**useSupabaseEvents Hook:**
- Purpose: Fetch and transform events from database into app shape
- Examples: `src/hooks/useSupabaseEvents.ts`
- Pattern:
  - Fetches events + event_players in single query (normalized join)
  - Transforms DB rows into `Event` type with populated `players` array
  - Returns `{ events, loading, error }`
  - Called once on component mount; no refetch logic (pages reload on changes)

**Email Service:**
- Purpose: Send transactional emails via SendGrid
- Examples: `src/services/supabaseEmailService.ts`, `api/send-email.ts`
- Pattern:
  - Client-side service builds email body and POSTs to Vercel API route
  - API route validates, calls SendGrid API
  - Returns success/error to client

**Notification Service:**
- Purpose: Create notifications and subscribe to realtime updates
- Examples: `src/services/supabaseNotificationService.ts`
- Pattern:
  - `createNotification(data)` → insert into `notifications` table
  - `subscribeToNotifications(userId, callback)` → fetch + Realtime listener
  - Callback fired on table changes, component responsible for re-render

**Event Type Transformation:**
- Purpose: Bridge Supabase normalized schema to app's denormalized Event type
- Examples: `src/hooks/useSupabaseEvents.ts` → `toAppEvent()` function
- Pattern:
  - `toAppEvent(eventRow, playersArray)` returns `Event` with `players` as array of `Player` objects
  - Applied in hooks so components see unified shape

## Entry Points

**SPA Entry (`src/index.tsx`):**
- Location: `src/index.tsx`
- Triggers: Page load, browser runs JavaScript
- Responsibilities:
  - Mount React app to DOM
  - Wrap app with `CookieProvider` (lowest-level context)
  - Bootstrap global CSS and third-party styles (maplibre-gl, etc.)

**App Root (`src/App.tsx`):**
- Location: `src/App.tsx`
- Triggers: React renders
- Responsibilities:
  - Check auth state via `useAuth()` (Supabase)
  - Conditional rendering: show `Preloader` while loading, then route tree
  - Show/hide `Navbar`, `MobileNavigation`, `EmailVerificationBanner` based on auth and device
  - Define all routes using React Router 6
  - Handle responsive layout (mobile nav vs desktop nav)

**Page Components (`src/pages/*.tsx`):**
- Location: `src/pages/` (e.g., `Home.tsx`, `EventDetails.tsx`, `Community.tsx`)
- Triggers: User navigates to route
- Responsibilities:
  - Fetch page-level data (events, user profile, notifications)
  - Manage page state (filters, dialogs, view mode)
  - Compose child components into full page layout
  - Handle user actions (create event, join event, etc.)

**Vercel API Routes (`api/*.ts`):**
- Location: `api/send-email.ts`
- Triggers: Client POSTs to `/api/send-email`
- Responsibilities:
  - Validate request body
  - Call SendGrid API with credentials from env vars
  - Return success/error to client

## Error Handling

**Strategy:** Try-catch blocks with console logging and user-facing toast messages. No centralized error boundary (yet).

**Patterns:**

**Hook errors:**
```typescript
// In useSupabaseEvents
catch (err: any) {
  setError(err.message || 'Failed to fetch events');
  console.error('Error fetching events:', err);
}
```

**Component errors (dialogs, forms):**
```typescript
// In CreateEventDialog
try {
  // Insert event
  const { error } = await supabase.from('events').insert([eventData]);
  if (error) throw error;
} catch (err) {
  setError(err.message);
  toast.error('Failed to create event');
}
```

**API route errors:**
```typescript
// In api/send-email.ts
if (!response.ok) {
  const errorBody = await response.text();
  console.error('SendGrid error:', errorBody);
  return res.status(500).json({ error: 'Failed to send email' });
}
```

**Service function errors:**
```typescript
// In supabaseNotificationService
export const createNotification = async (notification) => {
  try {
    const { error } = await supabase.from('notifications').insert(notification);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};
```

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.error()`, `console.log()` to browser console
- Used for debugging API calls, auth state changes, data fetches
- No centralized logging service (no Sentry or similar)

**Validation:**
- Approach: Inline validation in components and hooks
  - Form validation: check required fields, format checks (email, date, time)
  - Data validation: type checks via TypeScript (runtime validation minimal)
- Example: `CreateEventDialog` validates date, time, title before insert

**Authentication:**
- Approach: Supabase Auth (email/password, Google OAuth)
- Protected routes: `App.tsx` checks `user` state, redirects to `/login` if needed
- Profile auto-creation: PostgreSQL trigger on `auth.users` insert
- Session persistence: Supabase handles via local storage

**Authorization:**
- Approach: Row-Level Security (RLS) policies on Supabase tables
  - Users see only their own data (profiles, events, notifications)
  - Event creators can edit/delete events
  - Other users can join events (insert into event_players)
- Frontend assumes RLS; no authorization checks in React code

---

*Architecture analysis: 2026-02-23*
