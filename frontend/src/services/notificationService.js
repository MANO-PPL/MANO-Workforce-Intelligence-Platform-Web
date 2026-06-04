import api from './api';

const API_BASE_URL = "/notifications";

export const notificationService = {
    // Get all notifications
    async getAll(limit = 20, unreadOnly = false) {
        try {
            const res = await api.get(`${API_BASE_URL}?limit=${limit}&unread_only=${unreadOnly}`);
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to fetch notifications");
        }
    },

    // Mark single notification as read
    async markAsRead(id) {
        try {
            const res = await api.put(`${API_BASE_URL}/${id}/read`);
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to mark notification as read");
        }
    },

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const res = await api.put(`${API_BASE_URL}/read-all`);
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to mark all notifications as read");
        }
    },

    // Register FCM Token
    async registerFCMToken(token, deviceType = 'web') {
        try {
            const res = await api.post(`${API_BASE_URL}/register-token`, { token, device_type: deviceType });
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to register FCM token");
        }
    }
};
