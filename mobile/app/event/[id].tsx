import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { PADEL_LOCATIONS } from '../../constants/locations';
import { PlayerAvatars } from '../../components/PlayerAvatars';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import type { Database } from '../../types/supabase';

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

type EventRow = Database['public']['Tables']['events']['Row'];
type EventPlayerRow = Database['public']['Tables']['event_players']['Row'];
type EventPlayerInsert = Database['public']['Tables']['event_players']['Insert'];
type SavedEventInsert = Database['public']['Tables']['saved_events']['Insert'];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [creatorName, setCreatorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [showJoinSuccessSheet, setShowJoinSuccessSheet] = useState(false);
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);
  const [savingInterest, setSavingInterest] = useState(false);
  const scrollY = useState(new Animated.Value(0))[0];
  const bottomBarHeight = 84 + insets.bottom;

  const isJoined = players.some(p => p.user_id === user?.id);
  const isCreator = event?.created_by === user?.id;
  const isFull = players.length >= (event?.max_players ?? 4);
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [{ data: eventData }, { data: playersData }] = await Promise.all([
          supabase.from('events').select('*').eq('id', id).single(),
          supabase.from('event_players').select('*').eq('event_id', id),
        ]);

        const eventRow = eventData as EventRow | null;
        const playerRows = (playersData ?? []) as EventPlayerRow[];

        if (eventRow) {
          setEvent(eventRow);
          // Fetch creator name
          const { data: creator } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', eventRow.created_by)
            .single();
          setCreatorName(creator?.display_name || 'Unknown');
        }
        setPlayers(
          playerRows.map(p => ({
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

        const { count } = await supabase
          .from('saved_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', id);
        setInterestedCount(count ?? 0);
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
      const insertPayload: EventPlayerInsert = {
        event_id: event.id,
        user_id: user.id,
        display_name: profile.display_name,
        photo_url: profile.photo_url,
        level: profile.level,
      };
      const { error } = await supabase.from('event_players').insert(insertPayload);
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
      setShowJoinSheet(false);
      setShowJoinSuccessSheet(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join event');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveConfirm = async () => {
    if (!user || !event) return;
    try {
      await supabase
        .from('event_players')
        .delete()
        .match({ event_id: event.id, user_id: user.id });
      setPlayers(prev => prev.filter(p => p.user_id !== user.id));
      setShowLeaveSheet(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to mark events as interested.');
      return;
    }
    if (!event || savingInterest) return;
    setSavingInterest(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_events')
          .delete()
          .match({ user_id: user.id, event_id: event.id });
        setInterestedCount(prev => Math.max(0, prev - 1));
      } else {
        const payload: SavedEventInsert = { user_id: user.id, event_id: event.id };
        await supabase.from('saved_events').insert(payload);
        setInterestedCount(prev => prev + 1);
      }
      setIsSaved(!isSaved);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update interest');
    } finally {
      setSavingInterest(false);
    }
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

  const formatDayLabel = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimeRange = () => {
    const start = event?.time?.slice(0, 5) ?? '';
    const end = event?.end_time?.slice(0, 5) ?? '';
    return end ? `${start} - ${end}` : start;
  };

  const getLocationCoordinates = () => {
    if (event?.custom_location_lat && event?.custom_location_lng) {
      return { latitude: event.custom_location_lat, longitude: event.custom_location_lng };
    }
    const venueMatch = PADEL_LOCATIONS.find(l => l.name === event?.location);
    if (venueMatch) {
      return { latitude: venueMatch.lat, longitude: venueMatch.lng };
    }
    return null;
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
  const locationCoords = getLocationCoordinates();
  const showTimeRange = `${formatDayLabel(event.date)} · ${formatTimeRange()}`;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.hero}>
        {event.cover_image_url && (
          <Animated.View
            style={[
              styles.heroImageWrapper,
              {
                transform: [
                  {
                    scale: scrollY.interpolate({
                      inputRange: [0, 200],
                      outputRange: [1, 1.12],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: event.cover_image_url }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>
        )}
        <View style={styles.heroOverlay} pointerEvents="none" />
      </View>

      <View style={[styles.heroHeader, { paddingTop: insets.top }]}>
        <Pressable style={styles.heroBack} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={Colors.backgroundDark} />
        </Pressable>
        <View style={styles.heroRightActions}>
          <Pressable style={styles.heroIconButton} onPress={handleSaveToggle}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? Colors.mainColor : Colors.text}
            />
          </Pressable>
          <Pressable style={styles.heroIconButton}>
            <Ionicons name="share-social-outline" size={20} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomBarHeight + Spacing.lg }]}
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.sheet}>
          <View style={styles.chipRow}>
            {!!event.sport_type && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{event.sport_type}</Text>
              </View>
            )}
            {!!event.level && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{event.level}</Text>
              </View>
            )}
            <View style={styles.chip}>
              <Text style={styles.chipText}>{event.is_private ? 'Private' : 'Public'}</Text>
            </View>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaTime}>{showTimeRange}</Text>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.byline}>
              {event.is_private ? 'Private' : 'Public'} · Event by{' '}
              <Text style={styles.bylineLink}>{creatorName}</Text>
            </Text>
          </View>

          <View style={styles.attendanceBlock}>
            <Text style={styles.attendanceText}>
              {players.length} out of {event.max_players} are going · {interestedCount} interested
            </Text>
            {players.length > 0 && (
              <View style={styles.avatarRow}>
                <PlayerAvatars
                  players={players}
                  borderColor={Colors.backgroundDark}
                  borderWidth={2}
                />
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{event.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>90 min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{players.length}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Host comments</Text>
            <Text style={styles.sectionBody}>
              {event.description || 'No host comments yet.'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Players</Text>
            <View style={styles.playersList}>
              {players.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  {player.photo_url ? (
                    <Image
                      source={{ uri: player.photo_url }}
                      style={styles.playerAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.playerAvatarPlaceholder}>
                      <Ionicons name="person" size={18} color={Colors.text} />
                    </View>
                  )}
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.display_name || 'Unknown'}</Text>
                    <Text style={styles.playerDetail}>
                      {(event.sport_type || 'Padel') + (player.level ? ` · ${player.level}` : '')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Place of the game</Text>
            <View style={styles.mapCard}>
              {locationCoords ? (
                <MapView
                  provider={PROVIDER_DEFAULT}
                  style={styles.map}
                  initialRegion={{
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={locationCoords}>
                    <View style={styles.mapMarker}>
                      <Ionicons name="football" size={16} color={Colors.mainColor} />
                    </View>
                  </Marker>
                </MapView>
              ) : (
                <View style={[styles.map, styles.mapFallback]}>
                  <Ionicons name="map-outline" size={32} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.mapAddress}>
                <Text style={styles.mapAddressText}>
                  {venue?.address || event.location}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Spacing.lg + insets.bottom }]}>
        <Pressable
          style={[
            styles.bottomButton,
            styles.bottomButtonSecondary,
            isSaved && styles.bottomButtonInterested,
          ]}
          onPress={handleSaveToggle}
          disabled={savingInterest}
        >
          {savingInterest ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[
              styles.bottomButtonSecondaryText,
              isSaved && styles.bottomButtonInterestedText,
            ]}>
              {isSaved ? 'Interested ✓' : 'Interested'}
            </Text>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.bottomButton,
            isCreator || isJoined ? styles.bottomButtonDanger : styles.bottomButtonPrimary,
            isFull && !isJoined && !isCreator && styles.bottomButtonDisabled,
          ]}
          onPress={() => {
            if (isCreator) {
              router.push(`/edit-event/${event.id}`);
              return;
            }
            if (isJoined) {
              setShowLeaveSheet(true);
              return;
            }
            setShowJoinSheet(true);
          }}
          disabled={isFull && !isJoined && !isCreator}
        >
          <Text style={[
            styles.bottomButtonPrimaryText,
            (isCreator || isJoined) && styles.bottomButtonDangerText,
            isFull && !isJoined && !isCreator && styles.bottomButtonDisabledText,
          ]}>
            {isCreator ? 'Edit event' : isJoined ? 'Leave game' : isFull ? 'Event full' : 'Join game'}
          </Text>
        </Pressable>
      </View>
      {/* Join Confirmation Sheet */}
      <BottomSheet
        visible={showJoinSheet}
        onDismiss={() => setShowJoinSheet(false)}
        snapHeight={320}
      >
        <View style={sheetStyles.container}>
          <Pressable
            style={sheetStyles.closeButton}
            onPress={() => setShowJoinSheet(false)}
          >
            <Ionicons name="close-circle-outline" size={40} color={Colors.textMuted} />
          </Pressable>
          <View style={sheetStyles.content}>
            <Text style={sheetStyles.title}>Are you sure you want to join this game?</Text>
            <Text style={sheetStyles.body}>
              Please note that frequent cancellations may affect your reputation within the community.
            </Text>
          </View>
          <View style={sheetStyles.buttonRow}>
            <Pressable
              style={[sheetStyles.button, sheetStyles.secondaryButton]}
              onPress={() => setShowJoinSheet(false)}
            >
              <Text style={sheetStyles.secondaryButtonText}>Discard</Text>
            </Pressable>
            <Pressable
              style={[sheetStyles.button, sheetStyles.primaryButton]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color={Colors.textOnPrimary} size="small" />
              ) : (
                <Text style={sheetStyles.primaryButtonText}>Join game</Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Join Success Sheet */}
      <BottomSheet
        visible={showJoinSuccessSheet}
        onDismiss={() => setShowJoinSuccessSheet(false)}
        snapHeight={320}
      >
        <View style={sheetStyles.container}>
          <Pressable
            style={sheetStyles.closeButton}
            onPress={() => setShowJoinSuccessSheet(false)}
          >
            <Ionicons name="close-circle-outline" size={40} color={Colors.textMuted} />
          </Pressable>
          <View style={sheetStyles.content}>
            <Text style={sheetStyles.title}>Congratulations!</Text>
            <Text style={sheetStyles.body}>
              You just joined {creatorName}'s {event.sport_type} event on {formatDate(event.date)}, {event.time.slice(0, 5)}.
            </Text>
          </View>
          <View style={sheetStyles.buttonRow}>
            <Pressable
              style={[sheetStyles.button, sheetStyles.primaryButton]}
              onPress={() => setShowJoinSuccessSheet(false)}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.textOnPrimary} />
              <Text style={sheetStyles.primaryButtonText}>Add event to calendar</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Leave/Cancel Sheet */}
      <BottomSheet
        visible={showLeaveSheet}
        onDismiss={() => setShowLeaveSheet(false)}
        snapHeight={320}
      >
        <View style={sheetStyles.container}>
          <Pressable
            style={sheetStyles.closeButton}
            onPress={() => setShowLeaveSheet(false)}
          >
            <Ionicons name="close-circle-outline" size={40} color={Colors.textMuted} />
          </Pressable>
          <View style={sheetStyles.content}>
            <Text style={sheetStyles.title}>Are you sure you want to cancel this game?</Text>
            <Text style={sheetStyles.body}>
              Please note that frequent cancellations may negatively affect your reputation within the community.
            </Text>
          </View>
          <View style={sheetStyles.buttonRow}>
            <Pressable
              style={[sheetStyles.button, sheetStyles.secondaryButton]}
              onPress={() => setShowLeaveSheet(false)}
            >
              <Text style={sheetStyles.secondaryButtonText}>Discard</Text>
            </Pressable>
            <Pressable
              style={[sheetStyles.button, sheetStyles.destructiveButton]}
              onPress={handleLeaveConfirm}
            >
              <Text style={sheetStyles.destructiveButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
  },
  content: {
    flex: 1,
    gap: Spacing.md,
  },
  title: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '600',
  },
  body: {
    color: Colors.inputText,
    fontSize: FontSize.lg,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  primaryButton: {
    backgroundColor: Colors.mainColor,
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.darkGreen,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  destructiveButton: {
    backgroundColor: Colors.lightGreen,
  },
  destructiveButtonText: {
    color: Colors.inputText,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  errorText: { color: Colors.text, fontSize: FontSize.lg },
  scroll: {
    paddingTop: 236,
  },
  scrollView: {
    zIndex: 3,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: Colors.surface,
    zIndex: 2,
    elevation: 2,
  },
  heroImageWrapper: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    zIndex: 20,
    elevation: 20,
  },
  heroBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mainColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRightActions: { flexDirection: 'row', gap: Spacing.sm },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: 0,
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
    zIndex: 4,
    elevation: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: '#405200',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  chipText: {
    color: '#708F00',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  metaBlock: { gap: Spacing.sm },
  metaTime: {
    color: Colors.textLight,
    fontSize: FontSize.md,
  },
  title: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '700',
  },
  byline: {
    color: Colors.textLight,
    fontSize: FontSize.md,
  },
  bylineLink: {
    color: Colors.mainColor,
    textDecorationLine: 'underline',
  },
  attendanceBlock: { gap: Spacing.sm },
  attendanceText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
  },
  avatarRow: { marginTop: Spacing.sm },
  divider: {
    height: 1,
    backgroundColor: Colors.darkGreenBorder,
    marginVertical: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: {
    color: Colors.textLight,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.inputText,
    fontSize: FontSize.md,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  sectionBody: {
    color: Colors.inputText,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  playersList: { gap: Spacing.sm },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.darkGreen,
    borderRadius: BorderRadius.md,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: { flex: 1 },
  playerName: {
    color: Colors.textLight,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  playerDetail: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
  },
  mapCard: {
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  map: { height: 220, width: '100%' },
  mapFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  mapMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.darkGreenBorder,
    borderWidth: 1,
    borderColor: Colors.mainColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.mainColor,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  mapAddress: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  mapAddressText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Colors.darkGreenBorder,
    zIndex: 10,
    elevation: 10,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonSecondary: {
    backgroundColor: '#1D2615',
  },
  bottomButtonPrimary: {
    backgroundColor: Colors.mainColor,
  },
  bottomButtonDanger: {
    backgroundColor: Colors.error,
  },
  bottomButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  bottomButtonSecondaryText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  bottomButtonInterested: {
    backgroundColor: Colors.darkGreen,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bottomButtonInterestedText: {
    color: Colors.primary,
  },
  bottomButtonPrimaryText: {
    color: Colors.backgroundDark,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  bottomButtonDangerText: {
    color: Colors.text,
  },
  bottomButtonDisabledText: {
    color: Colors.textMuted,
  },
});
