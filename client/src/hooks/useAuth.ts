import { useState, useEffect, useCallback } from 'react';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          
          // Set authenticated state immediately with cached user
          setAuthState({
            user: user,
            token,
            isLoading: false,
            isAuthenticated: true,
          });

          // Verify token in background (optional)
          try {
            const currentUser = await authAPI.me();
            // Update with fresh user data
            setAuthState({
              user: currentUser,
              token,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch (error) {
            // Token might be invalid, but keep user logged in with cached data
            console.warn('Token verification failed, using cached user data');
          }
        } else {
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const authResponse: AuthResponse = await authAPI.login(credentials);
      
      // Store in localStorage
      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      
      setAuthState({
        user: authResponse.user,
        token: authResponse.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Phone authentication function
  const phoneAuth = useCallback(async (phoneNumber: string): Promise<void> => {
    try {
      console.log('phoneAuth: Starting authentication...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const authResponse: AuthResponse = await authAPI.phoneAuth(phoneNumber);
      console.log('phoneAuth: Received response:', authResponse);
      
      // Store in localStorage
      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      console.log('phoneAuth: Stored in localStorage');
      
      // Update state - this should trigger re-render
      setAuthState({
        user: authResponse.user,
        token: authResponse.token,
        isLoading: false,
        isAuthenticated: true,
      });
      console.log('phoneAuth: State updated, isAuthenticated = true');
    } catch (error) {
      console.error('phoneAuth: Error occurred:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const authResponse: AuthResponse = await authAPI.register(userData);
      
      // Store in localStorage
      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      
      setAuthState({
        user: authResponse.user,
        token: authResponse.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const authResponse: AuthResponse = await authAPI.refresh();
      
      // Update localStorage
      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      
      setAuthState(prev => ({
        ...prev,
        user: authResponse.user,
        token: authResponse.token,
      }));
    } catch (error) {
      // If refresh fails, logout user
      logout();
      throw error;
    }
  }, [logout]);

  return {
    ...authState,
    login,
    phoneAuth,
    register,
    logout,
    refreshToken,
  };
};