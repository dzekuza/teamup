---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - mobile/components/EventCard.tsx
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/calendar.tsx
autonomous: true
requirements: [QUICK-1]
must_haves:
  truths:
    - "Upcoming carousel renders compact event cards (no large image, tighter layout)"
    - "Explore section renders full-size event cards with cover image, tags, avatars"
    - "Calendar tab renders full-size event cards identical to Explore section"
    - "Both card variants share the same component with a variant prop"
  artifacts:
    - path: "mobile/components/EventCard.tsx"
      provides: "Unified event card with compact and default variants"
      exports: ["EventCard", "COMPACT_CARD_WIDTH"]
    - path: "mobile/app/(tabs)/index.tsx"
      provides: "Home screen using EventCard for both upcoming and explore"
    - path: "mobile/app/(tabs)/calendar.tsx"
      provides: "Calendar screen using EventCard"
  key_links:
    - from: "mobile/app/(tabs)/index.tsx"
      to: "mobile/components/EventCard.tsx"
      via: "import EventCard with variant='compact' for carousel, default for explore"
      pattern: "variant.*compact"
---

<objective>
Consolidate MainEventCard and UpcomingEventCard into a single EventCard component with a `variant` prop ("default" | "compact"). The default variant replaces MainEventCard (full-size with cover image, tags, player avatars). The compact variant replaces UpcomingEventCard (fixed-width card for horizontal carousel with smaller image, gradient overlay, condensed info).

Purpose: Eliminate duplicate card logic, ensure visual consistency, single source of truth for event card rendering.
Output: Single EventCard.tsx component, updated imports in index.tsx and calendar.tsx, deleted old components.
</objective>

<execution_context>
@/Users/gvozdovic/.claude/get-shit-done/workflows/execute-plan.md
@/Users/gvozdovic/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@mobile/components/MainEventCard.tsx
@mobile/components/UpcomingEventCard.tsx
@mobile/app/(tabs)/index.tsx
@mobile/app/(tabs)/calendar.tsx
@mobile/constants/theme.ts
@mobile/components/PlayerAvatars.tsx
@mobile/hooks/useEvents.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create unified EventCard component</name>
  <files>mobile/components/EventCard.tsx</files>
  <action>
Create a new `EventCard.tsx` that combines both card designs behind a `variant` prop:

```typescript
interface EventCardProps {
  event: AppEvent;
  onPress: () => void;
  variant?: 'default' | 'compact';  // defaults to 'default'
}
```

**Shared logic (extract once):**
- `formatDate()` helper (Today/Tomorrow/formatted date) — identical in both current cards
- `formatTime()` helper — identical in both
- `SPORT_ICONS` map — merge both approaches: use emoji icons for default variant (like MainEventCard), Ionicons names for compact variant (like UpcomingEventCard)

**Default variant** (replaces MainEventCard exactly):
- Full-width card, `IMAGE_HEIGHT = 220`, `Colors.darkGreen` background, `borderRadius: 16`
- Cover image or emoji placeholder
- Joined badge (top-left, mainColor bg, people icon + "X/Y joined")
- Heart + share action buttons (bottom-right of image)
- Tags row below image (sportType, level, location chips with darkGreenBorder)
- Title (xxl, semibold)
- Bottom row: date/time + location meta left, PlayerAvatars right

**Compact variant** (replaces UpcomingEventCard):
- Fixed width `SCREEN_WIDTH * 0.72`, `IMAGE_HEIGHT = 120`, `Colors.surface` background, `borderRadius: 14`, border
- Cover image or Ionicons placeholder
- LinearGradient overlay on image bottom
- Sport chip + players chip badges on image top (overlayDark bg)
- Title overlaid at bottom of image (over gradient)
- Below image: date/time row with calendar icon, location row with location icon
- No tags row, no PlayerAvatars, no heart/share buttons

Export `COMPACT_CARD_WIDTH` (same value as current `UPCOMING_CARD_WIDTH`).

Keep `expo-linear-gradient` import — only used in compact variant. Use conditional rendering, not two separate component trees. Structure: shared image container at top, then variant-specific content below.
  </action>
  <verify>TypeScript compiles without errors: `cd mobile && npx tsc --noEmit --pretty 2>&1 | head -30`</verify>
  <done>EventCard.tsx exists with both variants, exports EventCard and COMPACT_CARD_WIDTH, all styles defined</done>
</task>

<task type="auto">
  <name>Task 2: Update consumers and delete old components</name>
  <files>mobile/app/(tabs)/index.tsx, mobile/app/(tabs)/calendar.tsx, mobile/components/MainEventCard.tsx, mobile/components/UpcomingEventCard.tsx</files>
  <action>
**index.tsx changes:**
- Replace `import { MainEventCard }` and `import { UpcomingEventCard, UPCOMING_CARD_WIDTH }` with `import { EventCard, COMPACT_CARD_WIDTH } from '../../components/EventCard'`
- In the upcoming carousel `renderItem`: replace `<UpcomingEventCard>` with `<EventCard variant="compact">`
- In the explore FlatList `renderItem`: replace `<MainEventCard>` with `<EventCard>`
- Replace `UPCOMING_CARD_WIDTH` references with `COMPACT_CARD_WIDTH` (used in snapToInterval and carouselItem width)

**calendar.tsx changes:**
- Replace `import { MainEventCard }` with `import { EventCard } from '../../components/EventCard'`
- Replace `<MainEventCard>` with `<EventCard>` in renderItem

**Delete old files:**
- Delete `mobile/components/MainEventCard.tsx`
- Delete `mobile/components/UpcomingEventCard.tsx`
  </action>
  <verify>TypeScript compiles: `cd mobile && npx tsc --noEmit --pretty 2>&1 | head -30`. Grep confirms no remaining imports of old components: `grep -r "MainEventCard\|UpcomingEventCard" mobile/app/ mobile/components/`</verify>
  <done>All consumers use EventCard, old component files deleted, no TypeScript errors, no stale imports</done>
</task>

</tasks>

<verification>
- `cd mobile && npx tsc --noEmit` passes with no new errors
- `grep -r "MainEventCard\|UpcomingEventCard" mobile/` returns nothing (old components fully removed)
- `EventCard.tsx` exports both `EventCard` and `COMPACT_CARD_WIDTH`
- Both variant layouts visually match the originals (same colors, spacing, typography from theme.ts)
</verification>

<success_criteria>
- Single EventCard component with variant prop replaces two separate components
- Default variant is pixel-identical to old MainEventCard
- Compact variant is pixel-identical to old UpcomingEventCard
- Zero remaining references to MainEventCard or UpcomingEventCard
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/1-consolidate-event-cards-into-single-cons/1-SUMMARY.md`
</output>
