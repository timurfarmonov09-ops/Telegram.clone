import React from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { ProfilePage } from '../profile/ProfilePage';
import { SettingsPage } from '../settings/SettingsPage';
import { User } from '@/types';
import { useSocket } from '@/hooks/useSocket';

interface ChatLayoutProps {
  user: User;
  onLogout: () => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = React.useState<'chat' | 'profile' | 'settings'>('chat');
  const [currentUser, setCurrentUser] = React.useState(user);
  const [selectedChat, setSelectedChat] = React.useState<any>(null);
  
  // Initialize socket connection
  const socket = useSocket(user.id);

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
  };

  return (
    <div className="flex h-screen bg-[#0a1929] overflow-hidden">
      {currentView === 'chat' ? (
        <>
          <Sidebar 
            user={currentUser} 
            onLogout={onLogout}
            onProfileClick={() => setCurrentView('profile')}
            onSettingsClick={() => setCurrentView('settings')}
            onSelectChat={handleSelectChat}
            onlineUsers={socket.onlineUsers}
            socket={socket}
          />
          <ChatArea 
            chat={selectedChat}
            currentUserId={currentUser.id!}
            socket={socket}
            onlineUsers={socket.onlineUsers}
          />
        </>
      ) : currentView === 'profile' ? (
        <ProfilePage 
          user={currentUser}
          onBack={() => setCurrentView('chat')}
          onUpdate={handleProfileUpdate}
        />
      ) : (
        <SettingsPage 
          onBack={() => setCurrentView('chat')}
        />
      )}
    </div>
  );
};