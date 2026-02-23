# Feature Research

**Domain:** React Native mobile UI polish + Firebase-to-Supabase page migration
**Researched:** 2026-02-23
**Confidence:** MEDIUM (mobile UI patterns from official docs + community; migration patterns from Supabase official docs)

---

## Context

This is a subsequent milestone on an existing production app (teamup.lt / weteamup.app). The web app is a React 18 + Supabase app in mid-migration from Firebase. The mobile app is a React Native Expo 54 project in its initial skeleton state. Two work streams run in parallel:

1. **Mobile UI work stream** — React Native Expo 54, Reanimated 4.1.1, Gesture Handler 2.28.0. The mobile app has the default Expo starter content (HelloWave, ParallaxScrollView) and needs proper TeamUp screens with polished inputs, buttons, and bottom sheets.

2. **Web migration work stream** — Six pages still import directly from `firebase/auth` and `firebase/firestore`: Login, Register, Profile, SavedEvents, Locations, SingleLocation. `SupabaseAuthContext.tsx` exists and is complete but is NOT wired at the app root (`index.tsx` renders bare `<CookieProvider><App/>` without `<SupabaseAuthProvider>`). `App.tsx` imports `useAuth` from the legacy `hooks/useAuth.ts` (Firebase), not from `SupabaseAuthContext.tsx`.

---

## Feature Landscape

### Table Stakes (Users Expect These)

#### Mobile UI — Inputs

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Controlled TextInput with visible focus ring | All native apps do this; missing = broken feel | LOW | Use `onFocus`/`onBlur` state + border color change. React Native 0.81 New Architecture makes this zero-latency |
| Password toggle (show/hide) | Standard on every auth input globally | LOW | Absolute-positioned Pressable inside input container |
| Keyboard avoiding (inputs scroll above keyboard) | Without this form inputs are hidden behind keyboard, unusable | MEDIUM | Use `KeyboardAvoidingView` (behavior="padding" on iOS, "height" on Android) or `react-native-keyboard-controller`'s `KeyboardAwareScrollView` |
| Input label above field | Screen readers and users expect visible labels | LOW | Static `Text` above each `TextInput` |
| Inline error message below input | Required for form validation UX | LOW | Conditional `Text` in accent red, rendered below field |
| Disabled state styling | Buttons and inputs must look non-interactive when loading | LOW | `opacity: 0.5` + `pointerEvents: none` pattern |
| Loading spinner on submit button | Prevents double-submission, shows feedback | LOW | ActivityIndicator swap inside button during async call |
| `returnKeyType` and `blurOnSubmit` chaining | Multi-field forms need keyboard "Next" flow | LOW | Set `returnKeyType="next"`, chain `ref.focus()` in `onSubmitEditing` |

#### Mobile UI — Buttons

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Pressable with scale/opacity feedback | Native feel; plain TouchableOpacity looks dated | LOW | `useAnimatedStyle` + `withTiming` on press for scale 0.97 |
| Haptic feedback on primary actions | iOS/Android standard; users expect physical confirmation | LOW | `expo-haptics` already in package.json — call `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Full-width primary button (lime `#C1FF2F`) | Brand consistency with web app | LOW | Flat design, dark text `#111111`, `borderRadius: 12` |
| Destructive variant (red) | Needed for delete/leave actions | LOW | Same structure, different color |
| Icon button (circle, icon only) | Navigation, FAB-style actions | LOW | Fixed size, centered icon |
| Loading state inside button | Replaces label with spinner in-place | LOW | Conditional render of `ActivityIndicator` |

