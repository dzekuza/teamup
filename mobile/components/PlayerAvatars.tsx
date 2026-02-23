import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface Player {
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
}

interface PlayerAvatarsProps {
  players: Player[];
  maxVisible?: number;
  size?: number;
  overlap?: number;
  borderColor?: string;
  borderWidth?: number;
}

export const PlayerAvatars: React.FC<PlayerAvatarsProps> = ({
  players,
  maxVisible = 4,
  size = 32,
  overlap = 8,
  borderColor = Colors.backgroundDark,
  borderWidth = 2,
}) => {
  const visible = players.slice(0, maxVisible);
  const overflow = players.length - maxVisible;

  return (
    <View
      style={[styles.container, { height: size }]}
      accessibilityLabel={`${players.length} player${players.length !== 1 ? 's' : ''}`}
    >
      {visible.map((player, index) => (
        <View
          key={player.user_id}
          style={[
            styles.avatarWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: maxVisible - index,
              borderColor,
              borderWidth,
            },
          ]}
        >
          {player.photo_url ? (
            <Image
              source={{ uri: player.photo_url }}
              style={{
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
                borderRadius: (size - borderWidth * 2) / 2,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  width: size - borderWidth * 2,
                  height: size - borderWidth * 2,
                  borderRadius: (size - borderWidth * 2) / 2,
                },
              ]}
            >
              <Ionicons name="person" size={size * 0.45} color={Colors.textMuted} />
            </View>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflowBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlap,
              borderColor,
              borderWidth,
            },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.35 }]}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.text,
    fontWeight: '600',
  },
  overflowBadge: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
