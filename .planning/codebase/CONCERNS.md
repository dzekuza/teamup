# Codebase Concerns

**Analysis Date:** 2026-02-23

## Tech Debt

**Firebase/Supabase Dual-System Coexistence:**
- Issue: Major migration still mid-flight; both systems running simultaneously creating maintenance overhead and inconsistency risks
- Files: 32 files still importing Firebase (`src/components/EventCard.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/services/notificationService.ts`, `src/services/emailService.ts`, `src/hooks/useAuth.ts`, `src/contexts/AuthContext.tsx`)
- Impact: Data duplication risk, inconsistent user state across systems, doubled maintenance burden, unclear source of truth for user data, notifications may not sync between systems
- Fix approach: Complete the Supabase migration by systematically converting all remaining Firebase imports; consolidate notification and email services to use Supabase exclusively; remove Firebase-specific contexts and hooks once Supabase versions are stable

**Legacy Context Provider Not Being Used:**
- Issue: `AuthContext.tsx` (Firebase-based) still exported but `SupabaseAuthContext.tsx` exists alongside it; app doesn't wrap providers at root level
- Files: `src/contexts/AuthContext.tsx`, `src/contexts/SupabaseAuthContext.tsx`, `src/index.tsx`
- Impact: Confusing API for consumers; if legacy context is used accidentally, auth state will diverge from Supabase; future developers may not know which to use
- Fix approach: Remove `AuthContext.tsx` completely once all components use Supabase hooks; wrap app with `SupabaseAuthProvider` at root in `src/index.tsx`; audit all component imports to confirm they use `useSupabaseAuth`

**Complex Component State Management:**
- Issue: `CreateEventDialog.tsx` has 46 useState hooks (28 related to form state alone), `EventCard.tsx` has multiple state variables scattered across component; CreateEventDialog alone is 1497 lines
- Files: `src/components/CreateEventDialog.tsx` (1497 LOC), `src/components/EventCard.tsx` (982 LOC), `src/pages/EventDetails.tsx` (1119 LOC)
- Impact: Very difficult to refactor or test; state updates are hard to track; performance bottleneck due to excessive re-renders; high bug surface area; impossible to extract reusable logic
- Fix approach: Extract form state into a custom hook (e.g., `useCreateEventForm`); break CreateEventDialog into smaller sub-components (SportSelector, DateTimePicker, InviteStep); use a form library like React Hook Form; consider useReducer for complex event state management; split EventCard and EventDetails into smaller component trees

## Known Bugs

**Event Data Type Mismatch Between Firebase and Supabase:**
- Symptoms: Events created in one system may not appear correctly in the other; type coercion errors when Firestore Timestamps are converted to ISO strings
- Files: `src/hooks/useEvents.ts` (converts Firestore Timestamp to ISO), `src/pages/EventDetails.tsx` (reads event data), `src/types/index.ts` (legacy Event type)
- Trigger: Creating event via Firebase while Supabase is primary storage; switching between auth systems mid-session
- Workaround: Always fetch events from Supabase after migration; manually sync historical Firebase events to Supabase

**Navigation Visibility Communication Hack:**
- Symptoms: MobileNavigation component may not hide/show correctly when viewing EventDetails or other full-screen pages
- Files: `src/pages/EventDetails.tsx` (lines 140-150: `window.dispatchEvent(new CustomEvent('toggleNavigation'))`)
- Trigger: Navigating between EventDetails and home page on mobile
- Workaround: Use React Context instead of custom events to control navigation visibility

**Hardcoded Cover Image URLs:**
- Symptoms: Firebase Storage URLs hardcoded in multiple components; if Firebase storage changes, images break
- Files: `src/pages/Home.tsx`, `src/pages/EventDetails.tsx`, `src/components/EventCard.tsx`
- Trigger: Using fallback image when event has no custom cover
- Workaround: Define URLs as environment variables or constants in a single location

## Security Considerations

