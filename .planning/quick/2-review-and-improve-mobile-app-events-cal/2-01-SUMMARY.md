---
phase: quick-2
plan: 01
subsystem: mobile-ui
tags: [ui-polish, icons, haptics, calendar, react-native]
dependency_graph:
  requires: []
  provides: [polished-calendar-tab]
  affects: [mobile/components/SportFilterChips.tsx, mobile/app/(tabs)/calendar.tsx]
tech_stack:
  added: [expo-haptics]
  patterns: [Ionicons vector icons, haptic feedback, press opacity, today dot indicator, month/year context label]
key_files:
  created: []
  modified:
    - mobile/components/SportFilterChips.tsx
    - mobile/app/(tabs)/calendar.tsx
decisions:
  - Used todayDotPlaceholder view (5x5 transparent) to maintain consistent dayButton height without conditional layout shifts
  - Used surfaceLight (#2A2A2A) for inactive chip background — clear contrast against #111111 background
  - Wrapped haptic call in handleSportSelect function rather than modifying SportFilterChips props contract
metrics:
  duration: ~8 min
  completed: 2026-02-24
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 2: Calendar Tab UI Polish Summary

**One-liner:** Calendar tab UI polished with Ionicons replacing emojis, surfaceLight chip contrast, month/year context label, today dot indicator, and haptic feedback on all interactive elements.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace emoji icons with Ionicons and improve chip contrast | c72989db | mobile/components/SportFilterChips.tsx |
| 2 | Enhance date picker with month context, today dot, and haptic feedback | ab5282e7 | mobile/app/(tabs)/calendar.tsx |

## Changes Made

### Task 1: SportFilterChips.tsx

- Replaced emoji strings in SPORTS array with Ionicons name strings (e.g., `'trophy-outline'`, `'football-outline'`, `'tennisball-outline'`, etc.)
- Added `import { Ionicons } from '@expo/vector-icons'`
- Replaced `<Text style={styles.chipIcon}>{item.icon}</Text>` with `<Ionicons name={item.icon} size={14} color={...} />`
- Icon color: `Colors.textOnPrimary` when active, `Colors.textSecondary` when inactive
- Changed inactive chip background from `Colors.darkGreenBorder` (#1D210D) to `Colors.surfaceLight` (#2A2A2A) — better contrast against the #111111 app background
- Added press opacity feedback via Pressable style function: `pressed && { opacity: 0.7 }`
- Removed unused `chipIcon` style

### Task 2: calendar.tsx

- Added `import * as Haptics from 'expo-haptics'`
- Added `Typography` to theme imports
- Added `monthYearLabel` derived from `selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })`
- Added month/year `<Text style={styles.monthLabel}>` between sport filters and date FlatList
- `monthLabel` style uses `Typography.captionSemibold` spread with `paddingHorizontal: Spacing.xl` and `marginBottom: Spacing.xs`
- Increased `dayButton` height from 64 to 70 to accommodate today dot
- Added `todayDot` view (5x5 green dot) rendered only when `isToday && !active`
- Added `todayDotPlaceholder` (5x5 transparent) for non-today dates to avoid layout shift
- Added `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` in `handleTabPress` before `setActiveTab`
- Extracted `handleSportSelect` callback that calls Haptics then `setSelectedSport`
- Added haptic call in day `onPress` handler before `setSelectedDate`
- Changed tab `Pressable` style to function: `({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]`
- Changed day button `Pressable` style to function: `({ pressed }) => [styles.dayButton, active && styles.dayButtonActive, pressed && { opacity: 0.7 }]`

## Decisions Made

1. **todayDotPlaceholder pattern:** Added a transparent 5x5 view as placeholder for non-today dates. This prevents the `justifyContent: 'center'` layout from shifting when the visible dot appears, maintaining stable day button dimensions.

2. **surfaceLight for inactive chips:** Changed from `darkGreenBorder` (#1D210D, nearly invisible against #111111) to `surfaceLight` (#2A2A2A) — a neutral dark gray that clearly distinguishes chips from the background without being distracting.

3. **handleSportSelect wrapper:** Rather than modifying the `SportFilterChips` component props contract to accept an onSelect that fires haptics internally, the haptic call was added at the calendar screen level via a `handleSportSelect` wrapper. This keeps the chips component stateless and reusable.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors in both modified files (`npx tsc --noEmit` passes)
- No emoji characters remain in SportFilterChips.tsx
- Ionicons import confirmed in SportFilterChips.tsx
- expo-haptics import confirmed in calendar.tsx
- Typography import confirmed in calendar.tsx
- All success criteria from plan met

## Self-Check: PASSED

Files verified:
- FOUND: mobile/components/SportFilterChips.tsx
- FOUND: mobile/app/(tabs)/calendar.tsx

Commits verified:
- FOUND: c72989db (feat(quick-2): replace emoji icons with Ionicons and improve chip contrast)
- FOUND: ab5282e7 (feat(quick-2): enhance date picker with month label, today dot, and haptic feedback)
