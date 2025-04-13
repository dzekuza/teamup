import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { Notification } from '../types';

export const createNotification = async (notification: Omit<Notification, 'id'>) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, notification);
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
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
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    callback(notifications);
  });
}; 