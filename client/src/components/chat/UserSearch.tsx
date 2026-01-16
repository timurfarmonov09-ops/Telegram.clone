import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageCircle } from 'lucide-react';
import { userAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface SearchUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface UserSearchProps {
  onSelectUser: (user: SearchUser) => void;
  onClose: () => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is empty or too short
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const users = await userAPI.searchUsers(query);
        setResults(users);
        setShowResults(true);
      } catch (error: any) {
        toast.error(error.message || 'Failed to search users');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSelectUser = (user: SearchUser) => {
    onSelectUser(user);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const getAvatarUrl = (avatar?: string) => {
    if (avatar) {
      return `http://localhost:3001${avatar}`;
    }
    return null;
  };

  const getUserDisplayName = (user: SearchUser) => {
    if (user.first_name) {
      return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    return `User ${user.username?.slice(-4) || '0000'}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 npex items-start justify-center pt-20 z-50">
      <div className="bg-[#0e1621] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by username or phone..."
                className="w-full bg-[#0a1929] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-telegram-blue"
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {isSearching && (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-telegram-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400">Searching...</p>
            </div>
          )}

          {!isSearching && showResults && results.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No users found</p>
              <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
            </div>
          )}

          {!isSearching && showResults && results.length > 0 && (
            <div className="divide-y divide-white/5">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-telegram-blue flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {getAvatarUrl(user.avatar) ? (
                      <img 
                        src={getAvatarUrl(user.avatar)!} 
                        alt={getUserDisplayName(user)} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {getUserDisplayName(user).charAt(0).toUpperCase()}
                      </span>
                    )}
                    {/* Online indicator - only show if user is online */}
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0e1621]"></div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {getUserDisplayName(user)}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      +{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-gray-500 text-sm truncate mt-1">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {/* Action Icon */}
                  <MessageCircle className="w-5 h-5 text-telegram-blue flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {!isSearching && !showResults && query.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Start typing to search users</p>
              <p className="text-gray-500 text-sm mt-2">Search by username or phone number</p>
            </div>
          )}

          {!isSearching && !showResults && query.length > 0 && query.length < 2 && (
            <div className="p-8 text-center">
              <p className="text-gray-400">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
