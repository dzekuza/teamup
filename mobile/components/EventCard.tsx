import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, LineHeight, FontWeight } from '../constants/theme';
import { PlayerAvatars } from './PlayerAvatars';
import type { AppEvent } from '../hooks/useEvents';

// ── Constants ────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_IMAGE_HEIGHT = 220;
const COMPACT_IMAGE_HEIGHT = 120;

export const COMPACT_CARD_WIDTH = SCREEN_WIDTH * 0.72;

// ── Sport icon maps ─────────────────────────────────────────────────
const SPORT_EMOJI: Record<string, string> = {
  Padel: '🎾',
  Tennis: '🎾',
  Running: '🏃',
  Soccer: '⚽',
  Basketball: '🏀',
  Cycling: '🚴',
  Volleyball: '🏐',
};

const SPORT_IONICONS: Record<string, string> = {
  Padel: 'tennisball',
  Tennis: 'tennisball-outline',
  Running: 'walk',
  Soccer: 'football',
  Basketball: 'basketball',
  Cycling: 'bicycle',
  Volleyball: 'basketball-outline',
};

// ── Shared helpers ──────────────────────────────────────────────────
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

// ── Props ───────────────────────────────────────────────────────────
interface EventCardProps {
  event: AppEvent;
  onPress: () => void;
  variant?: 'default' | 'compact';
}

// ── Component ───────────────────────────────────────────────────────
export const EventCard: React.FC<EventCardProps> = ({ event, onPress, variant = 'default' }) => {
  if (variant === 'compact') {
    return (
      <Pressable style={compactStyles.card} onPress={onPress}>
        {/* Image area */}
        <View style={compactStyles.imageContainer}>
          {event.coverImageUrl ? (
            <Image
              source={{ uri: event.coverImageUrl }}
              style={compactStyles.coverImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={compactStyles.coverPlaceholder}>
              <Ionicons
                name={(SPORT_IONICONS[event.sportType] || 'calendar') as any}
                size={32}
                color={Colors.inputText}
              />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', Colors.overlayGradientEnd]}
            style={compactStyles.gradient}
          />

          {/* Sport + players badge on image */}
          <View style={compactStyles.imageBadges}>
            <View style={compactStyles.sportChip}>
              <Text style={compactStyles.sportChipText}>{event.sportType}</Text>
            </View>
            <View style={compactStyles.playersChip}>
              <Ionicons name="people" size={12} color={Colors.primary} />
              <Text style={compactStyles.playersChipText}>
                {event.playerCount}/{event.maxPlayers}
              </Text>
            </View>
          </View>

          {/* Title overlaid at bottom of image */}
          <View style={compactStyles.imageOverlay}>
            <Text style={compactStyles.title} numberOfLines={1}>{event.title}</Text>
          </View>
        </View>

        {/* Bottom info */}
        <View style={compactStyles.content}>
          <View style={compactStyles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.inputText} />
            <Text style={compactStyles.metaText}>
              {formatDate(event.date)} at {formatTime(event.time)}
            </Text>
          </View>
          <View style={compactStyles.metaRow}>
            <Ionicons name="location-outline" size={13} color={Colors.inputText} />
            <Text style={compactStyles.metaText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Default variant (replaces MainEventCard)
  return (
    <Pressable style={defaultStyles.card} onPress={onPress}>
      {/* Cover image */}
      <View style={defaultStyles.imageContainer}>
        {event.coverImageUrl ? (
          <Image
            source={{ uri: event.coverImageUrl }}
            style={defaultStyles.coverImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={defaultStyles.coverPlaceholder}>
            <Text style={defaultStyles.coverPlaceholderIcon}>
              {SPORT_EMOJI[event.sportType] || '🏅'}
            </Text>
          </View>
        )}

        {/* Joined badge — top left */}
        <View style={defaultStyles.joinedBadge}>
          <Ionicons name="people" size={20} color={Colors.surface} />
          <Text style={defaultStyles.joinedBadgeText}>
            {event.playerCount}/{event.maxPlayers} joined
          </Text>
        </View>

        {/* Like + Share buttons — bottom right */}
        <View style={defaultStyles.imageActions}>
          <Pressable style={defaultStyles.actionButton}>
            <Ionicons name="heart-outline" size={24} color={Colors.text} />
          </Pressable>
          <Pressable style={defaultStyles.actionButton}>
            <Ionicons name="share-outline" size={24} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Content area */}
      <View style={defaultStyles.content}>
        {/* Tags row */}
        <View style={defaultStyles.tagsRow}>
          <View style={defaultStyles.tag}>
            <Text style={defaultStyles.tagText}>{event.sportType}</Text>
          </View>
          <View style={defaultStyles.tag}>
            <Text style={defaultStyles.tagText}>{event.level}</Text>
          </View>
          <View style={defaultStyles.tag}>
            <Text style={defaultStyles.tagText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={defaultStyles.title} numberOfLines={2}>{event.title}</Text>

        {/* Bottom row: meta left, avatars right */}
        <View style={defaultStyles.bottomRow}>
          <View style={defaultStyles.metaCol}>
            <Text style={defaultStyles.metaText}>
              {formatDate(event.date)} at {formatTime(event.time)}
            </Text>
            <Text style={defaultStyles.metaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
          <PlayerAvatars players={event.players} maxVisible={4} size={32} />
        </View>
      </View>
    </Pressable>
  );
};

// ── Default variant styles (MainEventCard) ──────────────────────────
const defaultStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: DEFAULT_IMAGE_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: DEFAULT_IMAGE_HEIGHT,
  },
  coverPlaceholder: {
    width: '100%',
    height: DEFAULT_IMAGE_HEIGHT,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderIcon: {
    fontSize: 48,
  },

  // Joined badge — top left, mainColor bg
  joinedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.mainColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinedBadgeText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: FontSize.md,
  },

  // Action buttons — bottom right of image
  imageActions: {
    position: 'absolute',
    right: 16,
    top: 164,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content below image
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.darkGreenBorder,
  },
  tagText: {
    color: Colors.inputText,
    fontSize: FontSize.md,
    fontWeight: '400',
    lineHeight: LineHeight.md,
  },

  // Title
  title: {
    color: Colors.textLight,
    fontSize: FontSize.xxl,
    fontWeight: '600',
    lineHeight: LineHeight.xxl,
  },

  // Bottom row: meta + avatars
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaCol: {
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    color: Colors.inputText,
    fontSize: FontSize.lg,
    fontWeight: '400',
    lineHeight: LineHeight.lg,
  },
});

// ── Compact variant styles (UpcomingEventCard) ──────────────────────
const compactStyles = StyleSheet.create({
  card: {
    width: COMPACT_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    width: '100%',
    height: COMPACT_IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: COMPACT_IMAGE_HEIGHT,
  },
  coverPlaceholder: {
    width: '100%',
    height: COMPACT_IMAGE_HEIGHT,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: COMPACT_IMAGE_HEIGHT * 0.7,
  },

  // Badges on image
  imageBadges: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sportChip: {
    backgroundColor: Colors.overlayDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderCurve: 'continuous',
  },
  sportChipText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  playersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.overlayDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderCurve: 'continuous',
  },
  playersChipText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Title on image
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: FontWeight.bold,
  },

  // Bottom content
  content: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
    flexShrink: 1,
  },
});
