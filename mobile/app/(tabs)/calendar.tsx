import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../contexts/AuthContext';
import { EventCard } from '../../components/EventCard';
import { SportFilterChips } from '../../components/SportFilterChips';
import { Colors, Spacing, BorderRadius, FontSize, Typography } from '../../constants/theme';
import { ScreenEnter } from '../../components/ScreenEnter';
import { useSavedEvents } from '../../hooks/useSavedEvents';

const TABS = ['All', 'Joined', 'Interested'] as const;
type Tab = typeof TABS[number];

const TAB_PADDING = 4;
const ANIM_CONFIG = { duration: 250, easing: Easing.out(Easing.cubic) };

function getTwoWeeks(baseDate: Date) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const { events, loading, refetch } = useEvents();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { savedIds, isSaved, toggleSave } = useSavedEvents();

  // Animated tab indicator
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? (containerWidth - TAB_PADDING * 2) / TABS.length : 0;
  const translateX = useSharedValue(0);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    const tw = (w - TAB_PADDING * 2) / TABS.length;
    translateX.value = TABS.indexOf(activeTab) * tw;
  }, [activeTab]);

  const handleTabPress = useCallback((tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    const idx = TABS.indexOf(tab);
    translateX.value = withTiming(idx * tabWidth, ANIM_CONFIG);
  }, [tabWidth]);

  const handleSportSelect = useCallback((sport: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSport(sport);
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const twoWeeks = useMemo(() => getTwoWeeks(new Date()), []);

  const filteredEvents = useMemo(() => {
    let result = events;

    // 1. Tab filter
    if (activeTab === 'Joined') {
      result = result.filter(e =>
        e.players.some(p => p.user_id === user?.id)
      );
    } else if (activeTab === 'Interested') {
      result = result.filter(e => savedIds.has(e.id));
    }

    // 2. Sport filter
    if (selectedSport !== 'All') {
      result = result.filter(e => e.sportType === selectedSport);
    }

    // 3. Date filter
    const dateStr = selectedDate.toISOString().split('T')[0];
    result = result.filter(e => e.date === dateStr);

    return result;
  }, [events, activeTab, selectedSport, selectedDate, user?.id, savedIds]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const monthYearLabel = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenEnter>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events calendar</Text>
        </View>

        {/* Animated tab slider */}
        <View
          style={styles.tabSlider}
          onLayout={onContainerLayout}
        >
          {/* Sliding indicator */}
          {tabWidth > 0 && (
            <Animated.View
              style={[
                styles.tabIndicator,
                { width: tabWidth, height: '100%' },
                indicatorStyle,
              ]}
            />
          )}
          {/* Tab labels */}
          {TABS.map(tab => (
            <Pressable
              key={tab}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sport filters */}
        <View style={styles.filtersRow}>
          <SportFilterChips selected={selectedSport} onSelect={handleSportSelect} />
        </View>

        {/* Month/year context label */}
        <Text style={styles.monthLabel}>{monthYearLabel}</Text>

        {/* Date picker slider — 2 weeks */}
        <FlatList
          horizontal
          data={twoWeeks}
          keyExtractor={(_, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          style={styles.weekPickerList}
          contentContainerStyle={styles.weekPicker}
          renderItem={({ item: day }) => {
            const active = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <Pressable
                style={({ pressed }) => [styles.dayButton, active && styles.dayButtonActive, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDate(new Date(day));
                }}
              >
                <Text style={[styles.dayName, active && styles.dayNameActive]}>
                  {isToday ? 'Today' : SHORT_DAYS[day.getDay()]}
                </Text>
                <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>
                  {day.getDate()}
                </Text>
                {isToday && !active ? (
                  <View style={styles.todayDot} />
                ) : (
                  <View style={styles.todayDotPlaceholder} />
                )}
              </Pressable>
            );
          }}
        />

        {/* Event list */}
        <FlatList
          data={filteredEvents}
          keyExtractor={item => item.id}
          style={styles.eventsListContainer}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
              isSaved={isSaved(item.id)}
              onSave={toggleSave}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No events on this day</Text>
                <Text style={styles.emptySubtext}>Try selecting a different date</Text>
              </View>
            ) : null
          }
        />
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },

  // Animated tab slider
  tabSlider: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: TAB_PADDING,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: TAB_PADDING,
    left: TAB_PADDING,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.textOnPrimary,
  },

  filtersRow: {
    marginBottom: Spacing.sm,
  },
  monthLabel: {
    ...Typography.captionSemibold,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  weekPickerList: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  weekPicker: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  dayButton: {
    width: 48,
    height: 70,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNameActive: {
    color: Colors.textOnPrimary,
  },
  dayNumber: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  dayNumberActive: {
    color: Colors.textOnPrimary,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  todayDotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  eventsListContainer: {
    flex: 1,
  },
  eventsList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
