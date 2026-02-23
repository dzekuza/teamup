import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEvents } from '../hooks/useEvents';
import { PADEL_LOCATIONS } from '../constants/locations';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { PlayerAvatars } from '../components/PlayerAvatars';
import type { AppEvent } from '../hooks/useEvents';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHEET_COLLAPSED = 140;
const SHEET_EXPANDED = SCREEN_HEIGHT * 0.65;
const SNAP_THRESHOLD = (SHEET_EXPANDED - SHEET_COLLAPSED) / 3;

// Vilnius center
const INITIAL_REGION = {
  latitude: 54.6872,
  longitude: 25.2797,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const SPORT_COLORS: Record<string, string> = {
  Padel: '#C1FF2F',
  Tennis: '#4CAF50',
  Running: '#FF9800',
  Soccer: '#2196F3',
  Basketball: '#FF5722',
  Cycling: '#9C27B0',
  Volleyball: '#00BCD4',
};

const SPORT_ICONS: Record<string, string> = {
  Padel: 'tennisball',
  Tennis: 'tennisball-outline',
  Running: 'walk',
  Soccer: 'football',
  Basketball: 'basketball',
  Cycling: 'bicycle',
  Volleyball: 'basketball-outline',
};

function getEventCoords(event: AppEvent): { latitude: number; longitude: number } | null {
  if (event.customLocationLat && event.customLocationLng) {
    return { latitude: event.customLocationLat, longitude: event.customLocationLng };
  }
  const locationLower = event.location.toLowerCase();
  for (const venue of PADEL_LOCATIONS) {
    const venueLower = venue.name.toLowerCase();
    if (
      locationLower.includes(venueLower) ||
      venueLower.includes(locationLower) ||
      locationLower.split(/[|,\s]+/).some(w => w.length > 3 && venueLower.includes(w)) ||
      venueLower.split(/[|,\s]+/).some(w => w.length > 3 && locationLower.includes(w))
    ) {
      return { latitude: venue.lat, longitude: venue.lng };
    }
  }
  return null;
}

export default function MapScreen() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const mapRef = useRef<MapView>(null);

  const sheetHeight = useSharedValue(SHEET_COLLAPSED);
  const startHeight = useSharedValue(SHEET_COLLAPSED);

  // All upcoming events (for the sheet list)
  const upcomingEvents = useMemo(() => {
    return events.filter(e => {
      const now = new Date();
      return new Date(`${e.date}T${e.time}`) >= now;
    });
  }, [events]);

  // Events that have coordinates (for map markers)
  const eventsWithCoords = useMemo(() => {
    return upcomingEvents
      .map(e => ({
        event: e,
        coords: getEventCoords(e),
      }))
      .filter((item): item is { event: AppEvent; coords: { latitude: number; longitude: number } } =>
        item.coords !== null
      );
  }, [upcomingEvents]);

  const formatDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const updateExpanded = useCallback((expanded: boolean) => {
    setSheetExpanded(expanded);
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startHeight.value = sheetHeight.value;
    })
    .onUpdate((e) => {
      const newHeight = startHeight.value - e.translationY;
      sheetHeight.value = Math.max(SHEET_COLLAPSED, Math.min(SHEET_EXPANDED, newHeight));
    })
    .onEnd((e) => {
      const diff = sheetHeight.value - startHeight.value;
      const velocity = -e.velocityY;

      if (diff > SNAP_THRESHOLD || velocity > 500) {
        sheetHeight.value = withTiming(SHEET_EXPANDED, { duration: 250, easing: Easing.out(Easing.cubic) });
        runOnJS(updateExpanded)(true);
      } else if (diff < -SNAP_THRESHOLD || velocity < -500) {
        sheetHeight.value = withTiming(SHEET_COLLAPSED, { duration: 250, easing: Easing.out(Easing.cubic) });
        runOnJS(updateExpanded)(false);
      } else {
        // snap back
        const target = sheetHeight.value > (SHEET_COLLAPSED + SHEET_EXPANDED) / 2
          ? SHEET_EXPANDED : SHEET_COLLAPSED;
        sheetHeight.value = withTiming(target, { duration: 250, easing: Easing.out(Easing.cubic) });
        runOnJS(updateExpanded)(target === SHEET_EXPANDED);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  const handleIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetHeight.value, [SHEET_COLLAPSED, SHEET_EXPANDED], [1, 0.5]),
  }));

  const toggleSheet = useCallback(() => {
    if (sheetExpanded) {
      sheetHeight.value = withTiming(SHEET_COLLAPSED, { duration: 250, easing: Easing.out(Easing.cubic) });
      setSheetExpanded(false);
    } else {
      sheetHeight.value = withTiming(SHEET_EXPANDED, { duration: 250, easing: Easing.out(Easing.cubic) });
      setSheetExpanded(true);
    }
  }, [sheetExpanded]);

  const handleEventPress = useCallback((event: AppEvent) => {
    setSelectedEvent(event);
    const coords = getEventCoords(event);
    if (coords) {
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 400);
    }
    // Collapse sheet when selecting an event from the list
    if (sheetExpanded) {
      sheetHeight.value = withTiming(SHEET_COLLAPSED, { duration: 250, easing: Easing.out(Easing.cubic) });
      setSheetExpanded(false);
    }
  }, [sheetExpanded]);

  const renderEventItem = useCallback(({ item: event }: { item: AppEvent }) => {
    const isSelected = selectedEvent?.id === event.id;

    return (
      <Pressable
        style={[styles.listCard, isSelected && styles.listCardSelected]}
        onPress={() => handleEventPress(event)}
      >
        {/* Tags row */}
        <View style={styles.listCardTags}>
          <View style={styles.listCardTag}>
            <Text style={styles.listCardTagText}>{event.sportType}</Text>
          </View>
          <View style={styles.listCardTag}>
            <Text style={styles.listCardTagText}>{event.level}</Text>
          </View>
          <View style={styles.listCardPlayersTag}>
            <Ionicons name="people" size={12} color={Colors.primary} />
            <Text style={styles.listCardPlayersText}>
              {event.players.length}/{event.maxPlayers}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.listCardTitle} numberOfLines={1}>{event.title}</Text>

        {/* Meta row */}
        <View style={styles.listCardBottom}>
          <View style={styles.listCardMeta}>
            <Text style={styles.listCardMetaText}>
              {formatDate(event.date)} at {formatTime(event.time)}
            </Text>
            <Text style={styles.listCardMetaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
          <PlayerAvatars players={event.players} maxVisible={3} size={24} overlap={6} />
        </View>
      </Pressable>
    );
  }, [selectedEvent, handleEventPress]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
        onPress={() => setSelectedEvent(null)}
      >
        {eventsWithCoords.map(({ event, coords }) => (
          <Marker
            key={event.id}
            coordinate={coords}
            onPress={() => setSelectedEvent(event)}
          >
            <View style={[
              styles.markerContainer,
              selectedEvent?.id === event.id && styles.markerSelected,
            ]}>
              <View style={[
                styles.markerDot,
                { backgroundColor: SPORT_COLORS[event.sportType] || Colors.primary },
              ]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Events near you</Text>
          <View style={styles.eventCount}>
            <Text style={styles.eventCountText}>{eventsWithCoords.length}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Selected event popup card */}
      {selectedEvent && !sheetExpanded && (
        <Pressable
          style={styles.eventCard}
          onPress={() => router.push(`/event/${selectedEvent.id}`)}
        >
          {selectedEvent.coverImageUrl ? (
            <Image
              source={{ uri: selectedEvent.coverImageUrl }}
              style={styles.cardImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons
                name="calendar"
                size={24}
                color={Colors.inputText}
              />
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{selectedEvent.title}</Text>
            <Text style={styles.cardMeta}>
              {formatDate(selectedEvent.date)} at {formatTime(selectedEvent.time)}
            </Text>
            <Text style={styles.cardLocation} numberOfLines={1}>
              {selectedEvent.location}
            </Text>
            <View style={styles.cardFooter}>
              <PlayerAvatars players={selectedEvent.players} maxVisible={3} size={24} overlap={6} />
              <View style={styles.sportBadge}>
                <Text style={styles.sportBadgeText}>{selectedEvent.sportType}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.inputText} style={styles.cardChevron} />
        </Pressable>
      )}

      {/* My location button */}
      <Pressable
        style={[styles.locationButton, { bottom: SHEET_COLLAPSED + 16 }]}
        onPress={() => {
          mapRef.current?.animateToRegion(INITIAL_REGION, 500);
        }}
      >
        <Ionicons name="locate" size={20} color={Colors.text} />
      </Pressable>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.sheetHandleArea}>
            <Pressable onPress={toggleSheet} style={styles.sheetHandlePressable}>
              <Animated.View style={[styles.sheetHandle, handleIndicatorStyle]} />
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>
                  {upcomingEvents.length} {upcomingEvents.length === 1 ? 'Event' : 'Events'}
                </Text>
                <Ionicons
                  name={sheetExpanded ? 'chevron-down' : 'chevron-up'}
                  size={18}
                  color={Colors.inputText}
                />
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>

        <FlatList
          data={upcomingEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={sheetExpanded}
          ItemSeparatorComponent={null}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="calendar-outline" size={32} color={Colors.inputText} />
              <Text style={styles.emptyText}>No upcoming events with locations</Text>
            </View>
          }
        />
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'land', elementType: 'geometry', stylers: [{ color: '#1E1E1E' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#1a2e1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },

  // Header
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  eventCount: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  eventCountText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // Markers
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.markerBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  markerSelected: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.2 }],
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Selected event popup card
  eventCard: {
    position: 'absolute',
    bottom: SHEET_COLLAPSED + 16,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 5,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  cardImagePlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  cardMeta: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
  },
  cardLocation: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sportBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sportBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  cardChevron: {
    marginLeft: 4,
  },

  // Location button
  locationButton: {
    position: 'absolute',
    right: Spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 5,
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 20,
  },
  sheetHandleArea: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  sheetHandlePressable: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceLighter,
    marginBottom: Spacing.md,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: Spacing.sm,
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  // Event list
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  listCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: Spacing.md,
  },
  listCardSelected: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  listCardTags: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  listCardTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listCardTagText: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  listCardPlayersTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  listCardPlayersText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  listCardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  listCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listCardMeta: {
    gap: 2,
    flexShrink: 1,
  },
  listCardMetaText: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.inputText,
    fontSize: FontSize.md,
  },
});