**Supabase Client Key Exposed in Frontend:**
- Risk: `REACT_APP_SUPABASE_ANON_KEY` is visible in frontend JavaScript; any user can call Supabase APIs directly; RLS policies are the only protection
- Files: `.env.example`, `src/lib/supabase.ts`
- Current mitigation: RLS policies are defined in `supabase/migrations/20250223000001_initial_schema.sql`; however no explicit RLS validation shown in codebase
- Recommendations: Verify all tables have explicit RLS policies enabled; audit RLS policies for overly permissive rules; consider adding server-side API proxy for sensitive operations; implement email verification as prerequisite for certain actions

**Passwords Stored in Events Table:**
- Risk: Event passwords stored in plaintext in `is_private` events (`password text` column in `supabase/migrations/20250223000001_initial_schema.sql`)
- Files: `supabase/migrations/20250223000001_initial_schema.sql`, `src/components/CreateEventDialog.tsx` (accepts password input)
- Current mitigation: None observed
- Recommendations: Hash event passwords using bcrypt before storage; never log passwords in error messages; consider time-limited access tokens instead of persistent passwords

**Email Verification Not Enforced:**
- Risk: Users can access full app without verifying email (only soft banner in `EmailVerificationBanner.tsx`); unverified accounts can create events and invite others
- Files: `src/components/EmailVerificationBanner.tsx` (just a banner), `src/pages/VerifyEmail.tsx`
- Current mitigation: Banner notifies users but doesn't block
- Recommendations: Add route guard to block unverified users from creating events; mark unverified profiles with a flag and respect it in event creation

**Sensitive Error Data in Logs:**
- Risk: Multiple `console.error()` calls (113 instances) may log sensitive data like email addresses, auth tokens, or user IDs
- Files: Throughout codebase (grep shows 113 instances)
- Current mitigation: None
- Recommendations: Implement structured logging service that sanitizes sensitive fields before logging; never log full error objects (which may contain sensitive nested data); mask email addresses in error messages

## Performance Bottlenecks

**Excessive Re-renders in Event Dialogs:**
- Problem: CreateEventDialog fetches friends list on every open, fetches 3+ times per step change; 46 useState calls cause cascading updates
- Files: `src/components/CreateEventDialog.tsx` (lines 165-195: friendship fetching logic)
- Cause: No memoization of callback functions; fetching triggered by `open` prop without dependency array optimization; all state changes trigger full re-render
- Improvement path: Memoize callback functions with useCallback; move friendship fetch to custom hook with caching; implement useMemo for computed values; consider Jotai or Zustand for form state to avoid re-renders of unrelated state

**Unoptimized EventCard List Rendering:**
- Problem: Home page renders potentially 50+ EventCard components; each card independently re-renders on any parent state change
- Files: `src/pages/Home.tsx`, `src/components/EventCard.tsx`
- Cause: Cards are not memoized; parent updates cause all child cards to re-render even if event data unchanged
- Improvement path: Wrap EventCard in React.memo; implement useCallback for event handlers; move event-specific state management to individual cards; consider virtualization (react-window) if 100+ events

**Multiple Fetches Per Component Lifecycle:**
- Problem: EventDetails page fetches event data, player info, saved status, creator info in separate calls; no request batching
- Files: `src/pages/EventDetails.tsx` (many useEffect blocks with independent fetches)
- Cause: Each data fetch in separate useEffect; no aggregation
- Improvement path: Combine multiple queries into single Supabase call using `.select()` with relationships; consider react-query or SWR for deduping requests

**CSS-in-JS Runtime Overhead:**
- Problem: Tailwind CSS good but Material-UI components add emotion runtime overhead; many components use both
- Files: Throughout (`@emotion/react`, `@emotion/styled` in package.json)
- Cause: Dual CSS-in-JS systems
- Improvement path: Consolidate to Tailwind CSS only; replace MUI components with custom Tailwind-based components (partially done with shadcn/ui pattern); lazy-load MUI components that are rarely used

## Fragile Areas

