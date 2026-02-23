# Pitfalls Research

**Domain:** React Native Expo mobile UI polish + Firebase-to-Supabase brownfield migration
**Researched:** 2026-02-23
**Confidence:** MEDIUM-HIGH (web app pitfalls HIGH, mobile pitfalls MEDIUM — mobile app is starter-level, real screen code not yet written)

---

## Critical Pitfalls

### Pitfall 1: SupabaseAuthProvider Not Wired at Root — Silent Dual-Auth Split Brain

**What goes wrong:**
`index.tsx` currently wraps the app only with `CookieProvider`. `App.tsx` imports `useAuth` from `./hooks/useAuth` (the legacy Firebase hook), not from `SupabaseAuthContext`. The `SupabaseAuthProvider` exists but is not mounted anywhere in the tree. The result: any page that consumes `useAuth()` after migration still reads Firebase state, not Supabase state, even after the page-level Firebase calls are replaced. Protected routes, loading states, and `user` objects will diverge between the two systems producing silent auth failures — the user appears logged in to one system and anonymous to another.

**Why it happens:**
The migration was done bottom-up (hooks and services first, context last). The provider was created but the final step — inserting it at the root — was deferred. When a developer migrates a page and tests it, they assume `useAuth()` already returns Supabase state.

**How to avoid:**
The very first task in the migration phase must be: replace `useAuth` import in `App.tsx` from `./hooks/useAuth` to the re-exported hook in `SupabaseAuthContext`, and wrap `<App>` in `<SupabaseAuthProvider>` in `index.tsx`. Do this before migrating any page. Verify with `console.log(user)` in a protected route — the user object shape from Supabase (`id`, `email`, `user_metadata`) is distinct from Firebase's (`uid`, `displayName`).

**Warning signs:**
- `useAuth()` in any migrated page returns `uid` instead of `id` on the user object — still on Firebase
- `loading` stays `true` indefinitely after migration of a page
- Google OAuth redirects loop back to login
- `App.tsx` line 14: `import { useAuth } from './hooks/useAuth'` — if this still points to the Firebase hook, the provider swap hasn't happened

**Phase to address:**
Phase 1 (auth provider wiring) — must be step zero before any page migration.

---

### Pitfall 2: Plaintext Password Stored in Cookies — Critical Security Regression

**What goes wrong:**
`Login.tsx` (current Firebase implementation) saves `savedEmail` and `savedPassword` in plaintext cookies with a 30-day expiry when "Remember me" is checked. This is a critical security anti-pattern: the raw password is recoverable by anyone with access to the device's cookies, any XSS vulnerability, or any subdomain takeover. When migrating Login to Supabase, this cookie-based credential caching must NOT be ported over.

**Why it happens:**
The original developer wanted persistent login convenience and used cookies as the simplest solution. Supabase Auth handles session persistence natively via its own secure token storage — this manual credential caching is unnecessary with Supabase.

**How to avoid:**
During Login migration: remove `setCookie('savedPassword', ...)` entirely. Supabase's `supabase.auth.signInWithPassword()` automatically persists the session using `localStorage` or cookies at the SDK level (controlled by `persistSession: true` in the Supabase client init). The "remember me" behavior is already handled. Only store non-sensitive state like `savedEmail` for UX pre-fill. Audit `cookieUtils` usage in migrated pages and strip any password storage.

**Warning signs:**
- Any call to `setCookie('savedPassword', ...)` surviving in migrated Login.tsx
- `getCookie('savedPassword')` being used to populate password fields after migration
- `userData` cookie containing `uid` (Firebase shape) rather than Supabase `id`

**Phase to address:**
Phase 1 (Login page migration) — must be caught during the Login migration, not after.

---

### Pitfall 3: Facebook Auth Provider Left Active After Migration — Broken OAuth Flow

**What goes wrong:**
`Login.tsx` includes a Facebook login button that calls `signInWithPopup(auth, new FacebookAuthProvider())`. Supabase does not support Facebook OAuth via `signInWithPopup` from the Firebase SDK — Supabase has its own OAuth provider system. If the Facebook button is left connected to Firebase auth during migration, it silently authenticates the user against Firebase, not Supabase, creating a partial session that breaks protected routes on the Supabase side.

**Why it happens:**
Migration focuses on email/password and Google OAuth (both mapped clearly to Supabase equivalents). Facebook Auth is a third provider that gets overlooked because it's less common and the Supabase OAuth docs default to Google/GitHub examples.

