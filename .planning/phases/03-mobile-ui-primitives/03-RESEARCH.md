# Phase 3: Mobile UI Primitives - Research

**Researched:** 2026-02-23
**Domain:** React Native / Expo UI Component Library (Reanimated 4, expo-haptics, react-native-keyboard-controller)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOBILE-01 | Styled TextInput component with label, focus state, error state, and disabled state | React Native TextInput + useState(isFocused) + StyleSheet color-by-state pattern |
| MOBILE-02 | Primary Button variant with loading state and haptic feedback | Reanimated 4 Pressable + expo-haptics + withSpring scale + withRepeat spinner |
| MOBILE-03 | Secondary Button variant with loading state and haptic feedback | Same as MOBILE-02, different color scheme (outlined/ghost style) |
| MOBILE-04 | Custom bottom sheet component using Modal + Reanimated (not gorhom) | RN Modal transparent + useSharedValue/useAnimatedStyle + withSpring/withTiming |
| MOBILE-05 | Keyboard handling installed and configured via react-native-keyboard-controller | KeyboardProvider at root + KeyboardAwareScrollView on form screens |
| MOBILE-06 | All mobile UI components use consistent dark theme (#111111) with #C1FF2F accent | Update constants/theme.ts + use brand colors in all primitives |
| MOBILE-07 | Mobile UI components handle accessibility basics (labels, roles, hit targets) | accessibilityLabel, accessibilityRole="button", minHeight/minWidth 44 |
</phase_requirements>

---

## Summary

Phase 3 builds the foundational UI primitives for the TeamUp mobile app running on Expo 54 with React Native 0.81.5 and React 19.1. The project already has Reanimated 4.1.1 and react-native-worklets 0.5.1 installed, and the new architecture is enabled (`newArchEnabled: true` in app.json). This means all primitives can use the full Reanimated 4 API immediately without any migration overhead.

The three components to build — TextInput, Button, and BottomSheet — follow distinct implementation patterns. TextInput uses React state for focus/error/disabled management with StyleSheet-based color-by-state logic. Buttons use Reanimated 4's `useSharedValue` + `useAnimatedStyle` + `withSpring` for press-scale animation, and expo-haptics (already installed) for tactile feedback. The BottomSheet uses React Native's built-in `Modal` with `transparent={true}` combined with Reanimated for the slide-in/out animation — not gorhom, which is explicitly excluded per requirements due to Expo 54 + Reanimated 4 compatibility issues.

One package is not yet installed and needs to be added: `react-native-keyboard-controller`. This requires a development build (not Expo Go) and a `KeyboardProvider` wrapper at the root layout. The existing `constants/theme.ts` must be updated to include TeamUp brand colors (#111111 background, #C1FF2F accent) replacing the current default Expo scaffold colors.

**Primary recommendation:** Build all three primitives as named exports in `mobile/teamup/components/ui/` following the existing project structure. Update theme constants first, then build TextInput, Button (shared logic), and BottomSheet. Add keyboard-controller last as it requires a native rebuild.

---

## Standard Stack

### Core (already installed in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | ~4.1.1 | Button scale animation, BottomSheet slide | Only animation lib for 60/120fps on UI thread; new architecture required |
| react-native-worklets | 0.5.1 | Worklets runtime (peer dep of Reanimated 4) | Required peer dep; babel plugin changed from reanimated to worklets |
| expo-haptics | ~15.0.8 | Tactile feedback on button press | Already installed; standard Expo haptics API |
| react-native-gesture-handler | ~2.28.0 | Gesture detection for BottomSheet (pan to dismiss) | Already installed; required for Reanimated gesture integration |
| react-native-safe-area-context | ~5.6.0 | Safe area insets for BottomSheet positioning | Already installed |

### Needs Installation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-keyboard-controller | latest | Cross-platform keyboard avoidance on form screens | Required for MOBILE-05; must be installed before native rebuild |

**Installation for keyboard-controller:**
```bash
cd mobile/teamup
npx expo install react-native-keyboard-controller
# Then rebuild native app (requires dev build, not Expo Go)
npx expo run:ios   # or run:android
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Modal BottomSheet | @gorhom/bottom-sheet | gorhom is EXPLICITLY excluded — broken on Expo 54 + Reanimated 4 per REQUIREMENTS.md |
| expo-haptics | react-native-haptic-feedback | expo-haptics already installed and covers all needed feedback types |
| react-native-keyboard-controller | KeyboardAvoidingView (RN built-in) | Built-in behaves differently on iOS vs Android, unreliable; keyboard-controller solves this cross-platform |
| StyleSheet color-by-state | NativeWind/Tailwind | NativeWind excluded per REQUIREMENTS.md — conflicts with Reanimated v4 |

---

## Architecture Patterns

### Recommended Project Structure

```
mobile/teamup/
├── components/
│   ├── ui/                    # New primitives go here (follows existing convention)
│   │   ├── text-input.tsx     # MOBILE-01
│   │   ├── button.tsx         # MOBILE-02 + MOBILE-03 (variants via prop)
│   │   └── bottom-sheet.tsx   # MOBILE-04
│   ├── haptic-tab.tsx         # Existing
│   ├── themed-text.tsx        # Existing
│   └── themed-view.tsx        # Existing
├── constants/
│   └── theme.ts               # UPDATE: add brand colors (#111111, #C1FF2F)
└── app/
    └── _layout.tsx            # UPDATE: add KeyboardProvider wrapper
```

### Pattern 1: TextInput with Color-by-State

**What:** A wrapper around RN's `TextInput` that manages focus/error/disabled visuals using a `colorByState` lookup object and React `useState`.
**When to use:** All form fields in the mobile app.

```typescript
// Source: React Native docs + verified pattern from search
import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, StyleSheet } from 'react-native';

type InputState = 'default' | 'focused' | 'error' | 'disabled';

const BORDER_COLOR: Record<InputState, string> = {
  default:  '#333333',
  focused:  '#C1FF2F',   // brand accent
  error:    '#FF4D4F',
  disabled: '#222222',
};

const LABEL_COLOR: Record<InputState, string> = {
  default:  '#888888',
  focused:  '#C1FF2F',
  error:    '#FF4D4F',
  disabled: '#444444',
};

interface AppTextInputProps {
  label: string;
  error?: string;
  disabled?: boolean;
  // + all RNTextInput props
}

export function AppTextInput({ label, error, disabled = false, ...rest }: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  const state: InputState = disabled ? 'disabled' : error ? 'error' : focused ? 'focused' : 'default';

  return (
    <View>
      <Text
        style={[styles.label, { color: LABEL_COLOR[state] }]}
        accessibilityElementsHidden  // label announced via accessibilityLabel on input
      >
        {label}
      </Text>
      <RNTextInput
        style={[styles.input, { borderColor: BORDER_COLOR[state] }]}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        placeholderTextColor="#555555"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  error: { fontSize: 12, color: '#FF4D4F', marginTop: 4 },
});
```

### Pattern 2: Animated Button with Reanimated 4

**What:** Pressable wrapped in `Animated.View` for scale-on-press. expo-haptics fires on `onPressIn`. Loading state shows rotating spinner via `withRepeat`.
**When to use:** All primary and secondary CTAs in the mobile app.

```typescript
// Source: Verified against brainsandbeards.com 2025 + Reanimated 4 official docs
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Pressable, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function AppButton({ label, onPress, variant = 'primary', loading = false, disabled = false }: AppButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPressIn={(!disabled && !loading) ? handlePressIn : undefined}
      onPressOut={(!disabled && !loading) ? handlePressOut : undefined}
      onPress={(!disabled && !loading) ? onPress : undefined}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={{ minHeight: 44 }}   // MOBILE-07 hit target
    >
      <Animated.View style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabledOpacity,
        animatedStyle,
      ]}>
        {loading
          ? <ActivityIndicator color={isPrimary ? '#111111' : '#C1FF2F'} />
          : <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>{label}</Text>
        }
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: { backgroundColor: '#C1FF2F' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#C1FF2F' },
  disabledOpacity: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600' },
  labelPrimary: { color: '#111111' },
  labelSecondary: { color: '#C1FF2F' },
});
```

### Pattern 3: Custom Bottom Sheet with Modal + Reanimated

**What:** React Native `Modal` with `transparent={true}` and `animationType="none"`. Animation is handled entirely by Reanimated `useSharedValue` + `useAnimatedStyle` with `withSpring`. The sheet slides up from the bottom. A dark semi-transparent backdrop is an `Animated.View` with opacity animation.
**When to use:** Any sheet-style overlay (action menus, pickers, confirmations).

**Critical constraint from REQUIREMENTS.md:** gorhom/bottom-sheet is NOT used because it is broken on Expo 54 + Reanimated 4.

```typescript
// Source: Pattern derived from RN Modal docs + Reanimated official bottom sheet example
// Uses Modal (no gorhom) as required by MOBILE-04
import React, { useEffect } from 'react';
import { Modal, Pressable, View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  snapHeight?: number;  // default 300
}

