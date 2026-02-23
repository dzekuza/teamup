import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import type { AppEvent } from '../hooks/useEvents';

interface EventCardProps {
  event: AppEvent;
  onPress: () => void;
}

const SPORT_ICONS: Record<string, string> = {
  Padel: '🎾',
  Tennis: '🎾',
  Running: '🏃',
  Soccer: '⚽',
  Basketball: '🏀',
  Cycling: '🚴',
};

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => time.slice(0, 5);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.sportBadge}>
          <Text style={styles.sportIcon}>{SPORT_ICONS[event.sportType] || '🏅'}</Text>
          <Text style={styles.sportText}>{event.sportType}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{event.level}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{event.title}</Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{formatDate(event.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{formatTime(event.time)}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.players}>
          <Ionicons name="people-outline" size={16} color={Colors.primary} />
          <Text style={styles.playerCount}>
            {event.playerCount}/{event.maxPlayers}
          </Text>
        </View>
        {event.price > 0 && (
          <Text style={styles.price}>€{event.price}</Text>
        )}
        {event.isPrivate && (
          <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sportIcon: {
    fontSize: FontSize.md,
  },
  sportText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  levelBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  levelText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  details: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  players: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  playerCount: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  price: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
