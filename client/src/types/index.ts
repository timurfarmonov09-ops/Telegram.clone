// User types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string;
  created_at: string;
}

// Authentication types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Chat types
export interface Chat {
  id: string;
  name?: string;
  type: 'private' | 'group';
  created_at: string;
  other_user?: string;
  lastMessage?: Message;
  participants?: User[];
  members?: User[];
  admin?: User | string;
  groupPhoto?: string;
  description?: string;
  unreadCount?: number;
}

// Message types
export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  image?: string;
  video?: string;
  file?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Socket event types
export interface SocketMessage {
  chatId: string;
  userId: string;
  content: string;
  username: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// UI state types
export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
}

export interface ChatState {
  activeChat: Chat | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}