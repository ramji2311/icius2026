import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCurrentBaseUrl, getSecondaryBaseUrl } from '../config/api';

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinRoom: (room: string) => void;
    leaveRoom: (room: string) => void;
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Get token from cookie
        const getToken = () => {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
            return tokenCookie ? tokenCookie.split('=')[1] : null;
        };

        const token = getToken();
        if (!token) {
            console.log('No token found, WebSocket connection skipped');
            return;
        }

        let currentSocket: Socket | null = null;
        let isUnmounted = false;

        const connectSocket = (url: string, isFallback = false) => {
            if (isUnmounted) return;

            if (currentSocket) {
                currentSocket.close();
            }

            console.log(`🔌 Initializing WebSocket connection to: ${url}`);
            const socketInstance = io(url, {
                auth: { token },
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            socketInstance.on('connect', () => {
                console.log('WebSocket connected:', socketInstance.id);
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                setIsConnected(false);

                // If primary connection fails and we haven't tried fallback yet
                const secondaryUrl = getSecondaryBaseUrl();
                if (!isFallback && url !== secondaryUrl) {
                    console.warn(`🔄 WebSocket connection failed on ${url}. Attempting failover to ${secondaryUrl}...`);
                    setTimeout(() => {
                        connectSocket(secondaryUrl, true);
                    }, 1000);
                }
            });

            currentSocket = socketInstance;
            setSocket(socketInstance);
        };

        connectSocket(getCurrentBaseUrl());

        // Cleanup on unmount
        return () => {
            isUnmounted = true;
            if (currentSocket) {
                currentSocket.close();
            }
        };
    }, []);

    const joinRoom = useCallback((room: string) => {
        if (socket) {
            socket.emit('join-room', room);
            console.log(`Joined room: ${room}`);
        }
    }, [socket]);

    const leaveRoom = useCallback((room: string) => {
        if (socket) {
            socket.emit('leave-room', room);
            console.log(`Left room: ${room}`);
        }
    }, [socket]);

    const emit = useCallback((event: string, data: any) => {
        if (socket) {
            socket.emit(event, data);
        }
    }, [socket]);

    const on = useCallback((event: string, callback: (data: any) => void) => {
        if (socket) {
            socket.on(event, callback);
        }
    }, [socket]);

    const off = useCallback((event: string, callback: (data: any) => void) => {
        if (socket) {
            socket.off(event, callback);
        }
    }, [socket]);

    const value = {
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        emit,
        on,
        off
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

// Custom hook for editor-specific WebSocket events
export const useEditorWebSocket = () => {
    const { socket, isConnected, on, off } = useWebSocket();

    useEffect(() => {
        if (!socket) return;

        // Listen for paper updates
        const handlePaperUpdate = (data: any) => {
            console.log('Paper updated:', data);
        };

        const handleNewSubmission = (data: any) => {
            console.log('New paper submission:', data);
        };

        const handleReviewAssigned = (data: any) => {
            console.log('Review assigned:', data);
        };

        on('paper:updated', handlePaperUpdate);
        on('paper:new', handleNewSubmission);
        on('review:assigned', handleReviewAssigned);

        return () => {
            off('paper:updated', handlePaperUpdate);
            off('paper:new', handleNewSubmission);
            off('review:assigned', handleReviewAssigned);
        };
    }, [socket, on, off]);

    return { isConnected };
};

// Custom hook for admin-specific WebSocket events
export const useAdminWebSocket = () => {
    const { socket, isConnected, on, off } = useWebSocket();

    useEffect(() => {
        if (!socket) return;

        // Listen for system-wide updates
        const handleSystemUpdate = (data: any) => {
            console.log('System update:', data);
        };

        const handleNewUser = (data: any) => {
            console.log('New user registered:', data);
        };

        const handleNewPayment = (data: any) => {
            console.log('New payment:', data);
        };

        on('system:update', handleSystemUpdate);
        on('user:new', handleNewUser);
        on('payment:new', handleNewPayment);

        return () => {
            off('system:update', handleSystemUpdate);
            off('user:new', handleNewUser);
            off('payment:new', handleNewPayment);
        };
    }, [socket, on, off]);

    return { isConnected };
};
