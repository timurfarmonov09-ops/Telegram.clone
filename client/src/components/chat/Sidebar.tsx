import React from 'react';
import { Search, Menu, User, Bell, Moon, Settings, LogOut, MessageCircle, Users } from 'lucide-react';
import { User as UserType } from '@/types';
import { UserSearch } from './UserSearch';
import { ChatList } from './ChatList';
import { CreateGroupModal } from './CreateGroupModal';
import { chatAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface SidebarProps {
  user: UserType;
  onLogout: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onSelectChat?: (chat: any) => void;
  onlineUsers?: Set<string>;
  socket?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  onProfileClick,
  onSettingsClick,
  onSelectChat,
  onlineUsers = new Set(),
  socket
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [chats, setChats] = React.useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = React.useState<string>();
  const [isLoadingChats, setIsLoadingChats] = React.useState(true);

  // Load chats on mount
  React.useEffect(() => {
    loadChats();
  }, []);

  // Listen for unread count updates
  React.useEffect(() => {
    if (!socket) return;

    const unsubscribe = socket.onUnreadCountUpdate((data: { chatId: string; increment: boolean }) => {
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === data.chatId) {
            const currentCount = chat.unreadCount || 0;
            return {
              ...chat,
              unreadCount: data.increment ? currentCount + 1 : Math.max(0, currentCount - 1)
            };
          }
          return chat;
        })
      );
    });

    return unsubscribe;
  }, [socket]);

  const loadChats = async () => {
    try {
      setIsLoadingChats(true);
      const fetchedChats = await chatAPI.getChats();
      setChats(fetchedChats);
    } catch (error: any) {
      console.error('Failed to load chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleSelectUser = async (selectedUser: any) => {
    try {
      setShowSearch(false);
      toast.loading('Opening chat...');
      
      // Create or get chat
      const chat = await chatAPI.createChat(selectedUser.id);
      
      toast.dismiss();
      toast.success('Chat opened!');
      
      // Reload chats to show new chat
      await loadChats();
      
      // Select the chat
      setSelectedChatId(chat.id);
      if (onSelectChat) {
        onSelectChat(chat);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to open chat');
    }
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChatId(chat.id);
    
    // Reset unread count for selected chat
    setChats(prevChats =>
      prevChats.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      )
    );
    
    if (onSelectChat) {
      onSelectChat(chat);
    }
  };

  const handleGroupCreated = async (chat: any) => {
    await loadChats();
    setSelectedChatId(chat.id);
    if (onSelectChat) {
      onSelectChat(chat);
    }
  };

  return (
    <div className="w-80 bg-[#0e1621] border-r border-white/5 flex flex-col h-screen">
      {/* Header with Menu */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors relative"
        >
          <Menu className="w-6 h-6 text-gray-400" />
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a2332] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              {/* User Info in Menu */}
              <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-telegram-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      User {user.username?.slice(-4) || '9829'}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      +{user.username || 'Phone number'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    onProfileClick();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-gray-300 hover:text-white">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-gray-300 hover:text-white">
                  <Moon className="w-5 h-5" />
                  <span>Dark Mode</span>
                </button>
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    onSettingsClick();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                
                {/* Divider */}
                <div className="my-2 border-t border-white/5"></div>
                
                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </button>
        
        <h1 className="text-xl font-semibold text-white">Telegram</h1>
        <div className="w-10"></div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <div className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-500 text-left hover:border-telegram-blue transition-colors">
            Search
          </div>
        </button>

        {/* Create Group Button */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-telegram-blue/10 hover:bg-telegram-blue/20 border border-telegram-blue/30 rounded-lg text-telegram-blue transition-colors"
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">New Group</span>
        </button>
      </div>

      {/* Chat List Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingChats ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-telegram-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ChatList
            chats={chats}
            currentUserId={user.id!}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onlineUsers={onlineUsers}
          />
        )}
      </div>

      {/* User Search Modal */}
      {showSearch && (
        <UserSearch
          onSelectUser={handleSelectUser}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
};