export function BottomSheet({ visible, onDismiss, children, snapHeight = 300 }: BottomSheetProps) {
  const translateY = useSharedValue(snapHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withSpring(snapHeight, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { height: snapHeight }, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C1FF2F',  // brand accent handle per success criteria
  },
});
```

### Pattern 4: KeyboardProvider Setup

**What:** Wrap `RootLayout` in `KeyboardProvider` from react-native-keyboard-controller. Use `KeyboardAwareScrollView` on each form screen.
**When to use:** After installing react-native-keyboard-controller and rebuilding native.

```typescript
// Source: kirillzyusko.github.io/react-native-keyboard-controller/docs/installation
import { KeyboardProvider } from 'react-native-keyboard-controller';

// In mobile/teamup/app/_layout.tsx:
export default function RootLayout() {
  return (
    <KeyboardProvider>
      <ThemeProvider ...>
        <Stack>...</Stack>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

// In any form screen:
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function LoginScreen() {
  return (
    <KeyboardAwareScrollView bottomOffset={50} contentContainerStyle={{ padding: 24 }}>
      <AppTextInput label="Email" ... />
      <AppTextInput label="Password" secureTextEntry ... />
      <AppButton label="Sign In" onPress={...} />
    </KeyboardAwareScrollView>
  );
}
```

### Pattern 5: Theme Constants Update

**What:** `constants/theme.ts` currently uses default Expo scaffold colors. Must add TeamUp brand tokens.

```typescript
// Add to constants/theme.ts
export const Brand = {
  accent: '#C1FF2F',           // lime green primary accent
  accentDark: '#111111',       // text on accent
  background: '#111111',       // app background
  surface: '#1E1E1E',          // card/input surface
  border: '#333333',           // default border
  borderFocused: '#C1FF2F',    // focused input border
  borderError: '#FF4D4F',      // error border
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textDisabled: '#444444',
} as const;
```

### Anti-Patterns to Avoid

- **Using gorhom/bottom-sheet:** Broken on Expo 54 + Reanimated 4. Use the Modal pattern above.
- **Using `animationType="slide"` on Modal for BottomSheet:** This offloads animation to native, bypassing Reanimated control. Use `animationType="none"` and drive animation via Reanimated.
- **Mutating shared values in `useAnimatedStyle` callback:** Causes infinite loops. Only READ shared values in useAnimatedStyle, WRITE in event handlers or useEffect.
- **Using `runOnJS` (Reanimated 3 API) in Reanimated 4:** API renamed to `scheduleOnRN` in Reanimated 4. Check the migration table.
- **Calling `Haptics.impactAsync()` inside `useAnimatedStyle`:** Haptics must be called on JS thread, not UI thread. Call in `onPressIn` callback, never inside worklets.
- **Setting minHeight only via hitSlop:** Per React Native AMA guidelines, prefer `minHeight: 44` on the element itself so the hit area cannot be clipped by parent. Use both.
- **NativeWind/Tailwind for styling:** Explicitly excluded per REQUIREMENTS.md — conflicts with Reanimated v4 on this project.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard avoiding on forms | Custom scroll-with-keyboard-offset logic | `KeyboardAwareScrollView` from react-native-keyboard-controller | Platform-specific edge cases are numerous; library handles iOS SafeArea, Android windowSoftInputMode, resize vs pan |
| Haptic patterns | `setTimeout` + Vibration API chains | `expo-haptics` (already installed) | Platform-optimized, iOS Core Haptics vs Android Vibrator handled transparently |
| Bottom sheet animation timing | Manual `Animated.timing` with hardcoded ms | `withSpring` from Reanimated 4 | Spring physics feel more natural; duration is automatic based on velocity |
| Loading spinner in button | Custom rotating view | `ActivityIndicator` from react-native | Native spinner matches platform conventions; zero custom code needed for basic loading |

**Key insight:** The "don't hand-roll" area in mobile UI is primarily keyboard handling — it's easy to get 80% right with built-in `KeyboardAvoidingView` but the remaining 20% (Android pan mode, SafeArea interaction, autocomplete toolbar height) requires the `react-native-keyboard-controller` library.

---

## Common Pitfalls

### Pitfall 1: Reanimated 4 Babel Plugin Change
**What goes wrong:** If `babel.config.js` still uses `react-native-reanimated/plugin`, worklets may silently fail or the app won't build.
**Why it happens:** Reanimated 4 moved worklet functionality to `react-native-worklets`. The babel plugin moved with it.
**How to avoid:** The project has no `babel.config.js` in the mobile directory — Expo SDK 50+ includes the worklets plugin automatically. However, if one is created, it MUST use `'react-native-worklets/plugin'`, not `'react-native-reanimated/plugin'`.
**Warning signs:** Metro bundler errors about worklet transformation; animated values not updating on UI thread.

### Pitfall 2: gorhom/bottom-sheet Reanimated 4 Incompatibility
**What goes wrong:** App crashes or bottom sheet fails to animate.
**Why it happens:** gorhom v5 was written for Reanimated v3. The API for worklets changed in v4.
**How to avoid:** Already addressed in requirements — use Modal + custom Reanimated implementation. Do not add @gorhom/bottom-sheet as a dependency.
**Warning signs:** This is a known documented issue in REQUIREMENTS.md.

### Pitfall 3: Modal `visible` Prop Animation Timing
**What goes wrong:** Sheet animates out but then the Modal disappears instantly, causing a flash.
**Why it happens:** Setting `visible={false}` immediately unmounts the Modal, cutting off the exit animation.
**How to avoid:** Keep a separate `isVisible` state for the Modal that only becomes false AFTER the exit animation completes. Use `runOnJS` (or `scheduleOnRN` in Reanimated 4) to call a `setModalVisible(false)` callback from inside the animation's completion callback.

```typescript
// Correct pattern: delay Modal unmount until animation finishes
const handleDismiss = () => {
  translateY.value = withSpring(snapHeight, {}, (finished) => {
    if (finished) runOnJS(setModalVisible)(false);
  });
  backdropOpacity.value = withTiming(0, { duration: 200 });
};
```

**Note:** `runOnJS` is still available in Reanimated 4 for backward compat (it's `scheduleOnRN` internally). Verify in the version pinned to this project.

### Pitfall 4: TextInput `placeholder` Overrides `accessibilityLabel` on Android
**What goes wrong:** Screen reader reads the placeholder text instead of the accessibilityLabel.
**Why it happens:** Known React Native bug — placeholder text intercepts TalkBack on some Android versions.
**How to avoid:** Always set both `accessibilityLabel={label}` AND `placeholder={placeholder}` explicitly. Do not rely on placeholder alone for screen reader description.
**Warning signs:** TalkBack announces "Edit box" instead of the field name.

### Pitfall 5: Haptics on Web / Expo Web
**What goes wrong:** `expo-haptics` throws or silently fails in Expo web environment.
**Why it happens:** Web vibration API is limited; expo-haptics wraps it but not all methods are supported.
**How to avoid:** The project is mobile-only, but if any component is web-rendered, guard with `import { Platform } from 'react-native'; if (Platform.OS !== 'web')`.

### Pitfall 6: KeyboardProvider vs Expo Go
**What goes wrong:** react-native-keyboard-controller does not work in Expo Go.
**Why it happens:** Requires native module that isn't bundled in Expo Go.
**How to avoid:** A development build is required (`npx expo run:ios` / `npx expo run:android`). This is expected — the mobile app already uses expo-router which works with dev builds.

### Pitfall 7: `withSpring` Behavior Change in Reanimated 4
**What goes wrong:** Animations feel faster/different than expected when porting Reanimated 3 examples.
**Why it happens:** Reanimated 4 changed the default `energyThreshold` parameter for withSpring, effectively making animations ~1.5x shorter. For equivalent duration, multiply by 1.5.
**How to avoid:** Use physics-based `damping` and `stiffness` parameters rather than `duration`. Recommended for button: `{ damping: 15, stiffness: 300 }`.

---

## Code Examples

Verified patterns from official sources:

### expo-haptics — Button Press Feedback
```typescript
// Source: docs.expo.dev/versions/latest/sdk/haptics/
import * as Haptics from 'expo-haptics';

// Light tap — for primary button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium — for secondary or destructive actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Success notification — for form submit confirmation
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

### KeyboardAwareScrollView — Form Screen Wrapper
```typescript
// Source: kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-aware-scroll-view
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

<KeyboardAwareScrollView
  bottomOffset={50}              // gap between focused input and keyboard
  contentContainerStyle={{ padding: 24 }}
>
  {/* form fields */}
</KeyboardAwareScrollView>
```

### Reanimated 4 — Scale Animation (Verified Pattern)
```typescript
// Source: docs.swmansion.com/react-native-reanimated + brainsandbeards.com 2025
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

// On press in:
scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });

// On press out:
scale.value = withSpring(1, { damping: 15, stiffness: 300 });
```

### Reanimated 4 — Loading Spinner Rotation
```typescript
// Source: brainsandbeards.com 2025 verified
import { withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

const rotation = useSharedValue(0);

// Start spinning:
rotation.value = withRepeat(
  withTiming(360, { duration: 1000, easing: Easing.linear }),
  -1  // infinite
);

// Stop:
rotation.value = withTiming(0);

// In animatedStyle:
const spinnerStyle = useAnimatedStyle(() => ({
  transform: [{ rotate: `${rotation.value}deg` }],
}));
```

### Accessibility — Button and Input Minimum Requirements
```typescript
// Source: reactnative.dev/docs/accessibility + nearform.com/open-source/react-native-ama
// Buttons: role + label + 44pt minimum
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Sign In"
  accessibilityState={{ disabled: isDisabled, busy: isLoading }}
  style={{ minHeight: 44, minWidth: 44 }}  // 44pt Apple HIG minimum
>

// TextInput: label association
<TextInput
  accessibilityLabel="Email address"
  accessibilityState={{ disabled: isDisabled }}
  placeholder="you@example.com"
  placeholderTextColor="#555555"
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-native-reanimated/plugin` in babel.config | `react-native-worklets/plugin` | Reanimated 4.0 stable | Must update babel config if manually set (Expo SDK 50+ handles automatically) |
| `runOnJS(fn)` syntax | `scheduleOnRN(fn)` (runOnJS still works in 4.x compat layer) | Reanimated 4.0 | runOnJS still functional; scheduleOnRN is the canonical new name |
| `useAnimatedGestureHandler` | `Gesture.Pan()` from gesture-handler | Reanimated 3/4 | useAnimatedGestureHandler removed in Reanimated 4 |
| `gorhom/bottom-sheet` | Custom Modal + Reanimated | Expo 54 + Reanimated 4 | gorhom broken in this combination — custom implementation required |
| `KeyboardAvoidingView` (built-in) | `react-native-keyboard-controller` | ~2023 onward | Better cross-platform; consistent behavior iOS + Android |
| Legacy Architecture | New Architecture (Fabric) | Expo SDK 53+ default | Reanimated 4 requires New Architecture; already enabled in this project |

**Deprecated/outdated:**
- `useAnimatedGestureHandler`: Removed in Reanimated 4 — use `Gesture` API from gesture-handler
- `addWhitelistedNativeProps` / `addWhitelistedUIProps`: Removed in Reanimated 4
- `gorhom/bottom-sheet` (in this project context): Incompatible with Expo 54 + Reanimated 4

---

## Open Questions

1. **Does Expo SDK 54's bundled worklets plugin auto-configure for Reanimated 4?**
   - What we know: Expo SDK 50+ includes worklets plugin automatically for Expo projects. The project has `react-native-worklets 0.5.1` installed.
   - What's unclear: Whether the auto-include in Expo SDK 54 uses the correct `react-native-worklets/plugin` vs the old `react-native-reanimated/plugin`.
   - Recommendation: Test a minimal Reanimated animation on first task. If worklets fail, add `babel.config.js` with `plugins: ['react-native-worklets/plugin']`.

2. **KeyboardProvider placement in Expo Router _layout.tsx**
   - What we know: KeyboardProvider must wrap the whole app. The current `_layout.tsx` has `ThemeProvider` as the outermost provider.
   - What's unclear: Whether KeyboardProvider should be inside or outside ThemeProvider — the library docs don't specify nesting order.
   - Recommendation: Place KeyboardProvider as the outermost wrapper (wrap ThemeProvider). Order: `KeyboardProvider > ThemeProvider > Stack`.

3. **BottomSheet safe area insets on iOS**
   - What we know: The bottom sheet's `paddingBottom` should account for home indicator on iPhone X+. The project has `react-native-safe-area-context` installed.
   - What's unclear: Whether `useSafeAreaInsets().bottom` should be added to the sheet's paddingBottom or if the Modal handles this natively.
   - Recommendation: Use `const { bottom } = useSafeAreaInsets()` and add to sheet's `paddingBottom`. This is the standard pattern.

---

## Sources

### Primary (HIGH confidence)
- `docs.swmansion.com/react-native-reanimated/` — Reanimated 4 homepage, current version, major features
- `docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/` — Breaking changes and API renames for Reanimated 4
- `docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/` — Installation, babel plugin requirement
- `docs.expo.dev/versions/latest/sdk/haptics/` — expo-haptics API, ImpactFeedbackStyle values
- `kirillzyusko.github.io/react-native-keyboard-controller/docs/installation` — Installation steps and KeyboardProvider setup
- `kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-aware-scroll-view` — KeyboardAwareScrollView full API
- `reactnative.dev/docs/accessibility` — Accessibility props, accessibilityRole, accessibilityState
- `reactnative.dev/docs/modal` — Modal component API (transparent, animationType)
- Project files: `mobile/teamup/package.json`, `mobile/teamup/app.json`, `mobile/teamup/constants/theme.ts`, `mobile/teamup/app/_layout.tsx`

### Secondary (MEDIUM confidence)
- `brainsandbeards.com/blog/2025-buttons/` — Full animated button component code (2025, verified against Reanimated docs)
- `reactiive.io/articles/bottom-sheet-animation` — Bottom sheet pan gesture implementation with Reanimated
- `docs.expo.dev/versions/latest/sdk/keyboard-controller/` — Expo keyboard-controller installation guide
- `nearform.com/open-source/react-native-ama/guidelines/minimum-size/` — 44pt minimum touch target guideline

### Tertiary (LOW confidence)
- WebSearch results on Reanimated 4 ecosystem patterns — confirmed against official docs where possible

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Verified against project's own package.json and official library docs
- Architecture: HIGH — Verified patterns from official Reanimated docs and 2025 source
- Pitfalls: MEDIUM — Reanimated 4 migration pitfalls from official migration guide; Modal animation timing from community patterns (not officially documented edge case)
- Keyboard controller: MEDIUM — Official docs confirmed setup; Expo 54 specific behavior not fully documented

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days — Reanimated 4 is stable; keyboard-controller is stable)