**EventCard Component:**
- Files: `src/components/EventCard.tsx` (982 lines)
- Why fragile: Mixing Firebase and Supabase imports; complex player info fetching; multiple state machines (join flow, edit flow, password flow); hardcoded avatar mapping; dependent on PADEL_LOCATIONS constant
- Safe modification: Extract join logic to separate hook; move player info fetching to Supabase query; isolate password flow to sub-component; never mix Firebase/Supabase calls in same component
- Test coverage: No tests found; very high risk to modify

**EventDetails Page:**
- Files: `src/pages/EventDetails.tsx` (1119 lines)
- Why fragile: Uses Supabase for core data but mixes old Firebase patterns (useAuth vs useSupabaseAuth); custom window.dispatchEvent for navigation control; hardcoded coordinates and fallback images; dependent on multiple dialogs (ShareMemoryDialog, EditEventDialog, ShareEventDialog)
- Safe modification: Fully migrate to useSupabaseAuth; replace window events with React Context; extract dialog state to separate hook; document all prop contracts for child components
- Test coverage: No specific tests for EventDetails

**CreateEventDialog:**
- Files: `src/components/CreateEventDialog.tsx` (1497 lines, 46 useState hooks)
- Why fragile: Extremely high complexity; multi-step form with non-trivial validation; friend list fetching; image upload; coordinates handling; email invitation logic; touch event handling for mobile
- Safe modification: Implement in stages using feature flags; extract each step to separate component; use React Hook Form for validation; add comprehensive unit tests before refactoring; document step-by-step flow
- Test coverage: Only 3 lines of test exist for CreateEventDialog

**User Profile Completion:**
- Files: `src/hooks/useProfileCompletion.ts`, `src/components/ProfileCompletionAlert.tsx`, `src/pages/Profile.tsx`
- Why fragile: Checks for missing profile fields but unclear which fields are required vs optional; no enforcement mechanism; not all pages respect completion status
- Safe modification: Define clear ProfileCompletion requirements in types; use const required fields instead of hardcoded checks; add route guard for sensitive actions
- Test coverage: No tests found

## Scaling Limits

**Hardcoded Max Players Per Event:**
- Current capacity: maxPlayers limited to 4 (hardcoded for padel) but system accepts up to 100+ if configured
- Limit: No database constraint enforces reasonable max; event_players table will accept unlimited rows
- Scaling path: Add CHECK constraint to events table for max_players <= 16; validate on client side in CreateEventDialog

**Location Data Management:**
- Current capacity: PADEL_LOCATIONS hardcoded as ~10 venues in `src/constants/locations.ts`
- Limit: Adding new venues requires code change and redeploy
- Scaling path: Move locations to Supabase table; create admin panel for location management; cache location data in context or state management layer

**Real-time Notifications:**
- Current capacity: Supabase Realtime subscriptions not yet implemented; system using polling or manual refresh
- Limit: Notification updates have latency; scale issues with 1000+ concurrent users
- Scaling path: Implement Supabase Realtime channels for notifications and events; implement exponential backoff for failed subscriptions

**Image Storage:**
- Current capacity: Firebase Storage or Supabase Storage with no upload size limits enforced
- Limit: Large image uploads will slow down event creation; no image optimization
- Scaling path: Implement client-side image compression; set max file size limits; add image resizing with sharp or similar; use CDN for image delivery

## Dependencies at Risk

**Firebase Dual-System Complexity:**
- Risk: Firebase SDK still required despite Supabase migration; adds 50KB+ to bundle
- Impact: Bundle size grows; unnecessary dependency bloat; Firebase compatibility breaks in future React versions could cause issues
- Migration plan: Complete removal of Firebase SDK once all code migrated to Supabase

**React 18.2.0 with Patches:**
- Risk: Project uses patches for React 18.2.0 (`patches/react+18.2.0.patch`, `patches/react-dom+18.2.0.patch`)
- Impact: Patches are a temporary fix; future React updates will require manual patch re-evaluation; potential for security issues if patches mask real bugs
- Migration plan: Update to latest React 18.x or React 19; test thoroughly; remove patch-package if not needed

