// src/hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { getActiveSocketURL } from '../api/client';

export const useSocket = (userId: string | null) => {
  const socketRef = useRef<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let s: any;

    const setup = async () => {
      try {
        const { io } = await import('socket.io-client');
        s = io(getActiveSocketURL(), {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });
        socketRef.current = s;
        setSocket(s);
        s.on('connect', () => {
          setIsConnected(true);
          s.emit('auth', userId);
        });
        s.on('disconnect', () => setIsConnected(false));
        s.on('connect_error', () => setIsConnected(false));
      } catch (e) {
        console.warn('[Socket] Not available:', e);
      }
    };

    setup();
    return () => {
      s?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [userId]);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  return { socket, isConnected, emit, on };
};

export default useSocket;
