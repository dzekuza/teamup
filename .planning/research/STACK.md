# Stack Research

**Domain:** React Native Expo mobile UI components + Firebase-to-Supabase web migration
**Researched:** 2026-02-23
**Confidence:** MEDIUM-HIGH (core stack verified via official docs; gorhom bottom sheet compatibility flagged as LOW confidence due to active SDK 54 breakage issues)

---

## Recommended Stack

### Core Technologies (Web — already in place, confirm versions)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @supabase/supabase-js | ^2.97.0 | Auth + database client | Already installed at correct version; v2 is the current stable major. All async auth methods, typed client via `Database` generic, and `onAuthStateChange` subscription pattern are production-ready. No version change needed. |
| React | 18.2 | UI framework | Already in use. Migration work is additive — no framework change. |
| TypeScript | (existing) | Type safety | Supabase client is fully typed via generated `Database` type in `src/types/supabase.ts`. Use it everywhere. |

### Core Technologies (Mobile — React Native Expo)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo | ~54.0.33 | SDK + build toolchain | Already installed. SDK 54 includes React Native 0.81 + React 19.1. Do not upgrade mid-milestone — SDK upgrades require native rebuild. |
| expo-router | ~6.0.23 | File-based routing | Already installed. v6 is the current SDK-54-compatible version. Provides typed routes, Expo Go support, tab + modal navigation primitives. |
| react-native-reanimated | ~4.1.1 | Animation engine | Already installed. Reanimated v4 is SDK 54's bundled version. Worklets are now a separate peer dep (`react-native-worklets`). Do NOT mix with Reanimated v3 in the same project. |
| react-native-gesture-handler | ~2.28.0 | Touch gesture system | Already installed. Required peer dep for animated interactions and sheets. Must be imported at the top of entry point (`app/_layout.tsx`). |
| react-native-safe-area-context | ~5.6.0 | Safe area insets | Already installed. Required for any layout that must avoid notches/home bars. Use `useSafeAreaInsets()` in custom components, not `SafeAreaView` from core RN (deprecated). |
| react-native-keyboard-controller | ^1.20.0 | Keyboard avoidance | Expo-recommended library for complex keyboard handling. Added to Expo Go in SDK 54. Use `KeyboardAwareScrollView` + `KeyboardToolbar` for form screens. Replaces the unreliable `KeyboardAvoidingView` + platform hacks pattern. |

### Supporting Libraries (Mobile)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-keyboard-controller | ^1.20.0 | `KeyboardAwareScrollView`, `KeyboardToolbar` | All login/register/form screens where keyboard can cover inputs. Install via `npx expo install react-native-keyboard-controller`. |
| expo-haptics | ~15.0.8 | Haptic feedback on button press | Already installed. Use on primary action buttons (`Haptics.impactAsync(ImpactFeedbackStyle.Medium)`). Small detail that makes UX feel native. |
| @expo/vector-icons | ^15.0.3 | Icon set | Already installed. Use `Ionicons` or `MaterialIcons` — both are bundled. Do not add a separate icon library. |
| react-native-safe-area-context | ~5.6.0 | `useSafeAreaInsets()` | Already installed. Wrap root in `SafeAreaProvider`, then use the hook in components that need inset-aware padding. |

### Supporting Libraries (Web — Supabase migration)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.97.0 | Auth + DB client | Already installed. Import `supabase` from `src/lib/supabase.ts` — never re-initialize. |
| supabase (existing hooks) | — | `useSupabaseAuth`, `useSupabaseEvents` | Use these hooks directly. They already implement correct `onAuthStateChange` + `getSession()` + subscription cleanup patterns. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@gorhom/bottom-sheet` v5 with Expo SDK 54 | Active breakage with Reanimated v4 on SDK 54. Multiple open bugs: bottom sheet won't open, crashes on close, `TypeError: Cannot read property 'level' of undefined`. Maintainer has not released a confirmed fix as of Feb 2026. **LOW confidence this will work.** | Build a custom modal sheet using `react-native-reanimated` shared values + `react-native-gesture-handler` pan gesture, or use React Native's built-in `Modal` component with animated translate transforms. For this milestone's scope (UI polish), a simple `Modal`-based sheet is sufficient and has zero compatibility risk. |
| `KeyboardAvoidingView` (React Native core) | Platform-specific `behavior` prop behaves differently on iOS vs Android. Requires manual `keyboardVerticalOffset` tuning per screen. Not reliable for forms with multiple inputs. | `react-native-keyboard-controller` `KeyboardAwareScrollView` — Expo officially recommends it, works in Expo Go since SDK 54. |
| `TouchableOpacity` / `TouchableHighlight` | Legacy Touchable* family is on a deprecation path in React Native's roadmap. Less flexible than `Pressable`. | `Pressable` — the React Native core recommendation since RN 0.64+. Use `style={({ pressed }) => [styles.button, pressed && styles.pressed]}` for press feedback. |
| `SafeAreaView` from `react-native` | Deprecated in Expo SDK 54. Does not handle all device insets reliably. | `SafeAreaView` from `react-native-safe-area-context` or `useSafeAreaInsets()` hook for custom layouts. |
| NativeWind v4/v5 (new install) | NativeWind v4 requires patching for Reanimated v4 compat. NativeWind v5 is still in active development and unstable. The mobile app does not currently use NativeWind — introducing it mid-project adds non-trivial configuration risk (babel, metro, tailwind config). | Style with React Native's `StyleSheet.create()` for new components. The app's brand colors (`#C1FF2F`, `#111111`, `#1E1E1E`) can be defined as constants. Consistent theming is achievable without Tailwind on mobile. |
| Firebase SDK in migrated web files | Dual auth/firestore coexistence creates confusion about which context is source of truth. Build warnings, bundle bloat. | `supabase` client from `src/lib/supabase.ts` + existing Supabase hooks. |
| Re-initializing Supabase client per component | Creates multiple GoTrue auth instances, breaks `onAuthStateChange` singleton behavior. | Import the singleton `supabase` from `src/lib/supabase.ts` in every component that needs it. |

