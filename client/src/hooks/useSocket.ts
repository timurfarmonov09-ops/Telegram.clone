import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useSocket = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      
      // Notify server that user is online
      socket.emit('user-online', userId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // User status events
    socket.on('user-status-changed', ({ userId: changedUserId, isOnline }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(changedUserId);
        } else {
          newSet.delete(changedUserId);
        }
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const joinChat = (chatId: string) => {
    socketRef.current?.emit('join-chat', chatId);
  };

  const leaveChat = (chatId: string) => {
    socketRef.current?.emit('leave-chat', chatId);
  };

  const sendMessage = (chatId: string, userId: string, content: string) => {
    socketRef.current?.emit('send-message', { chatId, userId, content });
  };

  const startTyping = (chatId: string, userId: string, username: string) => {
    socketRef.current?.emit('typing-start', { chatId, userId, username });
  };

  const stopTyping = (chatId: string, userId: string) => {
    socketRef.current?.emit('typing-stop', { chatId, userId });
  };

  const onNewMessage = (callback: (message: any) => void) => {
    socketRef.current?.on('new-message', callback);
    return () => {
      socketRef.current?.off('new-message', callback);
    };
  };

  const onUserTyping = (callback: (data: { userId: string; username?: string; isTyping: boolean }) => void) => {
    socketRef.current?.on('user-typing', callback);
    return () => {
      socketRef.current?.off('user-typing', callback);
    };
  };

  const onMessagesRead = (callback: (data: { chatId: string; readBy: string; count: number }) => void) => {
    socketRef.current?.on('messages-read', callback);
    return () => {
      socketRef.current?.off('messages-read', callback);
    };
  };

  const onUnreadCountUpdate = (callback: (data: { chatId: string; increment: boolean }) => void) => {
    socketRef.current?.on('unread-count-update', callback);
    return () => {
      socketRef.current?.off('unread-count-update', callback);
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onUserTyping,
    onMessagesRead,
    onUnreadCountUpdate,
  };
};