**How to avoid:**
During Login migration, audit all three auth providers. For Facebook: either implement it via `supabase.auth.signInWithOAuth({ provider: 'facebook' })` (requires enabling Facebook in Supabase dashboard and configuring Facebook App credentials) or disable the Facebook button for this milestone and add a `// TODO: Facebook OAuth not yet migrated` comment. Do not leave a Firebase-backed auth button on a Supabase-migrated page.

**Warning signs:**
- Facebook button still renders and appears clickable after migration
- Facebook login succeeds but user lands on a blank protected page
- Firebase `currentUser` has a value but Supabase `session` is null after Facebook login

**Phase to address:**
Phase 1 (Login page migration).

---

### Pitfall 4: RLS Policies Blocking All Reads — Empty Results With No Error

**What goes wrong:**
Supabase returns empty arrays (`[]`) — not errors — when RLS policies block a query. During migration, if a developer replaces a Firestore `getDocs()` call with `supabase.from('events').select()` and sees an empty array, they may assume the table is empty or debug the query logic for hours before realizing RLS is silently blocking the read. This is especially dangerous for `saved_events`, `profiles`, and `notifications` tables which have user-scoped RLS policies.

**Why it happens:**
The Supabase SQL editor runs as the `postgres` superuser which bypasses RLS. Developers test queries in the SQL editor, see results, assume the query is correct, wire it into the app, and see nothing — because the app authenticates as a regular user subject to RLS.

**How to avoid:**
Always test Supabase queries through the JavaScript client SDK with a real authenticated test user, not through the SQL editor. When migrating a page, add a temporary `console.log('Supabase response:', data, error)` to surface both the data and the error. Verify the migration schema's RLS policies in `supabase/migrations/20250223000001_initial_schema.sql` match the expected data access patterns before migrating each page.

**Warning signs:**
- Page renders but shows empty state (no events, no saved events, no notifications)
- No errors in the console — `error` is null but `data` is `[]`
- The same query in the Supabase SQL editor returns rows correctly
- User is authenticated (Supabase `session` is non-null) but data calls return nothing

**Phase to address:**
All migration phases — verify RLS behavior on each page as it is migrated.

---

### Pitfall 5: Keyboard Avoidance Broken on Android — Input Hidden Behind Keyboard

**What goes wrong:**
React Native's built-in `KeyboardAvoidingView` behaves differently on iOS and Android. On iOS, `behavior="padding"` works reliably. On Android, many phone manufacturers don't expose the keyboard height API correctly, so `KeyboardAvoidingView` either does nothing or causes the screen to jump erratically. For a mobile app with login, event creation, and search inputs, this is a core UX failure — users on Android cannot see what they're typing.

**Why it happens:**
Developers test primarily on iOS simulator or their personal device. The `KeyboardAvoidingView` appears to work, but Android physical devices with custom keyboard apps or specific OEM overlays behave differently. The Expo starter template doesn't include a `KeyboardAvoidingView` setup.

**How to avoid:**
Use `react-native-keyboard-controller` (the current recommended approach per Expo docs) instead of the built-in `KeyboardAvoidingView`. It provides consistent behavior across platforms via native keyboard event APIs. Alternatively, `KeyboardAwareScrollView` from `react-native-keyboard-aware-scroll-view` is a simpler drop-in for form screens. Test on a physical Android device with a third-party keyboard before considering any form screen complete.

**Warning signs:**
- Using `<KeyboardAvoidingView behavior="padding">` without platform-conditional behavior
- No keyboard handling at all on form screens (inputs simply get covered)
- Testing done only on iOS simulator
- Complaints that the login/event-create form is unusable on Android

