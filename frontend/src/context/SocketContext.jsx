import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api, { getAccessToken, setAccessToken } from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Connect to the WebSocket server sharing the same origin / proxy path
        // Use a dynamic auth function so the latest refreshed token is sent on every reconnect
        const newSocket = io({
            path: '/socket.io/',
            auth: (cb) => {
                const token = getAccessToken();
                cb({
                    token: token ? `Bearer ${token}` : undefined
                });
            },
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 6000,
            timeout: 15000
        });

        newSocket.on('connect', () => {
            console.log("⚡ Socket connected successfully. ID:", newSocket.id);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn("🔌 Socket disconnected. Reason:", reason);
        });

        newSocket.on('connect_error', async (error) => {
            console.warn("⚠️ Socket connection error:", error.message);
            
            // If the socket fails to authenticate, try to refresh the token in-place
            if (error.message && (
                error.message.toLowerCase().includes('auth') || 
                error.message.toLowerCase().includes('token') || 
                error.message.toLowerCase().includes('signature') || 
                error.message.toLowerCase().includes('expire')
            )) {
                try {
                    const res = await api.post('/auth/refresh');
                    if (res.data?.accessToken) {
                        setAccessToken(res.data.accessToken);
                        console.log("🔄 Socket token refreshed successfully. Retrying connection...");
                        newSocket.connect();
                    }
                } catch (refreshErr) {
                    console.error("❌ Socket auth token refresh failed:", refreshErr);
                }
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
