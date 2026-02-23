import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../hooks/useNotifications';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ScreenEnter } from '../../components/ScreenEnter';

export default function NotificationsScreen() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'event_joined': return 'person-add-outline';
      case 'event_cancelled': return 'close-circle-outline';
      case 'new_event': return 'calendar-outline';
      default: return 'notifications-outline';
    }
  };

  const getTitle = (item: typeof notifications[number]) => {
    switch (item.type) {
      case 'new_event': return `New event: ${item.event_title || 'Untitled'}`;
      case 'event_joined': return `Someone joined: ${item.event_title || 'Untitled'}`;
      case 'event_cancelled': return `Event cancelled: ${item.event_title || 'Untitled'}`;
      default: return item.event_title || 'Notification';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenEnter>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.some(n => !n.read) && (
            <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => { }} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.notifCard, !item.read && styles.notifUnread]}
              onPress={() => markAsRead(item.id)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={getIcon(item.type)} size={20} color={Colors.primary} />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle} numberOfLines={2}>{getTitle(item)}</Text>
                <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No notifications</Text>
                <Text style={styles.emptySubtext}>You're all caught up!</Text>
              </View>
            ) : null
          }
        />
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  markAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifUnread: {
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreenBorder,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  notifBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  notifTime: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginLeft: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
