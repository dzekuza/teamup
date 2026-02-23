import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEvents } from '../../hooks/useEvents';
import { EventCard } from '../../components/EventCard';
import { SportFilterChips } from '../../components/SportFilterChips';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const TABS = ['All', 'Joined', 'Interested'] as const;

function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScreen() {
  const { events, loading, refetch } = useEvents();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by sport
    if (selectedSport !== 'All') {
      result = result.filter(e => e.sportType === selectedSport);
    }

    // Filter by selected date
    const dateStr = selectedDate.toISOString().split('T')[0];
    result = result.filter(e => e.date === dateStr);

    return result;
  }, [events, selectedSport, selectedDate]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events calendar</Text>
      </View>

      {/* Tab slider */}
      <View style={styles.tabSlider}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sport filters */}
      <View style={styles.filtersRow}>
        <SportFilterChips selected={selectedSport} onSelect={setSelectedSport} />
      </View>

      {/* Week day picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekPicker}
      >
        {weekDays.map((day, index) => {
          const active = isSameDay(day, selectedDate);
          return (
            <Pressable
              key={index}
              style={[styles.dayButton, active && styles.dayButtonActive]}
              onPress={() => setSelectedDate(new Date(day))}
            >
              <Text style={[styles.dayName, active && styles.dayNameActive]}>
                {DAY_NAMES[index]}
              </Text>
              <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Event list */}
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/event/${item.id}`)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },
  tabSlider: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
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
    marginBottom: Spacing.md,
  },
  weekPicker: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dayButton: {
    width: 48,
    height: 64,
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