---

## Migration Patterns (Web: Firebase → Supabase)

These are the concrete API substitutions verified against Supabase JS v2.97.0 official docs.

### Auth Substitutions

| Firebase (old) | Supabase (new) | Notes |
|----------------|----------------|-------|
| `signInWithEmailAndPassword(auth, email, pw)` | `supabase.auth.signInWithPassword({ email, password })` | Returns `{ data, error }` — destructure and throw on error |
| `createUserWithEmailAndPassword(auth, email, pw)` | `supabase.auth.signUp({ email, password, options: { data: {...} } })` | Metadata in `options.data` maps to `raw_user_meta_data` |
| `signInWithPopup(auth, googleProvider)` | `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` | Web uses redirect flow (not popup). `redirectTo: window.location.origin` already in `useSupabaseAuth`. |
| `auth.onAuthStateChanged(cb)` | `supabase.auth.onAuthStateChange((event, session) => {})` | Returns `{ data: { subscription } }` — call `subscription.unsubscribe()` in cleanup |
| `auth.currentUser` | `supabase.auth.getUser()` or read from context | Prefer context (`useAuth()` → Supabase version) |
| `signOut(auth)` | `supabase.auth.signOut()` | Same shape |

### Firestore Substitutions

| Firebase (old) | Supabase (new) | Notes |
|----------------|----------------|-------|
| `getDoc(doc(db, 'profiles', uid))` | `supabase.from('profiles').select('*').eq('id', uid).single()` | `.single()` throws if 0 or >1 rows |
| `setDoc(doc(db, 'profiles', uid), data)` | `supabase.from('profiles').upsert({ id: uid, ...data })` | Upsert on primary key |
| `updateDoc(doc(db, 'profiles', uid), data)` | `supabase.from('profiles').update(data).eq('id', uid)` | Always chain `.eq()` filter |
| `getDocs(collection(db, 'saved_events').where('userId', '==', uid))` | `supabase.from('saved_events').select('*').eq('user_id', uid)` | PostgreSQL column naming is snake_case |
| `arrayUnion(value)` in `updateDoc` | Insert into junction table (`event_players`, `memory_likes`, etc.) | Arrays are normalized to tables in the Supabase schema |
| `deleteDoc(doc(db, 'saved_events', id))` | `supabase.from('saved_events').delete().eq('id', id)` | Always chain `.eq()` — no accidental full table deletes |
| `onSnapshot(query, cb)` | `supabase.from('table').select().then()` + Realtime channel | For this milestone, Realtime is not needed in the 6 pages being migrated — plain `select()` is sufficient |

### Storage Substitutions

| Firebase (old) | Supabase (new) | Notes |
|----------------|----------------|-------|
| `ref(storage, path)` + `uploadBytes()` + `getDownloadURL()` | `supabase.storage.from('bucket').upload(path, file)` then `.getPublicUrl(path)` | Buckets: `avatars`, `event-covers`, `memory-images` — already created |

---

## Auth Context Wiring (Web)

The existing `SupabaseAuthContext.tsx` is the correct provider. The task is to wire it at root:

```typescript
// src/index.tsx — required change
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

root.render(
  <SupabaseAuthProvider>
    <App />
  </SupabaseAuthProvider>
);
```

