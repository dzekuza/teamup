# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**Geolocation & Maps:**
- MapTiler - Geocoding API for location search
  - API Key: Hardcoded in `src/components/LocationSearch.tsx` (key: `33rTk4pHojFrbxONf77X`)
  - Endpoint: `https://api.maptiler.com/geocoding/{query}.json`
  - Used for: Location autocomplete in event creation/editing
  - Returns: Address suggestions with coordinates (lat/lng)

**Email Delivery:**
- SendGrid - Transactional email delivery
  - SDK: @sendgrid/mail 7.7.0 (installed but not used directly)
  - HTTP API via Vercel route: `api/send-email.ts`
  - Auth: SENDGRID_API_KEY (server-side env var)
  - Sender: SENDER_EMAIL env var (default: `info@weteamup.app`)
  - Purpose: Event notifications, event joins, updates
  - Implementation: `src/services/supabaseEmailService.ts` calls `/api/send-email`

**Email Marketing Automation:**
- MailerLite - Subscriber management and automation
  - SDK: @mailerlite/mailerlite-nodejs 1.4.0
  - Auth: REACT_APP_MAILERLITE_API_KEY (frontend env var)
  - Purpose: Newsletter subscriptions, user segmentation, automation campaigns
  - Groups defined in `src/services/mailerLiteService.ts`:
    - WELCOME_SERIES - New user onboarding
    - EVENT_CREATORS - Users who create events
    - EVENT_PARTICIPANTS - Users who join events
    - FRIEND_SYSTEM - Friend interaction tracking
    - INACTIVE_USERS - Churn prevention segment
  - Features: `addSubscriber`, `addSubscriberToGroup`, automation tracking

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Connection: REACT_APP_SUPABASE_URL + REACT_APP_SUPABASE_ANON_KEY
  - Client: @supabase/supabase-js 2.97.0
  - Initialized in: `src/lib/supabase.ts`
  - Tables (mapped from Firestore):
    - `profiles` - User accounts with extended metadata
    - `events` - Sports events (padel, tennis, etc.)
    - `event_players` - Junction: players registered for events
    - `match_results` - Post-event scores and results
    - `friends` - Bidirectional friend relationships
    - `friend_requests` - Pending friend invitations
    - `notifications` - In-app event notifications
    - `saved_events` - Bookmarked events
    - `memories` - Post-event photos/memories
    - `memory_likes` - Memory engagement
  - Authentication: Supabase Auth with email/password + Google OAuth
  - RLS (Row Level Security) enabled on all tables
  - Schema: `supabase/migrations/20250223000001_initial_schema.sql`

**Secondary Database (Legacy):**
- Firebase Firestore (being phased out)
  - Connection: Hardcoded credentials in `src/firebase.ts`
  - Collections: users, events, friends, notifications, memories, etc.
  - Status: Coexists during migration, not recommended for new features

**File Storage:**
- Supabase Storage
  - Buckets:
    - `avatars` - User profile pictures
    - `event-covers` - Event cover images
    - `memory-images` - Post-event photo memories
  - Upload: `supabase.storage.from('bucket').upload(path, file)`
  - Download: Public URLs via `supabase.storage.from('bucket').getPublicUrl(path)`
  - Used in: `src/components/CreateEventDialog.tsx`, `src/components/EditEventDialog.tsx`
  - Legacy: Firebase Storage (gradual migration in progress)

**Caching:**
- Not detected - No Redis or Memcached
- Browser caching via standard HTTP headers

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (primary)
  - Method: Email/password + Google OAuth
  - Hook: `useSupabaseAuth` in `src/hooks/useSupabaseAuth.ts`
  - Context: `SupabaseAuthContext` in `src/contexts/SupabaseAuthContext.tsx`
  - Features:
    - Session management via `supabase.auth.getSession()`
    - Real-time auth state changes via `supabase.auth.onAuthStateChange()`
    - Google OAuth redirect to `window.location.origin`
    - Email verification handled natively by Supabase
    - Profile auto-created via PostgreSQL trigger on user signup
  - Token: Bearer token included in API requests (`supabase.auth.getSession().data.session?.access_token`)

**Legacy Auth (being migrated):**
- Firebase Authentication
  - Method: Email/password + Google Sign-In
  - Still referenced in: `src/firebase.ts`, `src/hooks/useAuth.ts`, `src/contexts/AuthContext.tsx`
  - Not recommended for new features

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry or similar error tracking service

