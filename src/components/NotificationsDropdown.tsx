import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Notification } from '../types';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

export const NotificationsDropdown: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    navigate(`/event/${notification.eventId}`);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="relative p-2 text-gray-400 hover:text-white focus:outline-none">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black transform translate-x-1/2 -translate-y-1/2 bg-[#C1FF2F] rounded-full">
            {unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right rounded-3xl bg-[#1E1E1E] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-[#2A2A2A]">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-[#2A2A2A]">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#C1FF2F] hover:text-[#B1EF1F] transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className={`${
                          active ? 'bg-[#2A2A2A]' : ''
                        } ${
                          !notification.read ? 'bg-[#2A2A2A]/50' : ''
                        } w-full px-4 py-2 text-left text-sm transition-colors`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.eventTitle}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="ml-2">
                              <div className="h-2 w-2 rounded-full bg-[#C1FF2F]"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))
              )}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}; 