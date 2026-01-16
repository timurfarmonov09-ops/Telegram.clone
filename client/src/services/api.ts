import axios, { AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details?.[0]?.message || 
        'Registration failed'
      );
    }
  },

  // Phone number registration/login
  phoneAuth: async (phoneNumber: string): Promise<AuthResponse> => {
    try {
      console.log('API: Sending phone auth request:', phoneNumber);
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/phone-register', { phoneNumber });
      console.log('API: Received response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Phone authentication failed');
      }
      
      if (!response.data.data) {
        throw new Error('No data received from server');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('API: Phone auth error:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message ||
        'Phone authentication failed'
      );
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Login failed'
      );
    }
  },

  // Get current user info
  me: async () => {
    try {
      const response = await api.get<ApiResponse>('/auth/me');
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to get user info'
      );
    }
  },

  // Refresh token
  refresh: async (): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/refresh');
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Token refresh failed'
      );
    }
  }
};

// Chat API functions
export const chatAPI = {
  // Get user's chats
  getChats: async () => {
    try {
      const response = await api.get<ApiResponse>('/chats/my');
      return response.data.data.chats;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to fetch chats'
      );
    }
  },

  // Create or get chat with user
  createChat: async (userId: string) => {
    try {
      const response = await api.post<ApiResponse>('/chats/create', { userId });
      return response.data.data.chat;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to create chat'
      );
    }
  },

  // Get messages for a chat
  getMessages: async (chatId: string, page = 1, limit = 50) => {
    try {
      const response = await api.get<ApiResponse>(`/messages/${chatId}`, {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to fetch messages'
      );
    }
  },

  // Send a message
  sendMessage: async (chatId: string, content: string) => {
    try {
      const response = await api.post<ApiResponse>('/messages/send', {
        chatId,
        content
      });
      return response.data.data.message;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to send message'
      );
    }
  },

  // Send an image message
  sendImage: async (chatId: string, image: File, content?: string) => {
    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('image', image);
      if (content) {
        formData.append('content', content);
      }

      const response = await api.post<ApiResponse>('/messages/send-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data.message;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to send image'
      );
    }
  },

  // Send a video message
  sendVideo: async (chatId: string, video: File, content?: string) => {
    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('video', video);
      if (content) {
        formData.append('content', content);
      }

      const response = await api.post<ApiResponse>('/messages/send-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data.message;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to send video'
      );
    }
  },

  // Send a file message
  sendFile: async (chatId: string, file: File, content?: string, onProgress?: (progress: number) => void) => {
    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('file', file);
      if (content) {
        formData.append('content', content);
      }

      const response = await api.post<ApiResponse>('/messages/send-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      return response.data.data.message;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to send file'
      );
    }
  },

  // Delete a message
  deleteMessage: async (messageId: string) => {
    try {
      const response = await api.delete<ApiResponse>(`/messages/${messageId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to delete message'
      );
    }
  },

  // Mark messages as read
  markAsRead: async (chatId: string) => {
    try {
      const response = await api.put<ApiResponse>(`/messages/${chatId}/read`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to mark messages as read'
      );
    }
  },

  // Create group chat
  createGroup: async (name: string, memberIds: string[], description?: string) => {
    try {
      const response = await api.post<ApiResponse>('/chats/create-group', {
        name,
        memberIds,
        description
      });
      return response.data.data.chat;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to create group'
      );
    }
  },

  // Add members to group
  addMembers: async (chatId: string, memberIds: string[]) => {
    try {
      const response = await api.put<ApiResponse>(`/chats/${chatId}/add-members`, {
        memberIds
      });
      return response.data.data.chat;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to add members'
      );
    }
  },

  // Remove member from group
  removeMember: async (chatId: string, memberId: string) => {
    try {
      const response = await api.put<ApiResponse>(`/chats/${chatId}/remove-member`, {
        memberId
      });
      return response.data.data.chat;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to remove member'
      );
    }
  },

  // Leave group
  leaveGroup: async (chatId: string) => {
    try {
      const response = await api.put<ApiResponse>(`/chats/${chatId}/leave`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to leave group'
      );
    }
  }
};

// Profile API functions
export const profileAPI = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get<ApiResponse>('/profile/me');
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to get profile'
      );
    }
  },

  // Update profile
  updateProfile: async (data: { firstName?: string; lastName?: string; bio?: string }) => {
    try {
      const response = await api.put<ApiResponse>('/profile/update', data);
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to update profile'
      );
    }
  },

  // Upload profile photo
  uploadPhoto: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await api.put<ApiResponse>('/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to upload photo'
      );
    }
  },

  // Delete profile photo
  deletePhoto: async () => {
    try {
      const response = await api.delete<ApiResponse>('/profile/photo');
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to delete photo'
      );
    }
  }
};

// Settings API functions
export const settingsAPI = {
  // Get user settings
  getSettings: async () => {
    try {
      const response = await api.get<ApiResponse>('/settings');
      return response.data.data.settings;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to get settings'
      );
    }
  },

  // Update user settings
  updateSettings: async (settings: any) => {
    try {
      const response = await api.put<ApiResponse>('/settings', settings);
      return response.data.data.settings;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to update settings'
      );
    }
  }
};

// User API functions
export const userAPI = {
  // Search users
  searchUsers: async (query: string) => {
    try {
      const response = await api.get<ApiResponse>('/users/search', {
        params: { query }
      });
      return response.data.data.users;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to search users'
      );
    }
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    try {
      const response = await api.get<ApiResponse>(`/users/${userId}`);
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to get user'
      );
    }
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data.success;
  } catch (error) {
    return false;
  }
};

export default api;