**Material-UI Components in Transition:**
- Risk: Project uses MUI 5 alongside custom Tailwind components; MUI adds 200KB+ to bundle
- Impact: Two component systems create maintenance burden; styling conflicts possible; inconsistent design system
- Migration plan: Migrate remaining MUI components (Dialog, Button, Input) to Tailwind-based alternatives; MUI icons can stay as they're lightweight

**MapLibre GL with Dual Map SDK:**
- Risk: Project has both mapbox-gl (^3.11.0) and maplibre-gl (^5.3.1) as dependencies
- Impact: Unnecessary bundle bloat; unclear which one is actually used; potential for version conflicts
- Migration plan: Remove mapbox-gl if maplibre-gl is the canonical choice; audit imports to confirm

## Missing Critical Features

**Rate Limiting on Event Creation:**
- Problem: No rate limiting on POST requests to create events; user could spam event creation
- Blocks: Production readiness; prevents abuse
- Recommendation: Implement API rate limiting on Vercel API routes; validate one active event per user per time period

**User Account Deletion:**
- Problem: No way for users to delete their accounts; violates GDPR right to be forgotten
- Blocks: Regulatory compliance; user privacy concerns
- Recommendation: Implement account deletion endpoint that cascades to all related data (events, memories, notifications); implement soft-delete initially if audit trail needed

**Email Unsubscribe Mechanism:**
- Problem: Email service (SendGrid) has no unsubscribe handling in frontend
- Blocks: CAN-SPAM compliance; reduces user frustration
- Recommendation: Add unsubscribe link to all transactional emails; implement email preferences table in Supabase

**Two-Factor Authentication:**
- Problem: No 2FA support; users with weak passwords are at risk
- Blocks: Security-conscious users can't protect accounts; regulatory requirements for some markets
- Recommendation: Add TOTP-based 2FA using Supabase Auth; make optional but encouraged

## Test Coverage Gaps

**Event Lifecycle Missing Tests:**
- What's not tested: Event creation with all validation rules; event joining/leaving; match result reporting; event completion status transitions
- Files: `src/components/CreateEventDialog.tsx`, `src/components/EventCard.tsx`, `src/pages/EventDetails.tsx`
- Risk: Core business logic has no automated checks; bugs in event flow go unnoticed; refactoring is extremely risky
- Priority: High - these are revenue-critical features

**Authentication Flow Not Tested:**
- What's not tested: Login with email/password; Google OAuth flow; email verification; registration validation
- Files: `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/VerifyEmail.tsx`, `src/hooks/useSupabaseAuth.ts`
- Risk: Auth failures affect all users; Firebase/Supabase switching could silently break logins
- Priority: High - breaks app for all users if broken

**Dialog Components Unverified:**
- What's not tested: UserProfileDialog, RegisterDialog, MatchResultsDialog, ShareMemoryDialog, EditEventDialog state transitions and validation
- Files: 15+ dialog components, only CreateEventDialog has minimal test coverage
- Risk: Data entry errors not caught; form validation gaps; state management bugs
- Priority: Medium - affects data quality but partial failures only

**API Integration Tests Missing:**
- What's not tested: Supabase queries in services; email sending via API route; Realtime subscriptions
- Files: `src/services/supabaseEmailService.ts`, `src/services/supabaseNotificationService.ts`, `api/send-email.ts`
- Risk: External service failures not caught; email delivery issues not detected; data sync problems
- Priority: Medium - affects user experience but not blocking

**Utilities Not Tested:**
- What's not tested: String formatting utilities, cookie utilities, date calculations, avatar mapping
- Files: `src/utils/*.ts`
- Risk: Edge cases in common utilities (date parsing, timezone handling) cause cascading bugs; refactoring utilities is dangerous
- Priority: Low - but important for data consistency

---

*Concerns audit: 2026-02-23*
