import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

const SPORTS = [
  { key: 'All', icon: 'trophy-outline' as const, label: 'All' },
  { key: 'Soccer', icon: 'football-outline' as const, label: 'Soccer' },
  { key: 'Padel', icon: 'tennisball-outline' as const, label: 'Padel' },
  { key: 'Tennis', icon: 'tennisball-outline' as const, label: 'Tennis' },
  { key: 'Basketball', icon: 'basketball-outline' as const, label: 'Basketball' },
  { key: 'Volleyball', icon: 'tennisball-outline' as const, label: 'Volleyball' },
  { key: 'Rollerskating', icon: 'fitness-outline' as const, label: 'Rollerskating' },
  { key: 'Cycling', icon: 'bicycle-outline' as const, label: 'Cycling' },
  { key: 'Running', icon: 'walk-outline' as const, label: 'Running' },
];

interface SportFilterChipsProps {
  selected: string;
  onSelect: (sport: string) => void;
}

export const SportFilterChips: React.FC<SportFilterChipsProps> = ({ selected, onSelect }) => {
  return (
    <FlatList
      horizontal
      data={SPORTS}
      keyExtractor={item => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const active = selected === item.key;
        return (
          <Pressable
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(item.key);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${item.label}`}
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={item.icon}
              size={14}
              color={active ? Colors.textOnPrimary : Colors.textSecondary}
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
});
