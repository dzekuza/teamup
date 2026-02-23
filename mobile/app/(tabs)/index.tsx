import React, { useState, useMemo, useEffect } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { EventCard, COMPACT_CARD_WIDTH } from '../../components/EventCard';
import { SportFilterChips } from '../../components/SportFilterChips';
import { PlayerAvatars } from '../../components/PlayerAvatars';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import type { AppEvent } from '../../hooks/useEvents';
import { ScreenEnter } from '../../components/ScreenEnter';
import { useSavedEvents } from '../../hooks/useSavedEvents';

export default function HomeScreen() {
  const { events, loading, refetch } = useEvents();
  const { user, profile } = useAuth();
  const { isSaved, toggleSave } = useSavedEvents();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [countdown, setCountdown] = useState('');

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

  // Currently playing: events happening right now that the user has joined
  const currentlyPlaying = useMemo(() => {
    if (!user) return undefined;
    const now = new Date();
    return events.find(e => {
      const isJoined = e.players.some(p => p.user_id === user.id);
      if (!isJoined) return false;
      const start = new Date(`${e.date}T${e.time}`);
      const end = e.endTime ? new Date(`${e.date}T${e.endTime}`) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return now >= start && now <= end;
    });
  }, [events, user]);

  // Countdown timer for currently playing event
  useEffect(() => {
    if (!currentlyPlaying) {
      setCountdown('');
      return;
    }
    const tick = () => {
      const now = new Date();
      const end = currentlyPlaying.endTime
        ? new Date(`${currentlyPlaying.date}T${currentlyPlaying.endTime}`)
        : new Date(new Date(`${currentlyPlaying.date}T${currentlyPlaying.time}`).getTime() + 2 * 60 * 60 * 1000);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentlyPlaying]);

  const renderHeader = () => (
    <View>
      {/* Currently playing */}
      {currentlyPlaying && (
        <Pressable
          style={styles.currentlyPlaying}
          onPress={() => router.push(`/event/${currentlyPlaying.id}`)}
        >
          <Text style={styles.currentlyPlayingLabel}>Currently playing</Text>
          <Text style={styles.currentlyPlayingTitle}>{currentlyPlaying.title}</Text>
          <View style={styles.currentlyPlayingBottom}>
            <View style={styles.currentlyPlayingTimeCol}>
              <Text style={styles.currentlyPlayingTime}>
                {currentlyPlaying.time.slice(0, 5)}
                {currentlyPlaying.endTime ? ` - ${currentlyPlaying.endTime.slice(0, 5)}` : ''}
              </Text>
              {countdown ? (
                <Text style={styles.currentlyPlayingCountdown}>{countdown}</Text>
              ) : null}
            </View>
            <PlayerAvatars players={currentlyPlaying.players} maxVisible={4} size={32} />
          </View>
        </Pressable>
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
                  isSaved={isSaved(item.id)}
                  onSave={toggleSave}
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
      <ScreenEnter>
        {/* Welcome title */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back, {profile?.display_name || 'Player'}
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={[
            styles.searchContainer,
            { borderColor: searchFocused ? Colors.primary : Colors.border },
          ]}>
            <Ionicons name="search" size={18} color={searchFocused ? Colors.primary : Colors.inputText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events..."
              placeholderTextColor={Colors.inputText}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
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
                isSaved={isSaved(item.id)}
                onSave={toggleSave}
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
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  welcomeText: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersRow: {
    marginBottom: Spacing.md,
  },

  // Currently playing
  currentlyPlaying: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.darkGreen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  currentlyPlayingLabel: {
    color: Colors.mainColor,
    fontSize: FontSize.lg,
    fontWeight: '400',
    marginBottom: Spacing.sm,
  },
  currentlyPlayingTitle: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: Spacing.sm,
  },
  currentlyPlayingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  currentlyPlayingTimeCol: {
    gap: Spacing.xs,
  },
  currentlyPlayingTime: {
    color: Colors.textLight,
    fontSize: FontSize.lg,
    fontWeight: '400',
    lineHeight: 22,
  },
  currentlyPlayingCountdown: {
    color: Colors.textLight,
    fontSize: FontSize.lg,
    fontWeight: '400',
    lineHeight: 22,
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
    bottom: 24,
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
