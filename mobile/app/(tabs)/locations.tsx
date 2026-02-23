import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PADEL_LOCATIONS, Location } from '../../constants/locations';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

export default function LocationsScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const renderLocation = ({ item }: { item: Location }) => (
    <Pressable
      style={[
        styles.locationCard,
        selectedLocation?.id === item.id && styles.locationCardActive,
      ]}
      onPress={() => setSelectedLocation(selectedLocation?.id === item.id ? null : item)}
    >
      <View style={styles.locationIcon}>
        <Ionicons name="location" size={24} color={Colors.primary} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
        <View style={styles.coordRow}>
          <Ionicons name="navigate-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.coordText}>
            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Locations</Text>
        <Text style={styles.headerSubtitle}>Padel venues in Vilnius</Text>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.mapSubtext}>
          {PADEL_LOCATIONS.length} venues available
        </Text>
      </View>

      <FlatList
        data={PADEL_LOCATIONS}
        keyExtractor={item => item.id}
        renderItem={renderLocation}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  headerSubtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.xs },
  mapPlaceholder: {
    height: 180, backgroundColor: Colors.surface, marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  mapText: { color: Colors.textSecondary, fontSize: FontSize.lg, fontWeight: '600', marginTop: Spacing.sm },
  mapSubtext: { color: Colors.textMuted, fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  locationCardActive: { borderColor: Colors.primary },
  locationIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  locationInfo: { flex: 1 },
  locationName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
  locationAddress: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 2 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  coordText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
