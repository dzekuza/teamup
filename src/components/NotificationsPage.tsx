import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Notification {
  id: string;
  type: string;
  eventId?: string;
  eventTitle?: string;
  createdBy: string;
  createdAt: string;
  read: boolean;
  userId: string;
  message?: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(notificationsQuery);
        const notificationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        
        setNotifications(notificationData);
        
        // Mark all unread notifications as read
        const unreadNotifications = notificationData.filter(notification => !notification.read);
        if (unreadNotifications.length > 0) {
          for (const notification of unreadNotifications) {
            await updateDoc(doc(db, 'notifications', notification.id), {
              read: true
            });
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_joined':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-900 bg-opacity-20 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'friend_request':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900 bg-opacity-20 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        );
      case 'event_update':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-900 bg-opacity-20 text-yellow-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 bg-opacity-20 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'event_joined':
        return `A player joined your event: ${notification.eventTitle}`;
      case 'friend_request':
        return 'You received a new friend request';
      case 'event_update':
        return `Event updated: ${notification.eventTitle}`;
      default:
        return notification.message || 'New notification';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C1FF2F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {notifications.length === 0 ? (
        <div className="bg-[#1E1E1E] rounded-xl p-8 text-center">
          <p className="text-gray-400">You don't have any notifications yet</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`bg-[#1E1E1E] rounded-xl p-4 flex items-center gap-4 ${
              !notification.read ? 'border-l-4 border-[#C1FF2F]' : ''
            }`}
          >
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <p className="text-white">{getNotificationText(notification)}</p>
              <p className="text-gray-400 text-sm">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}; 