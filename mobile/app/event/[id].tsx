import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { PADEL_LOCATIONS } from '../../constants/locations';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface EventDetail {
  id: string;
  title: string;
  date: string;
  time: string;
  end_time: string;
  location: string;
  level: string;
  max_players: number;
  created_by: string;
  price: number;
  status: string;
  is_private: boolean;
  sport_type: string;
  description: string | null;
  cover_image_url: string | null;
  custom_location_lat: number | null;
  custom_location_lng: number | null;
}

interface Player {
  id: string;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  level: string | null;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [creatorName, setCreatorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isJoined = players.some(p => p.user_id === user?.id);
  const isCreator = event?.created_by === user?.id;
  const isFull = players.length >= (event?.max_players ?? 4);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [{ data: eventData }, { data: playersData }] = await Promise.all([
          supabase.from('events').select('*').eq('id', id).single(),
          supabase.from('event_players').select('*').eq('event_id', id),
        ]);

        if (eventData) {
          setEvent(eventData);
          // Fetch creator name
          const { data: creator } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', eventData.created_by)
            .single();
          setCreatorName(creator?.display_name || 'Unknown');
        }
        setPlayers(
          (playersData || []).map(p => ({
            id: p.id,
            user_id: p.user_id,
            display_name: p.display_name,
            photo_url: p.photo_url,
            level: p.level,
          }))
        );

        // Check if saved
        if (user) {
          const { data: saved } = await supabase
            .from('saved_events')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_id', id)
            .maybeSingle();
          setIsSaved(!!saved);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  const handleJoin = async () => {
    if (!user || !event || !profile) return;
    setJoining(true);
    try {
      const { error } = await supabase.from('event_players').insert({
        event_id: event.id,
        user_id: user.id,
        display_name: profile.display_name,
        photo_url: profile.photo_url,
        level: profile.level,
      });
      if (error) throw error;
      setPlayers(prev => [
        ...prev,
        {
          id: 'new',
          user_id: user.id,
          display_name: profile.display_name,
          photo_url: profile.photo_url,
          level: profile.level,
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join event');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !event) return;
    Alert.alert('Leave Event', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase
              .from('event_players')
              .delete()
              .match({ event_id: event.id, user_id: user.id });
            setPlayers(prev => prev.filter(p => p.user_id !== user.id));
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleSaveToggle = async () => {
    if (!user || !event) return;
    if (isSaved) {
      await supabase
        .from('saved_events')
        .delete()
        .match({ user_id: user.id, event_id: event.id });
    } else {
      await supabase.from('saved_events').insert({ user_id: user.id, event_id: event.id });
    }
    setIsSaved(!isSaved);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const venue = PADEL_LOCATIONS.find(l => l.name === event.location);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Nav */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.topBarActions}>
            <Pressable style={styles.iconButton} onPress={handleSaveToggle}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? Colors.primary : Colors.text}
              />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="share-outline" size={22} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Cover Image */}
        {event.cover_image_url && (
          <Image
            source={{ uri: event.cover_image_url }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
          />
        )}

        {/* Event Info */}
        <View style={styles.content}>
          <View style={styles.sportAndLevel}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportText}>{event.sport_type}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{event.level}</Text>
            </View>
            {event.is_private && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={12} color={Colors.warning} />
                <Text style={styles.privateText}>Private</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.createdBy}>Organized by {creatorName}</Text>

          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}

          {/* Details Grid */}
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {event.time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
              </View>
            </View>
            {event.price > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>{'\u20AC'}{event.price} per person</Text>
                </View>
              </View>
            )}
          </View>

          {/* Players */}
          <View style={styles.playersSection}>
            <View style={styles.playersSectionHeader}>
              <Text style={styles.sectionTitle}>Players</Text>
              <Text style={styles.playerCountText}>
                {players.length}/{event.max_players}
              </Text>
            </View>

            {/* Player slots */}
            <View style={styles.playerGrid}>
              {Array.from({ length: event.max_players }).map((_, index) => {
                const player = players[index];
                return (
                  <View key={index} style={styles.playerSlot}>
                    <View
                      style={[
                        styles.playerAvatar,
                        player ? styles.playerAvatarFilled : styles.playerAvatarEmpty,
                      ]}
                    >
                      <Ionicons
                        name={player ? 'person' : 'add'}
                        size={20}
                        color={player ? Colors.primary : Colors.textMuted}
                      />
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player?.display_name || 'Open'}
                    </Text>
                    {player?.level && (
                      <Text style={styles.playerLevel}>{player.level}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Map placeholder */}
          {venue && (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.mapText}>{venue.name}</Text>
                <Text style={styles.mapSubtext}>{venue.address}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {isCreator ? (
          <Button title="Edit Event" onPress={() => {}} size="lg" style={styles.actionButton} />
        ) : isJoined ? (
          <Button
            title="Leave Event"
            onPress={handleLeave}
            variant="outline"
            size="lg"
            style={styles.actionButton}
          />
        ) : (
          <Button
            title={isFull ? 'Event Full' : 'Join Event'}
            onPress={handleJoin}
            loading={joining}
            disabled={isFull}
            size="lg"
            style={styles.actionButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg,
  },
  errorText: { color: Colors.text, fontSize: FontSize.lg },
  scroll: { paddingBottom: 100 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarActions: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  coverImage: {
    width: '100%', height: 200, marginBottom: Spacing.lg,
  },
  content: { paddingHorizontal: Spacing.xl },
  sportAndLevel: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md,
  },
  sportBadge: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  sportText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  levelBadge: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  levelText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  privateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  privateText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '600' },
  title: { color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '800', marginBottom: Spacing.xs },
  createdBy: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.lg },
  description: {
    color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.lg,
  },
  detailsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, gap: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xxl,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  detailValue: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  playersSection: { marginBottom: Spacing.xxl },
  playersSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  playerCountText: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: '700' },
  playerGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
  },
  playerSlot: { alignItems: 'center', width: 70 },
  playerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  playerAvatarFilled: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary },
  playerAvatarEmpty: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  playerName: { color: Colors.textSecondary, fontSize: FontSize.xs, textAlign: 'center' },
  playerLevel: { color: Colors.textMuted, fontSize: FontSize.xs },
  mapSection: { marginBottom: Spacing.xxl },
  mapPlaceholder: {
    height: 150, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md,
  },
  mapText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600', marginTop: Spacing.sm },
  mapSubtext: { color: Colors.textMuted, fontSize: FontSize.sm },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    paddingBottom: 34,
  },
  actionButton: { width: '100%' },
});
