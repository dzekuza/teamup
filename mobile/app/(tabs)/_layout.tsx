import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';
import { useNotifications } from '../../hooks/useNotifications';

// Spring config — snappy but smooth
const SPRING = { damping: 14, stiffness: 200, mass: 0.6 };
const TIMING = { duration: 200, easing: Easing.out(Easing.quad) };

/**
 * Animated tab icon — spring-scales up and fades in on focus.
 * Shared values are always initialized to constants; effects drive changes.
 */
function AnimatedTabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) {
  // ✅ Initialize with constants, never props — avoids write-during-render
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);

  // Drive animation from effect only
  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1, SPRING);
    opacity.value = withTiming(focused ? 1 : 0.55, TIMING);
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

/**
 * Notifications icon with the same focus animation + unread badge.
 */
function AnimatedNotificationIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  const { unreadCount } = useNotifications();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1, SPRING);
    opacity.value = withTiming(focused ? 1 : 0.55, TIMING);
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Create (+) button — squishes on press, springs back on release.
 */
function CreateButton() {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={styles.createButton}
      onPressIn={() => { scale.value = withSpring(0.88, SPRING); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING); }}
      onPress={() => router.push('/create-event')}
    >
      <Animated.View style={[styles.createButtonInner, animStyle]}>
        <Ionicons name="add" size={26} color={Colors.backgroundDark} />
      </Animated.View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Smooth cross-fade between tab screens — native iOS feel
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: Colors.backgroundDark,
          borderTopColor: Colors.darkGreenBorder,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="search-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="calendar-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarButton: () => <CreateButton />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedNotificationIcon color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="person-circle-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="community" options={{ href: null }} />
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="locations" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  createButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
