"use client";

import { useState, useEffect, useCallback } from 'react';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { Notification } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [session]);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
            className="origin-top-right absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
            onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-2 border-b">
            <h3 className="font-semibold text-gray-800">通知</h3>
          </div>
          <ul className="py-1">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <li
                  key={notification.id}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  className={`p-3 hover:bg-gray-100 ${notification.read ? 'text-gray-500' : 'font-semibold text-gray-900 cursor-pointer'}`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                    </p>
                    {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4 text-sm text-gray-500 text-center">通知はありません。</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 