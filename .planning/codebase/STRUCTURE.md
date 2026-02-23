# Codebase Structure

**Analysis Date:** 2026-02-23

## Directory Layout

```
teamup/
├── src/
│   ├── api/                    # Vercel serverless API endpoints (NEW)
│   │   └── send-email.ts       # SendGrid email bridge (POST /api/send-email)
│   ├── assets/                 # Static assets (images, avatars)
│   │   ├── avatars/            # User avatar PNG files (Avatar1-4)
│   │   └── images/             # Logo and other images
│   ├── components/             # Reusable UI components (~46 files)
│   │   ├── ui/                 # Primitive UI building blocks (button, card, input, etc.)
│   │   ├── CreateEventDialog.tsx
│   │   ├── EditEventDialog.tsx
│   │   ├── Navbar.tsx
│   │   ├── MobileNavigation.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventList.tsx
│   │   ├── Filters.tsx
│   │   ├── UserProfileDialog.tsx
│   │   ├── MemoryCard.tsx
│   │   └── ...
│   ├── constants/              # Static data (no functions)
│   │   ├── locations.ts        # Padel venue coordinates, names, images
│   │   └── avatars.ts          # Avatar mappings
│   ├── contexts/               # React Context providers
│   │   ├── SupabaseAuthContext.tsx  # Auth state provider (NEW)
│   │   ├── AuthContext.tsx          # Legacy Firebase auth
│   │   ├── CookieContext.tsx        # Cookie-based preferences
│   │   └── ThemeContext.tsx         # Light/dark theme toggle
│   ├── hooks/                  # Custom React hooks
│   │   ├── useSupabaseAuth.ts  # Supabase auth & session management (NEW)
│   │   ├── useSupabaseEvents.ts # Fetch & transform events from DB (NEW)
│   │   ├── useAuth.ts          # Legacy Firebase auth hook
│   │   ├── useEvents.ts        # Legacy Firebase events hook
│   │   ├── useCookies.ts       # Manage cookies
│   │   ├── useClickOutside.ts  # Close dropdowns on outside click
│   │   ├── useProfileCompletion.ts # Check if user profile is complete
│   │   └── ...
│   ├── lib/                    # Utility functions & client init
│   │   ├── supabase.ts         # Supabase client singleton (NEW)
│   │   └── utils.ts            # cn() class-name utility (clsx + tailwind-merge)
│   ├── pages/                  # Route-level page components (~16 files)
│   │   ├── Home.tsx            # Main event list (authenticated)
│   │   ├── LandingPage.tsx     # Landing page (unauthenticated)
│   │   ├── EventDetails.tsx    # Single event detail view
│   │   ├── Community.tsx        # User profiles & friend management
│   │   ├── Locations.tsx        # Venue list
│   │   ├── SingleLocation.tsx   # Venue detail with map
│   │   ├── SavedEvents.tsx      # Bookmarked events
│   │   ├── Login.tsx            # Login form
│   │   ├── Register.tsx         # Registration form
│   │   ├── VerifyEmail.tsx      # Email verification page
│   │   ├── NotificationsPage.tsx # Notifications list
│   │   ├── Profile.tsx          # User profile page
│   │   ├── AdminPanel.tsx       # Admin controls (if applicable)
│   │   └── ...
│   ├── services/               # Business logic & external integrations
│   │   ├── supabaseEmailService.ts         # Email sending via SendGrid (NEW)
│   │   ├── supabaseNotificationService.ts  # Notification CRUD & realtime (NEW)
│   │   ├── emailService.ts     # Legacy email service
│   │   ├── notificationService.ts # Legacy notification service
│   │   ├── sendGridService.ts  # SendGrid wrapper
│   │   ├── mailerLiteService.ts # MailerLite integration
│   │   └── verificationService.ts # Email verification helpers
│   ├── styles/                 # Global styles
│   │   └── index.css           # CSS variables, Tailwind directives, theme
│   ├── types/                  # TypeScript type definitions
│   │   ├── supabase.ts         # Auto-generated Supabase DB types + aliases (NEW)
│   │   └── index.ts            # App-level types (Event, User, Player, etc.)
│   ├── utils/                  # Utility functions
│   │   ├── appleWallet.ts      # Apple Wallet passkit generation
│   │   ├── dateFormatter.ts    # Date/time formatting helpers
│   │   └── ...
│   ├── App.tsx                 # Root component with routing
│   ├── firebase.ts             # Legacy Firebase client init
│   ├── index.tsx               # React app entry point
│   └── setupReact.ts           # React setup & patches
├── api/                        # Vercel serverless functions (NEW)
│   └── send-email.ts           # Email handler (receives POST, calls SendGrid)
├── supabase/                   # Supabase project config (NEW)
│   ├── config.toml             # Supabase project settings
│   └── migrations/             # SQL schema migrations
│       └── 20250223000001_initial_schema.sql
├── functions/                  # Legacy Firebase Cloud Functions
│   └── ...
├── patches/                    # patch-package modifications
│   ├── react@18.2.0.patch      # React 18.2.0 polyfill patches
│   └── react-dom@18.2.0.patch
├── public/                     # Static public files served as-is
│   ├── index.html              # HTML template
│   ├── favicon.ico
│   └── ...
├── .github/workflows/          # CI/CD pipelines
│   ├── deploy.yml              # VPS deployment (legacy)
│   └── firebase-hosting-deploy.yml # Firebase deployment (legacy)
├── package.json                # NPM dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── craco.config.js             # CRACO webpack overrides (Node.js polyfills)
├── vercel.json                 # Vercel deployment config
├── .env.example                # Environment variable template
└── CLAUDE.md                   # Project instructions & tech stack guide
```

