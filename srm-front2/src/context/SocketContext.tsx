import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Only connect if user is logged in (has token in cookie)
        const hasToken = document.cookie.includes('token=');
        
        if (hasToken) {
            const newSocket = io(API_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('🔌 Connected to Socket.io');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('🔌 Disconnected from Socket.io');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('🔌 Socket connection error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [API_URL]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
