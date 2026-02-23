import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EventCard } from '../../components/EventCard';
import type { AppEvent } from '../../hooks/useEvents';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { ScreenEnter } from '../../components/ScreenEnter';
import { useSavedEvents } from '../../hooks/useSavedEvents';

export default function SavedEventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useSavedEvents();

  // When an event is unsaved, remove it from this list immediately
  const handleUnsave = useCallback(async (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    await toggleSave(eventId);
  }, [toggleSave]);

  const fetchSavedEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: saved } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', user.id);

      if (!saved || saved.length === 0) {
        setEvents([]);
        return;
      }

      const eventIds = saved.map(s => s.event_id);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true });

      const { data: playersData } = await supabase
        .from('event_players')
        .select('*')
        .in('event_id', eventIds);

      const playersByEvent: Record<string, any[]> = {};
      for (const p of playersData || []) {
        if (!playersByEvent[p.event_id]) playersByEvent[p.event_id] = [];
        playersByEvent[p.event_id].push({
          id: p.id,
          user_id: p.user_id,
          display_name: p.display_name,
          photo_url: p.photo_url,
          level: p.level,
        });
      }

      setEvents(
        (eventsData || []).map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time,
          endTime: e.end_time,
          location: e.location,
          level: e.level,
          maxPlayers: e.max_players,
          createdBy: e.created_by,
          price: Number(e.price),
          status: e.status,
          isPrivate: e.is_private,
          password: e.password ?? undefined,
          sportType: e.sport_type,
          description: e.description ?? undefined,
          coverImageUrl: e.cover_image_url ?? undefined,
          customLocationLat: e.custom_location_lat ?? undefined,
          customLocationLng: e.custom_location_lng ?? undefined,
          createdAt: e.created_at,
          players: playersByEvent[e.id] || [],
          playerCount: (playersByEvent[e.id] || []).length,
        }))
      );
    } catch (err) {
      console.error('Error fetching saved events:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedEvents();
  }, [fetchSavedEvents]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenEnter>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Events</Text>
        </View>
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchSavedEvents} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
              isSaved={isSaved(item.id)}
              onSave={handleUnsave}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="bookmark-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No saved events</Text>
                <Text style={styles.emptySubtext}>Bookmark events to find them here</Text>
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
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  headerTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSize.md },
});
