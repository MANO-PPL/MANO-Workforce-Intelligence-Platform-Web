import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { requestAllPlatformPermissions, requestAndRegisterFCMToken, onForegroundMessage } from '../services/fcm';

const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    fetchNotifications: () => {},
    markAsRead: () => {},
    markAllAsRead: () => {}
});

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        
        try {
            // Fetch unread notifications + some history
            const response = await notificationService.getAll(20, false);
            if (response.ok) {
                setNotifications(response.data);
                setUnreadCount(response.unread_count);
            }
        } catch (error) {
            // If 403 Forbidden, it means the user isn't authorized for notifications (e.g., certain admin roles)
            if (error.message.includes("403") || error.message.includes("Forbidden")) {
                console.warn("Notifications are not enabled for this account type.");
            } else {
                console.error("Failed to fetch notifications:", error);
            }
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => 
                n.notification_id === id ? { ...n, is_read: 1 } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await notificationService.markAsRead(id);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            // Revert on error would be ideal, but simple logging for now
            fetchNotifications(); 
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);

            await notificationService.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
            fetchNotifications();
        }
    };

    const socket = useSocket();

    // Listen to real-time notifications via WebSocket connection
    useEffect(() => {
        if (user && socket) {
            const handleNewNotification = (notif) => {
                setNotifications(prev => {
                    if (prev.some(n => n.notification_id === notif.notification_id)) {
                        return prev;
                    }
                    return [notif, ...prev];
                });
                setUnreadCount(prev => prev + 1);

                // Trigger in-app toast notification aligned with the dark theme
                toast.info(
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[13px] text-white">{notif.title}</span>
                        <span className="text-[12px] text-gray-300 line-clamp-2">{notif.message}</span>
                    </div>,
                    {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progressClassName: "bg-indigo-500",
                        bodyClassName: "text-sm font-sans",
                        style: {
                            background: '#1A1A1A',
                            border: '1px solid #333333',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                        }
                    }
                );
            };

            socket.on('new_notification', handleNewNotification);
            socket.on('new-notification', handleNewNotification);
            return () => {
                socket.off('new_notification', handleNewNotification);
                socket.off('new-notification', handleNewNotification);
            };
        }
    }, [user, socket]);

    // Prompt for all permissions immediately when the platform is opened/mounted
    useEffect(() => {
        const timer = setTimeout(() => {
            requestAllPlatformPermissions();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Initial fetch and FCM Registration
    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Register FCM Push Token after a short delay
            const timer = setTimeout(() => {
                requestAndRegisterFCMToken();
            }, 3000);

            // Listen to foreground FCM push messages (fallback when socket is disconnected)
            const unsubscribeFCM = onForegroundMessage((payload) => {
                if (!socket || !socket.connected) {
                    toast.info(
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[13px] text-white">
                                {payload.notification?.title || 'New Notification'}
                            </span>
                            <span className="text-[12px] text-gray-300 line-clamp-2">
                                {payload.notification?.body || ''}
                            </span>
                        </div>,
                        {
                            position: "top-right",
                            autoClose: 5000,
                            style: {
                                background: '#1A1A1A',
                                border: '1px solid #333333',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                            }
                        }
                    );
                }
            });

            return () => {
                clearTimeout(timer);
                if (typeof unsubscribeFCM === 'function') {
                    unsubscribeFCM();
                }
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications, socket]);

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            fetchNotifications, 
            markAsRead, 
            markAllAsRead 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