**Logging:**
- Console logging only
- No centralized logging service
- Errors logged to console in services and hooks

**Performance Monitoring:**
- web-vitals 3.5.2 (Core Web Vitals tracking)
- Implementation: Likely in `src/index.tsx` (standard CRA pattern)

## CI/CD & Deployment

**Hosting:**
- Vercel (primary)
  - Config: `vercel.json` with version 2 build specification
  - Builds:
    1. Static build: `@vercel/static-build` → `build/` directory
    2. API routes: `@vercel/node` from `api/**/*.ts`
  - Routes:
    - `/api/*` → serverless functions
    - `/static/*` → static assets
    - `/*` → SPA fallback to `index.html`

**Deployment Targets (Secondary/Legacy):**
- Firebase Hosting (`.github/workflows/firebase-hosting-deploy.yml`)
- VPS via SCP + Nginx + PM2 (`.github/workflows/deploy.yml`)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/`)
  - firebase-hosting-deploy.yml
  - deploy.yml
- Build command: `craco build` (CI=false to ignore warnings)
- Test command: `craco test` (via Jest + React Testing Library)

## Environment Configuration

**Required env vars (Frontend):**
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key for client auth
- `REACT_APP_API_URL` - Optional, defaults to `/api` for Vercel

**Required env vars (Server/Vercel):**
- `SENDGRID_API_KEY` - SendGrid API key for email delivery
- `SENDER_EMAIL` - Email address for "from" header (default: `info@weteamup.app`)

**Optional env vars:**
- `REACT_APP_MAILERLITE_API_KEY` - MailerLite API key for email marketing

**Secrets location:**
- Vercel environment variables (UI dashboard) for production
- `.env.local` file for local development (not committed)
- `.env.example` provided in repo (reference only, no secrets)

## Webhooks & Callbacks

**Incoming Webhooks:**
- Google OAuth redirect callback: Handled by Supabase Auth
  - Redirect URI: `window.location.origin` (dynamic)
  - Path: Auto-handled by `supabase.auth.onAuthStateChange()`
- Not detected: Email delivery webhooks, webhook endpoints for external services

**Outgoing Webhooks:**
- Supabase Realtime subscriptions (bidirectional)
  - Used in: `src/services/supabaseNotificationService.ts` (if implemented)
  - Purpose: Real-time event/notification updates
  - Not detected: Explicit webhook registrations to external services

**Email Callbacks:**
- SendGrid delivery status tracking: Not explicitly implemented
- MailerLite event tracking: Implicit via subscriber field updates

## Data Flow for Key Operations

**User Registration:**
1. Frontend: `useSupabaseAuth.register(email, password, displayName)`
2. Supabase Auth: Stores credentials, sends verification email
3. PostgreSQL Trigger: Auto-creates `profiles` row with user metadata
4. MailerLite (optional): `addUserToWelcomeSeries(email, name)` via `mailerLiteService.ts`
5. Email: Verification email sent by Supabase Auth

**Event Creation:**
1. Frontend: User submits form in `CreateEventDialog` or `EditEventDialog`
2. Image Upload (if provided):
   - Supabase Storage: `supabase.storage.from('event-covers').upload(path, file)`
   - Get public URL: `supabase.storage.from('event-covers').getPublicUrl(path)`
3. Database Insert: `supabase.from('events').insert(eventData)`
4. Email (optional): `sendEventCreationEmail(email, eventData)` → `/api/send-email` → SendGrid
5. MailerLite (optional): `addEventCreator(email)` to segment users

**Event Join:**
1. Frontend: User clicks "Join Event"
2. Database Insert: `supabase.from('event_players').insert({event_id, user_id})`
3. Notification Create: `supabase.from('notifications').insert({type: 'event_joined', ...})`
4. Email: `sendEventInvitation(creatorEmail, ...)` → `/api/send-email` → SendGrid
5. Real-time: Supabase Realtime broadcasts update to event details view

**Memory Upload:**
1. Frontend: User selects photo in `ShareMemoryDialog`
2. Firebase Storage (legacy): `uploadBytes(ref, file)` → `getDownloadURL()`
3. Database Insert: `supabase.from('memories').insert({event_id, image_url, ...})`
4. Real-time: Subscribers notified via Supabase Realtime

---

*Integration audit: 2026-02-23*
