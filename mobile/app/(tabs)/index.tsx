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
import { EventCard } from '../../components/EventCard';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const SPORT_FILTERS = ['All', 'Padel', 'Tennis', 'Running', 'Soccer', 'Basketball', 'Cycling'];

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Events</Text>
        <Pressable style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Sport Filters */}
      <FlatList
        horizontal
        data={SPORT_FILTERS}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.filterChip,
              selectedSport === item && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSport(item)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSport === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Events List */}
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

      {/* FAB - Create Event */}
      <Pressable
        style={styles.fab}
        onPress={() => {
          // TODO: Create event modal
        }}
      >
        <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  notifButton: { padding: Spacing.sm },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, color: Colors.text, fontSize: FontSize.md,
    paddingVertical: Spacing.md, marginLeft: Spacing.sm,
  },
  filterList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md },
  filterChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  filterTextActive: { color: Colors.textOnPrimary },
  eventsList: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  empty: {
    alignItems: 'center', paddingTop: 60, gap: Spacing.md,
  },
  emptyText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSize.md },
  fab: {
    position: 'absolute', bottom: 100, right: Spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
});
