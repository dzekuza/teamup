import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PADEL_LOCATIONS, Location } from '../../constants/locations';
import { useEvents } from '../../hooks/useEvents';
import { Colors, Spacing, BorderRadius, FontSize, LineHeight as ThemeLineHeight, FontWeight } from '../../constants/theme';

const LineHeight = ThemeLineHeight ?? {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 22,
  xl: 24,
  xxl: 28,
  xxxl: 36,
  hero: 42,
};

export default function LocationsScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { events } = useEvents();

  // Count upcoming events per venue
  const eventCountByVenue = useMemo(() => {
    const now = new Date();
    const counts: Record<string, number> = {};
    for (const e of events) {
      if (new Date(`${e.date}T${e.time}`) < now) continue;
      const loc = e.location.toLowerCase();
      for (const venue of PADEL_LOCATIONS) {
        const venueLower = venue.name.toLowerCase();
        if (
          loc.includes(venueLower) ||
          venueLower.includes(loc) ||
          loc.split(/[|,\s]+/).some(w => w.length > 3 && venueLower.includes(w)) ||
          venueLower.split(/[|,\s]+/).some(w => w.length > 3 && loc.includes(w))
        ) {
          counts[venue.id] = (counts[venue.id] || 0) + 1;
          break;
        }
      }
    }
    return counts;
  }, [events]);

  const openInMaps = (venue: Location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
    Linking.openURL(url);
  };

  const renderLocation = ({ item }: { item: Location }) => {
    const isSelected = selectedId === item.id;
    const eventCount = eventCountByVenue[item.id] || 0;

    return (
      <Pressable
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedId(isSelected ? null : item.id)}
      >
        {/* Top row: icon + info + chevron */}
        <View style={styles.topRow}>
          <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
            <Ionicons name="tennisball" size={18} color={isSelected ? Colors.textOnPrimary : Colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          </View>
          {eventCount > 0 && (
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>{eventCount}</Text>
            </View>
          )}
          <Ionicons
            name={isSelected ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={Colors.textMuted}
          />
        </View>

        {/* Expanded detail */}
        {isSelected && (
          <View style={styles.expanded}>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Ionicons name="navigate-outline" size={13} color={Colors.inputText} />
              <Text style={styles.detailText}>
                {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
              </Text>
            </View>
            {eventCount > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={13} color={Colors.inputText} />
                <Text style={styles.detailText}>
                  {eventCount} upcoming {eventCount === 1 ? 'event' : 'events'}
                </Text>
              </View>
            )}
            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={() => openInMaps(item)}>
                <Ionicons name="map-outline" size={14} color={Colors.primary} />
                <Text style={styles.actionText}>Directions</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/map')}
              >
                <Ionicons name="locate-outline" size={14} color={Colors.primary} />
                <Text style={styles.actionText}>View on map</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Locations</Text>
          <Pressable style={styles.mapChip} onPress={() => router.push('/map')}>
            <Ionicons name="map" size={14} color={Colors.text} />
            <Text style={styles.mapChipText}>Map</Text>
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>
          {PADEL_LOCATIONS.length} padel venues in Vilnius
        </Text>
      </View>

      <FlatList
        data={PADEL_LOCATIONS}
        keyExtractor={item => item.id}
        renderItem={renderLocation}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    lineHeight: LineHeight.xxl,
    fontWeight: FontWeight.extrabold,
  },
  headerSubtitle: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    marginTop: Spacing.xs,
  },
  mapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapChipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // List
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
    gap: Spacing.sm,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderCurve: 'continuous',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: Colors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
  },
  iconBoxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: FontWeight.semibold,
  },
  address: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
  },
  eventBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  eventBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Expanded
  expanded: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
  },
  actionText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