**Phase to address:**
Mobile UI polish phase — every screen with a TextInput must address this.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep Firebase SDK in `package.json` during migration | Avoids breaking unmigrated components (EventCard, CreateEventDialog, Home, Community, EventDetails) | Bundle size stays inflated with two backend SDKs; developer confusion about which to use for new code | Acceptable until ALL 32 Firebase-importing files are migrated; then remove immediately |
| Migrate pages without updating `useAuth` hook source | Faster per-page migration | `useAuth()` returns Firebase user object shape — `uid` not `id` — breaking profile lookups in Supabase | Never acceptable — wire SupabaseAuthProvider first |
| Copy `getFirebaseErrorMessage()` error mapping to Supabase migration | Reuse existing user-facing error strings | Supabase error codes differ from Firebase codes; error messages become misleading (e.g. `auth/user-not-found` doesn't exist in Supabase) | Never — write a `getSupabaseErrorMessage()` function with Supabase-specific error handling |
| Use `index` as FlatList `keyExtractor` in mobile | Simple, no extra prop needed | Causes list items to rerender unnecessarily on data mutation; visible flickering at 20+ items | Never in production lists — always use item `id` |
| Skip SafeAreaView on mobile screens | Faster development | Content overlaps notch, status bar, and home indicator on modern iPhones and Android notch devices | Never on screens that show user content |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth (web) | Calling `supabase.auth.getUser()` on every render to check auth state | Subscribe once with `supabase.auth.onAuthStateChange()` in the provider; cache the session in React state |
| Supabase RLS | Forgetting the `TO authenticated` clause on policies | Add `TO authenticated` so the policy doesn't evaluate for anon users, improving performance and correctness |
| Supabase Storage | Uploading to a private bucket and then trying to serve the URL directly | Use signed URLs (`supabase.storage.from('bucket').createSignedUrl()`) for private buckets; use public bucket URLs only for intentionally public content |
| Supabase Realtime | Creating a new channel on every component mount without cleanup | Always return `() => supabase.removeChannel(channel)` from the `useEffect` cleanup; leaked channels count against the 500 concurrent connection limit on Pro tier |
| Expo Router navigation | Importing `useRouter` from `react-navigation` instead of `expo-router` | In an Expo Router project, always import navigation hooks from `expo-router` — mixing the two causes navigation tree corruption |
| `@expo/vector-icons` | Using icon names from one icon set with a component from another | Match icon names to their set: `Ionicons` for iOS-style, `MaterialIcons` for Material, `FontAwesome` for FA — wrong names render nothing silently |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Supabase Realtime: one channel per list item | Page load becomes slow, 500 concurrent connection limit hit with ~50 active users | Use one channel per page/screen scoped to the table, not one per row | 50+ simultaneous users on a page with per-row subscriptions |
| `useEffect` without cleanup on Supabase subscriptions | Memory leaks, stale callbacks fire after unmount, "Can't perform state update on unmounted component" warnings | Always call `supabase.removeChannel(channel)` in the useEffect cleanup | Visible immediately in dev with React StrictMode double-mounting |
| FlatList with no `getItemLayout` for fixed-height items | Scroll-to-index doesn't work, slow initial render for lists >50 items | Provide `getItemLayout` when item height is fixed | Lists with 30+ uniform-height items |
| RLS policy without index on `user_id` column | Query takes 50-200ms per request; worsens linearly with row count | Add `CREATE INDEX idx_table_user_id ON table(user_id)` for all user-scoped tables | Tables reaching 10,000+ rows |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Plaintext password in cookies (`savedPassword` cookie in Login.tsx) | Password exposed to XSS, device theft, cookie logging, network sniffing | Remove entirely; rely on Supabase's native session persistence — do not port this to the migrated Login page |
| Tables created during development with RLS disabled | Any user with the project URL and anon key can read/write all rows | Always enable RLS immediately after `CREATE TABLE`; add at minimum a restrictive default policy before adding permissive ones |
| Supabase `service_role` key referenced in client-side code | Full admin access to database bypasses all RLS — complete data exposure | The `service_role` key must NEVER appear in `REACT_APP_*` env vars or frontend code; it belongs only in server-side API routes (Vercel `/api/`) |
| Facebook App ID hardcoded in Login.tsx (`1551008729077882`) | App ID exposed in source, enabling abuse of the OAuth flow | Move to `REACT_APP_FACEBOOK_APP_ID` env var; remove Facebook OAuth entirely from migrated Login if not implementing Supabase Facebook OAuth this milestone |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state on async Supabase calls in migrated pages | Users see blank screens or stale data after navigation; double-clicks submit forms twice | Add `isLoading` state to all async operations; disable buttons during submission with a spinner |
| Missing error boundary on Supabase data pages | An RLS misconfiguration or network error crashes the entire page instead of showing a user-friendly message | Add try/catch with user-visible error states; "Something went wrong, please try again" is better than a blank white screen |
| Mobile: hardcoded pixel spacing that ignores `rem`/`sp` | Text is too small on high-DPI Android devices with accessibility font sizes | Use `StyleSheet` with relative sizing where possible; test with device text size set to "Large" |
| Mobile: bottom tab bar overlapping content | Scrollable content hidden behind the tab bar on devices without home bars | Use `useSafeAreaInsets()` from `react-native-safe-area-context` to calculate bottom padding; add `paddingBottom` equal to tab bar height + safe area inset |
| Mobile: no haptic feedback on primary actions | App feels unresponsive compared to native apps | The project already has `expo-haptics` installed — use `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on button presses; already demonstrated in `haptic-tab.tsx` |

---

## "Looks Done But Isn't" Checklist

- [ ] **Login migration:** Verify `savedPassword` cookie write is removed — not just the Firebase import
- [ ] **Login migration:** Verify `useAuth()` in `App.tsx` returns Supabase user (`id` field) not Firebase user (`uid` field)
- [ ] **Register migration:** Verify email verification flow uses Supabase's native confirmation email, not a custom Firebase token flow
- [ ] **Profile migration:** Verify profile photo upload goes to `supabase.storage.from('avatars')`, not Firebase Storage
- [ ] **SavedEvents migration:** Verify the saved events query is scoped to the authenticated user via RLS (not just filtered client-side)
- [ ] **Locations/SingleLocation migration:** These pages may not need heavy auth — verify the Supabase queries match the anon-accessible RLS policy on location data
- [ ] **SupabaseAuthProvider wired:** `grep -n "SupabaseAuthProvider" src/index.tsx` must return a match
- [ ] **Mobile keyboard:** Every screen with a TextInput must have been tested on an Android device (not just iOS simulator)
- [ ] **Mobile safe area:** Every screen must use `SafeAreaView` from `react-native-safe-area-context`, not the built-in React Native version
- [ ] **Build clean:** `npm run build` with `CI=false` produces zero "Module not found: firebase" errors after migration

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SupabaseAuthProvider not wired — discovered mid-migration | MEDIUM | Add provider to `index.tsx`, update `App.tsx` useAuth import, re-test all migrated pages since they were tested against wrong auth state |
| Plaintext password cookie shipped to production | HIGH | Revoke session tokens (Supabase dashboard), force password reset for affected users, deploy patch within hours — this is a breach notification scenario |
| RLS policy blocks all reads — discovered in QA | LOW | Add the missing SELECT policy in Supabase dashboard (instant, no deploy needed), re-test |
| Facebook Auth left on Firebase after Login migration — users create Firebase accounts | HIGH | Firebase accounts won't have Supabase profiles; requires a data reconciliation script to migrate Firebase user records to Supabase before cutting off Firebase Auth |
| Mobile keyboard issue found after release | MEDIUM | Install `react-native-keyboard-controller`, update affected screens, OTA update via Expo Updates (if configured) or app store release |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SupabaseAuthProvider not wired at root | Phase 1: Auth provider wiring (first task) | `grep "SupabaseAuthProvider" src/index.tsx` returns match; `useAuth().user?.id` (not `uid`) in App console |
| Plaintext password in cookies | Phase 1: Login migration | `grep "savedPassword" src/pages/Login.tsx` returns zero matches |
| Facebook Auth on Firebase during migration | Phase 1: Login migration | Facebook button either removed or points to `supabase.auth.signInWithOAuth({ provider: 'facebook' })` |
| RLS blocking reads silently | Each page migration phase | Add `console.log` assertions in dev; each migrated page must display real data from a test user account |
| Keyboard avoidance broken on Android | Mobile UI polish phase | Test on physical Android device with standard keyboard and gboard; all form inputs visible when keyboard open |
| SafeAreaView notch overlap | Mobile UI polish phase | Test on iPhone with notch (iPhone 12+) and Android with status bar; no content obscured |
| FlatList index key causing rerenders | Mobile UI polish phase | `keyExtractor` in all FlatList instances uses item `id`, not array index |
| Supabase Realtime channel leak | Any phase using Realtime | Every `useEffect` with a Supabase channel has a cleanup function; verify in React DevTools |

---

## Sources

- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase RLS performance best practices: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Expo keyboard handling guide: https://docs.expo.dev/guides/keyboard-handling/
- React Native KeyboardAvoidingView docs: https://reactnative.dev/docs/keyboardavoidingview
- gorhom/react-native-bottom-sheet keyboard handling: https://gorhom.dev/react-native-bottom-sheet/keyboard-handling
- Firebase to Supabase migration guide (Supabase official): https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data
- Firebase plaintext password exposure (19M records): https://www.malwarebytes.com/blog/personal/2024/03/19-million-plaintext-passwords-exposed-by-incorrectly-configured-firebase-instances
- Supabase security: 170+ apps exposed by missing RLS (CVE-2025-48757): https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/
- Expo SDK 54 + Reanimated 4 migration notes: https://medium.com/@shanavascruise/upgrading-to-expo-54-and-react-native-0-81-a-developers-survival-story-2f58abf0e326
- React Native FlatList performance (2025): https://reactnativeexample.com/react-native-flatlist-performance-issues-expert-solutions-2025/
- Expo safe areas guide: https://docs.expo.dev/develop/user-interface/safe-areas/

---
*Pitfalls research for: TeamUp — React Native Expo mobile UI polish + Firebase-to-Supabase brownfield migration*
*Researched: 2026-02-23*