## Directory Purposes

**src/components/**
- Purpose: All reusable React components
- Contains: Presentational components (EventCard, Navbar, Filters), container dialogs (CreateEventDialog), form inputs
- Key files: `CreateEventDialog.tsx`, `EditEventDialog.tsx`, `Navbar.tsx`, `EventList.tsx`
- Pattern: Named exports, flat structure (no deep nesting)

**src/components/ui/**
- Purpose: Primitive UI components following shadcn/ui pattern
- Contains: Base button, card, input, label, select, icon-button; styled with Tailwind + CVA
- Key files: `button.tsx`, `card.tsx`, `input.tsx`, `select.tsx`
- Pattern: Use `cn()` utility for merging classes; export component + variants function

**src/pages/**
- Purpose: Route-level components corresponding to React Router paths
- Contains: Full-page layouts, page-level data fetching, state management for page
- Key files: `Home.tsx`, `EventDetails.tsx`, `Community.tsx`, `Locations.tsx`
- Pattern: Each file exports a single default or named component matching route; may compose multiple sub-components

**src/hooks/**
- Purpose: Encapsulate stateful logic and side effects
- Contains: Auth state (`useSupabaseAuth`), data fetching (`useSupabaseEvents`), DOM interactions (`useClickOutside`), cookie management
- Key files: `useSupabaseAuth.ts`, `useSupabaseEvents.ts`, `useCookies.ts`
- Pattern: Custom hooks return state + functions; used by pages/components to avoid inline logic

**src/contexts/**
- Purpose: Provide shared state via React Context API
- Contains: Auth context (wraps `useSupabaseAuth`), cookie context, theme context
- Key files: `SupabaseAuthContext.tsx`, `CookieContext.tsx`
- Pattern: Provider component + custom hook to access context; throw error if used outside provider

**src/services/**
- Purpose: Business logic, API calls, external integrations
- Contains: Email sending, notification management, verification logic
- Key files: `supabaseEmailService.ts`, `supabaseNotificationService.ts`
- Pattern: Exported async functions that call Supabase or fetch API routes; return `{ success, error }` or data

**src/constants/**
- Purpose: Static data and configuration
- Contains: Padel venue locations with coordinates and images; avatar mappings
- Key files: `locations.ts` (hardcoded Vilnius venues), `avatars.ts`
- Pattern: Exported objects or arrays; used to populate dropdowns, maps, etc.

**src/types/**
- Purpose: TypeScript type definitions
- Contains: App-level types (`Event`, `Player`, `User`, `Notification`, `Memory`), Supabase DB types
- Key files: `index.ts` (app types), `supabase.ts` (generated DB types)
- Pattern: Interfaces and types; `supabase.ts` auto-generated from Supabase schema

**src/lib/**
- Purpose: Low-level utilities and client initialization
- Contains: Supabase client singleton, class-name utility
- Key files: `supabase.ts` (Supabase initialization), `utils.ts` (cn function)
- Pattern: `supabase.ts` exports named `supabase` client; `utils.ts` exports utility functions

**api/**
- Purpose: Vercel serverless API endpoints
- Contains: Email sending handler
- Key files: `send-email.ts`
- Pattern: Default export async handler function receiving `VercelRequest`, returning `VercelResponse`

**supabase/**
- Purpose: Supabase project configuration and migrations
- Contains: Database schema, RLS policies, triggers
- Key files: `migrations/20250223000001_initial_schema.sql`
- Pattern: Migration files numbered by timestamp; run via Supabase CLI

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React app bootstrap; mounts to `<div id="root">`
- `src/App.tsx`: Root component with routing logic; checks auth state
- `src/pages/Home.tsx`: Main event list page (authenticated); fallback to `LandingPage.tsx` for guests

**Authentication:**
- `src/hooks/useSupabaseAuth.ts`: Auth state + methods (login, register, signOut, etc.)
- `src/contexts/SupabaseAuthContext.tsx`: Provides auth to entire app
- `src/pages/Login.tsx`: Login form component
- `src/pages/Register.tsx`: Registration form component
- `src/pages/VerifyEmail.tsx`: Email verification flow

**Core Features:**
- `src/pages/EventDetails.tsx`: Single event view; join/leave/edit/memory actions
- `src/components/CreateEventDialog.tsx`: Multi-step event creation dialog
- `src/components/EditEventDialog.tsx`: Edit existing event (form reuse with CreateEventDialog)
- `src/pages/Community.tsx`: User profiles, friends, friend requests
- `src/pages/SavedEvents.tsx`: Bookmarked/saved events
- `src/pages/Locations.tsx`: Padel venue list with map
- `src/pages/SingleLocation.tsx`: Single venue detail with map

**Data & State:**
- `src/hooks/useSupabaseEvents.ts`: Fetch all events + players from DB
- `src/hooks/useCookies.ts`: Read/write browser cookies (preferences, auth data)
- `src/constants/locations.ts`: Hardcoded Vilnius padel venues
- `src/types/index.ts`: App-level types (Event, Player, User, etc.)
- `src/types/supabase.ts`: Generated Supabase DB types

**Services & Integration:**
- `src/services/supabaseEmailService.ts`: SendGrid email sending via `api/send-email`
- `src/services/supabaseNotificationService.ts`: Notification CRUD + Realtime subscription
- `api/send-email.ts`: Vercel serverless endpoint for SendGrid

**Styling & Layout:**
- `src/index.css`: Global Tailwind directives, CSS variables, theme colors
- `src/components/Navbar.tsx`: Desktop top navigation
- `src/components/MobileNavigation.tsx`: Mobile bottom navigation
- `src/lib/utils.ts`: `cn()` utility for class-name merging

## Naming Conventions

**Files:**
- Components: PascalCase (`EventCard.tsx`, `CreateEventDialog.tsx`)
- Hooks: `use` prefix + PascalCase (`useSupabaseAuth.ts`, `useClickOutside.ts`)
- Services: camelCase + "Service" suffix (`supabaseEmailService.ts`, `notificationService.ts`)
- Constants: camelCase + plural or descriptive (`locations.ts`, `avatars.ts`)
- Types: camelCase (`supabase.ts`, `index.ts`)
- Utils: camelCase + optional suffix (`utils.ts`, `appleWallet.ts`)
- Pages: PascalCase matching route name (`Home.tsx`, `EventDetails.tsx`, `LandingPage.tsx`)

**Directories:**
- Lowercase, plural for collections (`components/`, `pages/`, `hooks/`, `services/`, `constants/`, `contexts/`, `types/`, `utils/`)
- Lowercase for feature grouping (`ui/` for primitive UI components)
- Top-level: lowercase (`src/`, `api/`, `supabase/`, `public/`)

**Exports:**
- Components: Named export (e.g., `export const EventCard: React.FC = () => {}`) or default
- Hooks: Named export (e.g., `export const useSupabaseAuth = () => {}`)
- Services: Named exports for functions (e.g., `export const createNotification = async () => {}`)
- Constants: Named export for objects (e.g., `export const PADEL_LOCATIONS: Location[] = [...]`)
- Types: Named export for interfaces (e.g., `export interface Event { ... }`)

## Where to Add New Code

**New Feature (e.g., "Save Event to Bookmarks"):**
- Primary code: `src/services/supabaseEmailService.ts` (if email), `src/hooks/useSupabaseEvents.ts` (if data fetching)
- Component: Add button/icon to `src/components/EventCard.tsx`
- Types: Update `src/types/index.ts` if new fields needed
- Tests: `src/components/EventCard.test.tsx`
- Database: Add migration in `supabase/migrations/`

**New Page (e.g., "MyProfile"):**
- Implementation: `src/pages/MyProfile.tsx`
- Route: Add to `src/App.tsx` in `<Routes>`
- Navigation: Add link in `src/components/Navbar.tsx` or `src/components/MobileNavigation.tsx`
- Data fetching: Add hook in `src/hooks/useMyProfile.ts` if needed
- Tests: `src/pages/MyProfile.test.tsx`

**New Dialog/Modal:**
- Implementation: `src/components/NewDialogName.tsx`
- Open handler: In parent component (e.g., `Home.tsx`), add `const [showDialog, setShowDialog] = useState(false)`
- Pass props: `<NewDialogName open={showDialog} onClose={() => setShowDialog(false)} />`
- Styling: Use Material-UI `Dialog`, `DialogTitle`, `DialogContent` or Headless UI `Dialog`

**New UI Primitive (Button-like):**
- Implementation: `src/components/ui/custom-component.tsx`
- Pattern: Follow `src/components/ui/button.tsx` (CVA variants, `cn()` utility, Radix UI when needed)
- Export: Named export + optional variants function

**New Hook (Data or Logic):**
- Implementation: `src/hooks/useFeatureName.ts`
- Pattern: Return object with state and functions; call Supabase from here
- Usage: In pages/components via `const { data, loading, error } = useFeatureName()`

**New Service (Email, Notification, etc.):**
- Implementation: `src/services/newFeatureService.ts`
- Pattern: Exported async functions; call Supabase or fetch API routes
- Usage: Imported in components/hooks; called on user action or side effect

**New API Route (Serverless):**
- Implementation: `api/new-endpoint.ts`
- Pattern: Default export handler; validate body, call external API, return JSON
- Usage: Fetch from browser; called by services in `src/`

**Utilities (Helpers):**
- General purpose: `src/utils/helperName.ts`
- Library-specific: `src/lib/libraryName.ts`
- Pattern: Exported named functions; no side effects

## Special Directories

**src/assets/**
- Purpose: Static files bundled with app
- Generated: No (hand-managed)
- Committed: Yes (images, avatars)
- Pattern: Imported as ES modules in components (e.g., `import Avatar1 from '../assets/avatars/Avatar1.png'`)

**src/patches/**
- Purpose: patch-package modifications for dependencies
- Generated: No (manually created when needed)
- Committed: Yes (patches/ directory + .patchpackagerc in package.json)
- Usage: Applied automatically via `npm install` → `postinstall` script

**supabase/migrations/**
- Purpose: SQL schema migrations
- Generated: Partially (Supabase CLI can generate; manually edited)
- Committed: Yes (version control for schema)
- Usage: Applied via Supabase CLI or auto-applied on deploy

**public/**
- Purpose: Static files served as-is (no bundling)
- Generated: No
- Committed: Yes
- Pattern: Place images/static files here if they shouldn't be bundled

**api/**
- Purpose: Vercel serverless functions
- Generated: No (hand-written)
- Committed: Yes
- Pattern: Each `.ts` file becomes a route (e.g., `api/send-email.ts` → `/api/send-email` endpoint)

---

*Structure analysis: 2026-02-23*
