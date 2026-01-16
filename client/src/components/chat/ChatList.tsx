import React from 'react';
import { MessageCircle, Users } from 'lucide-react';

interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  groupPhoto?: string;
  members: Array<{
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
  lastMessage?: {
    content: string;
    sender: {
      id: string;
      username: string;
      first_name?: string;
    };
    timestamp: string;
  };
  updatedAt: string;
  unreadCount?: number;
}

interface ChatListProps {
  chats: Chat[];
  currentUserId: string;
  selectedChatId?: string;
  onSelectChat: (chat: Chat) => void;
  onlineUsers?: Set<string>;
}

export const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  currentUserId, 
  selectedChatId,
  onSelectChat,
  onlineUsers = new Set()
}) => {
  const getOtherUser = (chat: Chat) => {
    return chat.members.find(m => m.id !== currentUserId);
  };

  const getUserDisplayName = (user: any) => {
    if (user?.first_name) {
      return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    return `User ${user?.username?.slice(-4) || '0000'}`;
  };

  const getAvatarUrl = (avatar?: string) => {
    if (avatar) {
      return `http://localhost:3001${avatar}`;
    }
    return null;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-white font-medium mb-2">No chats yet</h3>
        <p className="text-gray-400 text-sm">
          Start a new conversation by searching for contacts
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const isGroup = chat.type === 'group';
        const otherUser = isGroup ? null : getOtherUser(chat);
        const isSelected = chat.id === selectedChatId;
        const isUserOnline = otherUser?.id && onlineUsers.has(otherUser.id);

        // Display name
        const displayName = isGroup 
          ? chat.name || 'Unnamed Group'
          : getUserDisplayName(otherUser);

        // Avatar
        const avatarUrl = isGroup 
          ? (chat.groupPhoto ? getAvatarUrl(chat.groupPhoto) : null)
          : getAvatarUrl(otherUser?.avatar);

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
              isSelected ? 'bg-white/10' : ''
            }`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-telegram-blue flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                />
              ) : isGroup ? (
                <Users className="w-6 h-6 text-white" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              {/* Online indicator - only for private chats */}
              {!isGroup && isUserOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0e1621]"></div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-medium truncate">
                  {displayName}
                </h3>
                <div className="flex items-center gap-2">
                  {chat.lastMessage && (
                    <span className="text-xs text-gray-500">
                      {formatTime(chat.lastMessage.timestamp)}
                    </span>
                  )}
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <div className="bg-telegram-blue text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
              {chat.lastMessage ? (
                <p className="text-sm text-gray-400 truncate">
                  {isGroup && chat.lastMessage.sender.id !== currentUserId && (
                    <span className="text-telegram-blue">
                      {chat.lastMessage.sender.first_name || chat.lastMessage.sender.username}:{' '}
                    </span>
                  )}
                  {chat.lastMessage.sender.id === currentUserId ? 'You: ' : ''}
                  {chat.lastMessage.content}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">No messages yet</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