After wiring, any component using `useAuth()` must be updated to import from `useSupabaseAuth` (or the context's export) rather than the legacy Firebase `AuthContext`.

The `onAuthStateChange` + `getSession()` pattern already in `useSupabaseAuth.ts` is correct per official Supabase docs. Do not rewrite it.

---

## Mobile UI Component Patterns

### TextInput
```typescript
// Do this — typed keyboard, ref for next-field focus
import { TextInput, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

<KeyboardAwareScrollView>
  <TextInput
    style={styles.input}
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    returnKeyType="next"
    onSubmitEditing={() => passwordRef.current?.focus()}
    placeholder="Email"
    placeholderTextColor="#666"
  />
</KeyboardAwareScrollView>
```

### Button
```typescript
// Do this — Pressable with visual press feedback
import { Pressable, Text, StyleSheet } from 'react-native';

<Pressable
  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
  onPress={onPress}
  disabled={isLoading}
>
  <Text style={styles.buttonText}>{isLoading ? 'Loading...' : 'Sign In'}</Text>
</Pressable>

const styles = StyleSheet.create({
  button: { backgroundColor: '#C1FF2F', borderRadius: 12, paddingVertical: 14 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#111111', fontWeight: '700', textAlign: 'center' },
});
```

### Bottom Sheet / Modal
```typescript
// Do this — built-in Modal with Reanimated-driven translateY
// Avoids @gorhom/bottom-sheet Expo SDK 54 compat issues entirely
import { Modal, View, Animated } from 'react-native';
// Or: use a simple conditional render with absolute positioning and opacity animation
```

---

## Version Compatibility Notes

| Package | Version in Use | Compatibility Risk |
|---------|---------------|-------------------|
| expo | ~54.0.33 | HIGH compat with all SDK-54-pinned deps via `npx expo install` |
| react-native-reanimated | ~4.1.1 | Reanimated v4 only works with New Architecture (enabled by default in SDK 54) |
| react-native-worklets | 0.5.1 | Must match what Reanimated v4 expects — already installed in package.json |
| @gorhom/bottom-sheet | NOT installed | Do not install until SDK 54 compat confirmed upstream |
| react-native-keyboard-controller | not yet installed | Install with `npx expo install` to get SDK-54-compatible version |
| @supabase/supabase-js | ^2.97.0 | Current stable; no upgrade needed |
| firebase | ^10.14.1 | Keep in package.json until ALL components migrated (EventCard, CreateEventDialog, Home, Community, EventDetails still use it) |

---

## Installation Commands

```bash
# Mobile: keyboard handling (in mobile/teamup/)
npx expo install react-native-keyboard-controller

# Web: no new dependencies needed for Supabase migration
# All required packages already present at correct versions
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Custom `Modal`-based sheet (React Native core) | `@gorhom/bottom-sheet` v5 | Use gorhom only after they release confirmed SDK 54 + Reanimated v4 support. Monitor issue #2528 on their GitHub. |
| `react-native-keyboard-controller` | `KeyboardAvoidingView` (core RN) | Use core `KeyboardAvoidingView` only for single-input screens where cross-platform quirks are acceptable (e.g., a simple search bar). |
| `Pressable` | `TouchableOpacity` | `TouchableOpacity` is fine for simple cases if already in the codebase — no need to replace existing usage. Apply `Pressable` only to new buttons being built. |
| `useSupabaseAuth` (existing hook) | Re-implementing auth from scratch | Never re-implement — the hook already correctly implements the `getSession()` + `onAuthStateChange` + cleanup pattern per official docs. |

---

## Sources

- Expo SDK 54 Changelog — https://expo.dev/changelog/sdk-54 (React Native 0.81, React 19.1, Reanimated v4 bundled) — HIGH confidence
- Expo Keyboard Handling Guide — https://docs.expo.dev/guides/keyboard-handling/ (`react-native-keyboard-controller` official recommendation) — HIGH confidence
- Supabase JS auth reference — https://supabase.com/docs/reference/javascript/auth-signinwithpassword — HIGH confidence
- Supabase Firebase Auth migration guide — https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth — HIGH confidence
- @gorhom/bottom-sheet GitHub issues #2471, #2476, #2507, #2528 — SDK 54 + Reanimated v4 breakage — HIGH confidence (multiple confirmed reports, no fix as of research date)
- Reanimated v4 docs — https://docs.swmansion.com/react-native-reanimated/examples/bottomsheet/ (recommends gorhom, confirms no built-in sheet) — HIGH confidence
- React Native Pressable recommendation — https://reactnative.dev/docs/pressable (official RN docs) — HIGH confidence
- NativeWind v4 + SDK 54 setup — multiple Medium articles + GitHub discussions — MEDIUM confidence (compatible but requires babel config care; not recommended for new install mid-project)
- npm @supabase/supabase-js — version 2.97.0 confirmed as latest stable — HIGH confidence

---

*Stack research for: TeamUp mobile UI + Firebase-to-Supabase migration*
*Researched: 2026-02-23*
