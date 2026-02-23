import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEvents } from '../../hooks/useEvents';
import { EventCard, COMPACT_CARD_WIDTH } from '../../components/EventCard';
import { SportFilterChips } from '../../components/SportFilterChips';
import { PlayerAvatars } from '../../components/PlayerAvatars';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import type { AppEvent } from '../../hooks/useEvents';

export default function HomeScreen() {
  const { events, loading, refetch } = useEvents();
  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');

  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedSport !== 'All') {
      result = result.filter(e => e.sportType === selectedSport);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, selectedSport, search]);

  // Split events: upcoming (next 5 soonest) vs explore (all)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(e => new Date(`${e.date}T${e.time}`) >= now)
      .slice(0, 5);
  }, [filteredEvents]);

  // Currently playing: events happening right now
  const currentlyPlaying = useMemo(() => {
    const now = new Date();
    return events.find(e => {
      const start = new Date(`${e.date}T${e.time}`);
      const end = e.endTime ? new Date(`${e.date}T${e.endTime}`) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return now >= start && now <= end;
    });
  }, [events]);

  const renderHeader = () => (
    <View>
      {/* Events count */}
      <Text style={styles.eventsCount}>
        {filteredEvents.length} events found
      </Text>

      {/* Currently playing */}
      {currentlyPlaying && (
        <View style={styles.currentlyPlaying}>
          <View style={styles.currentlyPlayingHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.currentlyPlayingLabel}>Currently playing</Text>
          </View>
          <Text style={styles.currentlyPlayingTitle}>{currentlyPlaying.title}</Text>
          <View style={styles.currentlyPlayingMeta}>
            <Ionicons name="time-outline" size={14} color={Colors.inputText} />
            <Text style={styles.currentlyPlayingTime}>
              {currentlyPlaying.time.slice(0, 5)}
              {currentlyPlaying.endTime ? ` – ${currentlyPlaying.endTime.slice(0, 5)}` : ''}
            </Text>
          </View>
          <View style={styles.currentlyPlayingFooter}>
            <PlayerAvatars players={currentlyPlaying.players} maxVisible={4} size={28} />
            <Pressable
              style={styles.previewButton}
              onPress={() => router.push(`/event/${currentlyPlaying.id}`)}
            >
              <Text style={styles.previewButtonText}>Preview current match</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Upcoming events carousel */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          <FlatList
            horizontal
            data={upcomingEvents}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={COMPACT_CARD_WIDTH + Spacing.md}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <View style={styles.carouselItem}>
                <EventCard
                  event={item}
                  onPress={() => router.push(`/event/${item.id}`)}
                  variant="compact"
                />
              </View>
            )}
          />
        </View>
      )}

      {/* Explore section header */}
      <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.xl }]}>Explore</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.inputText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={Colors.inputText}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.inputText} />
            </Pressable>
          ) : null}
        </View>
        <Pressable style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Sport filter chips */}
      <View style={styles.filtersRow}>
        <SportFilterChips selected={selectedSport} onSelect={setSelectedSport} />
      </View>

      {/* Main content */}
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.exploreCard}>
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No events found</Text>
              <Text style={styles.emptySubtext}>
                {search || selectedSport !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Pull to refresh or create a new event'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Map floating button */}
      <Pressable style={styles.mapButton} onPress={() => router.push('/map')}>
        <Ionicons name="map-outline" size={18} color={Colors.text} />
        <Text style={styles.mapButtonText}>Map</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGreen,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.darkGreen,
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersRow: {
    marginBottom: Spacing.md,
  },

  // Events count
  eventsCount: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },

  // Currently playing
  currentlyPlaying: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.darkGreen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
  },
  currentlyPlayingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  currentlyPlayingLabel: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  currentlyPlayingTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  currentlyPlayingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  currentlyPlayingTime: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
  },
  currentlyPlayingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  previewButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  carouselContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  carouselItem: {
    width: COMPACT_CARD_WIDTH,
  },

  // Explore cards
  eventsList: {
    paddingBottom: 100,
  },
  exploreCard: {
    paddingHorizontal: Spacing.xl,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.md,
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

  // Map button
  mapButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  mapButtonText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
