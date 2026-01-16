import React, { useState } from 'react';
import { PhoneLoginForm } from './PhoneLoginForm';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export const AuthPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const { phoneAuth, isLoading, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, redirecting...');
    }
  }, [isAuthenticated]);

  const handlePhoneSubmit = async (phoneNumber: string) => {
    try {
      setError('');
      console.log('Attempting phone auth with:', phoneNumber);
      await phoneAuth(phoneNumber);
      console.log('Phone auth successful!');
      toast.success('Welcome to Telegram!');
      
      // Force page reload to show chat interface
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Phone auth error:', error);
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0d2137] to-[#0a1929] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-telegram-blue/10 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-telegram-blue/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-telegram-blue/5 rounded-full blur-3xl"></div>
      </div>

      {/* Auth form container */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <PhoneLoginForm 
          onSubmit={handlePhoneSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};