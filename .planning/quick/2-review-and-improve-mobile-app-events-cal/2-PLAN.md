---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - mobile/components/SportFilterChips.tsx
  - mobile/app/(tabs)/calendar.tsx
autonomous: true
requirements: [UIUX-CHIPS, UIUX-DATEPICKER, UIUX-TABS]

must_haves:
  truths:
    - "Sport filter chips show consistent vector icons instead of emojis"
    - "Inactive sport chips are visually distinguishable from the background"
    - "Date picker displays month/year context above the day strip"
    - "Today has a dot indicator when not selected"
    - "Pressing chips, day buttons, and tabs provides visual and haptic feedback"
  artifacts:
    - path: "mobile/components/SportFilterChips.tsx"
      provides: "Sport filter chips with Ionicons and improved contrast"
      contains: "Ionicons"
    - path: "mobile/app/(tabs)/calendar.tsx"
      provides: "Calendar with month label, today dot, haptic feedback"
      contains: "expo-haptics"
  key_links:
    - from: "mobile/components/SportFilterChips.tsx"
      to: "@expo/vector-icons"
      via: "Ionicons import"
      pattern: "import.*Ionicons.*@expo/vector-icons"
    - from: "mobile/app/(tabs)/calendar.tsx"
      to: "expo-haptics"
      via: "Haptics import"
      pattern: "import.*Haptics.*expo-haptics"
---

<objective>
Polish the calendar tab header UI: replace emoji icons with Ionicons in sport filter chips, improve inactive chip contrast, add month/year context to the date picker, add today dot indicator, and add haptic + press feedback to all interactive elements.

Purpose: Bring the calendar screen up to UI/UX standards — consistent icon set, proper visual feedback, and better date context.
Output: Updated SportFilterChips.tsx and calendar.tsx with all polish improvements.
</objective>

<execution_context>
@/Users/gvozdovic/.claude/get-shit-done/workflows/execute-plan.md
@/Users/gvozdovic/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@mobile/components/SportFilterChips.tsx
@mobile/app/(tabs)/calendar.tsx
@mobile/constants/theme.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace emoji icons with Ionicons and improve chip contrast</name>
  <files>mobile/components/SportFilterChips.tsx</files>
  <action>
Replace emoji icons in SportFilterChips with Ionicons from `@expo/vector-icons` (already used throughout the app).

Icon mapping for the SPORTS array:
- All: `trophy-outline` (Ionicons)
- Soccer: `football-outline`
- Padel: `tennisball-outline`
- Tennis: `tennisball-outline`
- Basketball: `basketball-outline`
- Volleyball: `tennisball-outline` (no volleyball icon in Ionicons, tennisball is closest)
- Rollerskating: `fitness-outline`
- Cycling: `bicycle-outline`
- Running: `walk-outline`

Change SPORTS array to store icon name strings instead of emoji. Render `<Ionicons name={item.icon} size={14} color={active ? Colors.textOnPrimary : Colors.textSecondary} />` instead of the emoji Text element.

Change inactive chip background from `Colors.darkGreenBorder` (#1D210D) to `Colors.surfaceLight` (#2A2A2A) for better contrast against the #111111 background.

Add press feedback: wrap the existing Pressable with `style` as a function: `({pressed}) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.7 }]`.

Remove the `chipIcon` style (no longer needed since Ionicons handles its own sizing).
  </action>
  <verify>
    <automated>cd /Users/gvozdovic/Desktop/WEB\ Projects/teamup/teamup/mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
    <manual>Open the calendar tab on device/simulator — chips show vector icons, inactive chips are visibly distinct from background, pressing a chip shows opacity feedback</manual>
  </verify>
  <done>Sport filter chips render Ionicons instead of emojis, inactive chip background uses surfaceLight for clear contrast, pressing chips shows opacity feedback</done>
</task>

<task type="auto">
  <name>Task 2: Enhance date picker with month context, today dot, and haptic feedback</name>
  <files>mobile/app/(tabs)/calendar.tsx</files>
  <action>
Make these changes to calendar.tsx:

1. **Month/year label above date strip:**
   Add a Text element between the SportFilterChips section and the date FlatList showing the selected date's month and year (e.g., "February 2026"). Use `Typography.captionSemibold` style with `paddingHorizontal: Spacing.xl` and `marginBottom: Spacing.xs`. Format with `selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })`.

2. **Today dot indicator:**
   When a day is today but NOT the selected date, show a small 5px diameter dot below the day number. Add a View with `width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary, marginTop: 2`. Only render this dot when `isToday && !active`. Increase dayButton height from 64 to 70 to accommodate the dot without cramping.

3. **Haptic feedback:**
   Import `* as Haptics from 'expo-haptics'`. Add `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` inside `handleTabPress` (before setActiveTab). Add the same haptic call inside the date picker's `onPress` (before setSelectedDate). Add it to SportFilterChips onSelect callback by wrapping setSelectedSport: create a `handleSportSelect` function that calls Haptics then setSelectedSport.

4. **Press feedback on tabs and day buttons:**
   For tab Pressable elements: change `style` to a function `({pressed}) => [styles.tab, pressed && { opacity: 0.7 }]`.
   For day button Pressable elements: change `style` to a function `({pressed}) => [styles.dayButton, active && styles.dayButtonActive, pressed && { opacity: 0.7 }]`.

Import Typography from theme constants (already importing Colors, Spacing, BorderRadius, FontSize — add Typography to the import).
  </action>
  <verify>
    <automated>cd /Users/gvozdovic/Desktop/WEB\ Projects/teamup/teamup/mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
    <manual>Calendar tab shows month/year label above date strip, today has a green dot when not selected, tapping tabs/dates/chips triggers haptic feedback, all pressables show opacity on press</manual>
  </verify>
  <done>Date picker shows month/year context label, today has dot indicator when not selected, haptic feedback fires on tab/date/chip interactions, all pressable elements show press opacity feedback</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes without errors in both modified files
- No emoji characters remain in SportFilterChips.tsx
- Ionicons import is present in SportFilterChips.tsx
- expo-haptics import is present in calendar.tsx
- Typography import is present in calendar.tsx
</verification>

<success_criteria>
- Sport chips render Ionicons vector icons (no emojis)
- Inactive chips use surfaceLight background (#2A2A2A) for clear contrast
- Month/year label visible above date strip
- Today dot appears on today's date when another date is selected
- Haptic feedback on tab, date, and sport chip interactions
- All interactive elements show press opacity feedback
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/2-review-and-improve-mobile-app-events-cal/2-01-SUMMARY.md`
</output>
