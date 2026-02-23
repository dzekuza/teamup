import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Brand } from '@/constants/theme';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: AppButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === 'primary';

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={(!disabled && !loading) ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={{ minHeight: 44, minWidth: 44 }}
    >
      <Animated.View
        style={[
          styles.button,
          isPrimary ? styles.primary : styles.secondary,
          (disabled || loading) && styles.disabledOpacity,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? Brand.accentDark : Brand.accent} />
        ) : (
          <Text
            style={[
              styles.label,
              isPrimary ? styles.labelPrimary : styles.labelSecondary,
            ]}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: Brand.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Brand.accent,
  },
  disabledOpacity: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelPrimary: {
    color: Brand.accentDark,
  },
  labelSecondary: {
    color: Brand.accent,
  },
});
