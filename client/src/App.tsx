import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from '@/components/auth/AuthPage';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  // Debug logging
  React.useEffect(() => {
    console.log('App: Auth state changed:', { isAuthenticated, isLoading, user: user?.username });
  }, [isAuthenticated, isLoading, user]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1929] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    console.log('App: Rendering AuthPage');
    return (
      <>
        <AuthPage />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2332',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            },
            success: {
              iconTheme: {
                primary: '#0088cc',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </>
    );
  }

  // Show main chat application
  console.log('App: Rendering ChatLayout');
  return (
    <>
      <ChatLayout user={user!} onLogout={logout} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a2332',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          },
          success: {
            iconTheme: {
              primary: '#0088cc',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;