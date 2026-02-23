import { supabase } from '../lib/supabase';
import type { Notification } from '../types/supabase';

type NotificationInsert = Omit<Notification, 'id' | 'created_at' | 'read'>;

export const createNotification = async (notification: NotificationInsert) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  // Initial fetch
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      callback(data);
    }
  };

  fetchNotifications();

  // Subscribe to realtime changes
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        // Re-fetch on any change
        fetchNotifications();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};