#### Mobile UI — Bottom Sheets

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Slide-up sheet with handle indicator | Standard mobile pattern for contextual menus and pickers | MEDIUM | **WARNING: `@gorhom/bottom-sheet` v5 has known breakage with Expo SDK 54 + Reanimated 4.1** (GitHub issues #2471, #2528). Recommend custom implementation using Reanimated 4's `useAnimatedStyle` + `GestureDetector` from Gesture Handler 2 instead |
| Backdrop overlay that dismisses on tap | Required — users expect tap-outside-to-close | LOW | `Pressable` full-screen backdrop, `withTiming` opacity |
| Snap points (partial and full height) | Needed for event detail panels, filter sheets | MEDIUM | Shared values for snap heights, spring animations |
| Scroll inside bottom sheet | Long content (venue details, event lists) requires scrolling | MEDIUM | Nest `ScrollView` inside sheet, handle gesture conflicts |
| Safe area padding at bottom | Without this, content hides behind home indicator on iOS | LOW | `useSafeAreaInsets().bottom` from `react-native-safe-area-context` (already in package.json) |

#### Web Migration — Auth Pages

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Wire `SupabaseAuthProvider` at app root (`index.tsx`) | Without this, ALL migrated pages that call `useAuth()` from `SupabaseAuthContext` will throw "must be used within a SupabaseAuthProvider" | LOW | Wrap `<App/>` in `<SupabaseAuthProvider>` in `index.tsx` |
| `App.tsx` imports `useAuth` from `SupabaseAuthContext` | `App.tsx` currently imports from `hooks/useAuth.ts` (Firebase). Route guards won't work after provider switch | LOW | Update import path only |
| Login page: replace `signInWithEmailAndPassword` (Firebase) with `supabase.auth.signInWithPassword` | Core auth function swap | LOW | Pattern already implemented in `useSupabaseAuth.ts`; Login.tsx just needs to call `login()` from context |
| Login page: replace `signInWithPopup(GoogleAuthProvider)` with `supabase.auth.signInWithOAuth({provider: 'google'})` | Google OAuth requires redirect flow (not popup) in Supabase | MEDIUM | Supabase OAuth uses redirect; requires `redirectTo` config. Remove Facebook OAuth (not in Supabase config) |
| Login page: translate Firebase error codes to Supabase error messages | Firebase `auth/wrong-password` vs Supabase `Invalid login credentials` — different message formats | LOW | Replace `getFirebaseErrorMessage()` with Supabase-aware error handler |
| Register page: replace `createUserWithEmailAndPassword` + `updateProfile` with `supabase.auth.signUp` | Core auth swap + display_name goes into `options.data` | LOW | `useSupabaseAuth.register()` already implements this |
| Register page: replace Firestore `setDoc(doc(db, 'users', uid))` with Supabase `profiles` upsert | Profile creation moved from client to DB trigger; client may do supplemental update | LOW | Trigger already creates profile; client updates `display_name` only |
| Register page: remove Facebook OAuth | Facebook auth not wired in Supabase project | LOW | Remove `FacebookAuthProvider` code and Facebook SDK init `useEffect` |
| Register page: remove saved-password-in-cookies anti-pattern | Storing passwords in cookies is a security issue being carried from Firebase implementation | LOW | Remove cookie save/restore for password; keep only email for UX convenience |

#### Web Migration — Data Pages

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Profile page: replace `getDoc(doc(db, 'users', uid))` with `supabase.from('profiles').select()` | Core data read | LOW | Schema maps: `users.photoURL` → `profiles.photo_url`, `users.level` → `profiles.level` |
| Profile page: replace `setDoc(doc(db, 'users', uid))` with `supabase.from('profiles').update()` | Core data write | LOW | Standard upsert pattern |
| Profile page: replace `updateProfile(auth.currentUser)` with `supabase.auth.updateUser({data: {...}})` | Display name lives in Supabase `auth.users.raw_user_meta_data` | LOW | Or update only the `profiles` table and use that as source of truth |
| Profile page: replace `useAuth` from Firebase hook with `useAuth` from `SupabaseAuthContext` | Post-provider-wire this becomes an import path change | LOW | One import change after root provider is wired |
| SavedEvents page: replace Firestore `collection/query/where/getDocs` with `supabase.from('saved_events').select('*, events(*)')` | Core data read — saved_events table exists with proper schema | MEDIUM | Need join to fetch event data; Supabase supports nested select syntax |
| Locations page: replace Firestore events query with Supabase equivalent | Queries events by location to show event count per venue | MEDIUM | Replace `collection(db, 'events')`, `where()`, `getDocs()` with `supabase.from('events').select().eq('location_name', x)` |
| SingleLocation page: same as Locations | Same Firestore pattern repeated for single venue | MEDIUM | Same replacement approach |

---

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Animated press feedback with haptics on mobile buttons | Makes TeamUp feel like a premium native app, not a web wrapper | LOW | 2-3 lines with `expo-haptics` + Reanimated `withSpring` |
| Custom brand-consistent bottom sheet (lime accent handle, dark background) | Consistent visual identity across mobile; most apps use generic white sheets | MEDIUM | Custom implementation avoids gorhom compatibility issues AND gives full brand control |
| Seamless auth state between web and mobile (same Supabase session) | Users who log in via web have mobile auth "just work" — rare in sports apps | HIGH | Requires Supabase Auth on both platforms with shared project credentials |
| Clean removal of dual-context confusion | After migration, `useAuth()` always returns Supabase user — no Firebase shadow state causing bugs | LOW | High developer-experience value; reduces bug surface for all future work |
| Smooth keyboard toolbar with Next/Done buttons | Professional UX detail on multi-field forms (Register has 5+ fields) | MEDIUM | `react-native-keyboard-controller` `KeyboardToolbar` component provides this out-of-box |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Use `@gorhom/bottom-sheet` v5 with Expo 54 | It's the most popular bottom sheet library | Known breakage: Expo SDK 54 + Reanimated 4.1 causes "Cannot read property 'level' of undefined" (GitHub issue #2471). No confirmed fix from maintainers as of Feb 2026. Workaround (downgrade to Reanimated 3.19.1) conflicts with Expo 54 defaults | Build a lightweight custom bottom sheet using Reanimated 4 + Gesture Handler 2 directly. ~80 lines of code. No dependency risk |
| Migrate Facebook OAuth to Supabase | Login.tsx and Register.tsx currently have Facebook auth buttons | Facebook auth requires separate Supabase provider config, App Review with Meta, test user management. Current scope only covers existing Supabase providers | Remove Facebook buttons entirely. Google OAuth is sufficient for Lithuanian market padel app |
| Store passwords in cookies (RememberMe) | Login.tsx carries this forward from the Firebase version | Storing plaintext passwords in cookies is a security vulnerability | Use Supabase's built-in session persistence (`supabase.auth.getSession()` + `localStorage`). Remove password cookie entirely; optionally persist email only |
| Migrate CreateEventDialog or EventCard in this milestone | These are the logical next Firebase files to migrate | CreateEventDialog is 1497 LOC, EventCard is 982 LOC. Both are complex, untested, and high-blast-radius. Migration without tests risks breaking the core product loop | Scope explicitly excludes these per PROJECT.md. Do them in a dedicated test-first milestone |
| Full MUI → Tailwind migration | MUI components feel inconsistent with the dark theme | 32 files use MUI; full migration is a multi-week refactor | Gradual: only touch MUI in files being migrated. New components use Tailwind + shadcn/ui pattern |
| Add animation library to mobile (Lottie, Rive) | Rich animations look polished | Adds bundle size, complicates build, and the app doesn't have content that justifies it yet | Reanimated 4 (already installed) handles all needed animations: press states, bottom sheets, transitions |

---

## Feature Dependencies

```
[Wire SupabaseAuthProvider at root]
    └──enables──> [App.tsx useAuth import update]
                      └──enables──> [Login page migration]
                      └──enables──> [Register page migration]
                      └──enables──> [Profile page migration]
                      └──enables──> [SavedEvents page migration]
                      └──enables──> [Locations page migration]
                      └──enables──> [SingleLocation page migration]
                      └──enables──> [Remove legacy AuthContext.tsx]

[Mobile: Reanimated 4 + Gesture Handler 2 (already installed)]
    └──enables──> [Custom bottom sheet implementation]
    └──enables──> [Animated button press feedback]

[Mobile: expo-haptics (already installed)]
    └──enables──> [Haptic button feedback]

[Mobile: react-native-safe-area-context (already installed)]
    └──enables──> [Bottom sheet safe area padding]

[Custom bottom sheet]
    └──requires──> [Gesture Handler GestureHandlerRootView at app root]
```

### Dependency Notes

- **SupabaseAuthProvider at root requires nothing new** — the provider, context, and hook are all implemented. This is purely a wiring task in `index.tsx` and one import update in `App.tsx`. It is the single highest-leverage task of the web migration stream because it unblocks all 6 page migrations.
- **Page migrations are independent of each other** after the provider is wired. Login, Register, Profile, SavedEvents, Locations, SingleLocation can each be migrated in any order without blocking.
- **Mobile bottom sheet requires GestureHandlerRootView** at the app root layout (`app/_layout.tsx`). Check if it's already wrapping the app.
- **gorhom/bottom-sheet is NOT recommended** for this Expo 54 + Reanimated 4 setup. Using it creates a hard dependency on a library with known Expo 54 breakage. Custom implementation using already-installed dependencies has zero additional risk.
- **Facebook OAuth removal does not block** any other feature. It simplifies both Login and Register page migrations by reducing code to migrate.

---

## MVP Definition

This milestone is enhancing an existing production app — "MVP" means "what must be done to call this milestone complete."

### Launch With (This Milestone)

- [ ] `SupabaseAuthProvider` wired at root (`index.tsx`) — unblocks everything
- [ ] `App.tsx` `useAuth` import updated to `SupabaseAuthContext` — makes route guards work
- [ ] Login page migrated: swap Firebase auth calls for Supabase, remove Facebook OAuth, fix error messages
- [ ] Register page migrated: swap Firebase auth + Firestore calls for Supabase, remove Facebook OAuth, remove password-in-cookie security bug
- [ ] Profile page migrated: swap Firestore read/write for Supabase `profiles` table
- [ ] SavedEvents page migrated: swap Firestore collection queries for Supabase joined query
- [ ] Locations page migrated: swap Firestore query for Supabase events query
- [ ] SingleLocation page migrated: same as Locations
- [ ] Legacy `AuthContext.tsx` removed (or commented with TODO for cleanup once all callers confirmed migrated)
- [ ] Mobile: polished `TextInput` component with focus state, error state, label
- [ ] Mobile: polished `Button` component with press animation + haptics + loading state
- [ ] Mobile: polished custom bottom sheet with backdrop, snap points, handle

### Add After Validation (v1.x — next milestone)

- [ ] Migrate `Home.tsx`, `Community.tsx`, `EventDetails.tsx` from Firebase — these are the large pages not in current scope
- [ ] Migrate `EventCard` component from Firebase — dependent on test coverage first
- [ ] Migrate `CreateEventDialog` from Firebase — highest risk, needs tests first
- [ ] Remove Firebase SDK from `package.json` — only after ALL components migrated

### Future Consideration (v2+)

- [ ] Mobile app: actual TeamUp screens (events list, event detail, create event) — this milestone only polishes UI primitives
- [ ] Account deletion / GDPR compliance
- [ ] Rate limiting on auth endpoints
- [ ] Offline support for mobile

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Wire SupabaseAuthProvider at root | HIGH (unblocks all migration) | LOW (2 lines) | P1 |
| Login page migration | HIGH (auth entry point) | LOW | P1 |
| Register page migration | HIGH (auth entry point) | LOW | P1 |
| Profile page migration | HIGH (user data) | LOW | P1 |
| Remove password-in-cookie security bug | HIGH (security) | LOW (delete code) | P1 |
| SavedEvents page migration | MEDIUM | MEDIUM (join query) | P1 |
| Locations page migration | MEDIUM | MEDIUM | P1 |
| SingleLocation page migration | MEDIUM | MEDIUM | P1 |
| Mobile TextInput component | HIGH (form UX) | LOW | P1 |
| Mobile Button component | HIGH (all interactions) | LOW | P1 |
| Mobile bottom sheet | MEDIUM (contextual UX) | MEDIUM (custom impl) | P1 |
| Remove legacy AuthContext.tsx | MEDIUM (code health) | LOW | P2 |
| Haptic button feedback | MEDIUM (native feel) | LOW | P2 |
| Keyboard toolbar (Next/Done) | MEDIUM (form UX) | MEDIUM (new library) | P2 |
| Facebook OAuth removal | HIGH (reduce complexity) | LOW (delete code) | P1 — delete, not build |

---

## Competitor Feature Analysis

This analysis focuses on mobile app patterns from comparable sports social apps (e.g., Playtomic, Smashpoint, Padel Manager) rather than web competitors, since mobile polish is the dimension being improved.

| Feature | Playtomic (industry leader) | Smashpoint | TeamUp approach |
|---------|----------------------------|------------|-----------------|
| Input focus ring | Animated, lime/brand accent | Static border | Brand-accent focus ring, animated |
| Button feedback | Subtle scale + haptic | Opacity only | Scale 0.97 + medium haptic |
| Bottom sheets | iOS-native, snap points, full backdrop | Simple modal | Custom Reanimated 4 sheet, brand dark bg |
| Error states | Inline, icon + text | Toast only | Inline below field (safer, more accessible) |
| OAuth on mobile | Google + Apple | Google only | Google only (Facebook too complex for scope) |
| Password field | Toggle + strength meter | Toggle only | Toggle, no strength meter (defer) |

---

## Sources

- [Expo Keyboard Handling Guide](https://docs.expo.dev/guides/keyboard-handling/) — HIGH confidence (official docs)
- [React Native TextInput Docs](https://reactnative.dev/docs/textinput) — HIGH confidence (official)
- [Supabase Auth React Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) — HIGH confidence (official docs)
- [Supabase Firebase Auth Migration Guide](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth) — HIGH confidence (official docs)
- [gorhom/react-native-bottom-sheet GitHub Issue #2471](https://github.com/gorhom/react-native-bottom-sheet/issues/2471) — HIGH confidence (primary source bug report, Expo 54 TypeError)
- [gorhom/react-native-bottom-sheet v5 Release Post](https://gorhom.dev/react-native-bottom-sheet/blog/bottom-sheet-v5) — HIGH confidence (official release notes, Reanimated 3 requirement confirmed)
- [gorhom/react-native-bottom-sheet Issue #2528](https://github.com/gorhom/react-native-bottom-sheet/issues/2528) — MEDIUM confidence (user report, closed as invalid but pattern is consistent with #2471)
- [Reanimated Bottom Sheet Example](https://docs.swmansion.com/react-native-reanimated/examples/bottomsheet/) — HIGH confidence (official Software Mansion docs, demonstrates DIY approach)
- Codebase analysis of `src/pages/Login.tsx`, `Register.tsx`, `Profile.tsx`, `SavedEvents.tsx`, `Locations.tsx` — HIGH confidence (direct source review)
- Codebase analysis of `src/contexts/SupabaseAuthContext.tsx`, `src/index.tsx`, `src/App.tsx` — HIGH confidence (confirms SupabaseAuthProvider is unconnected at root)

---

*Feature research for: TeamUp mobile UI polish + Firebase-to-Supabase page migration*
*Researched: 2026-02-23*
