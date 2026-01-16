import React, { useState } from 'react';
import { X, Users, Search, Check } from 'lucide-react';
import { User } from '@/types';
import { userAPI, chatAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (chat: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const [step, setStep] = useState<'name' | 'members'>('name');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Debounced search
  React.useEffect(() => {
    if (step !== 'members') return;
    
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const users = await userAPI.searchUsers(searchQuery);
          setSearchResults(users);
        } catch (error: any) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, step]);

  const toggleMember = (user: User) => {
    if (selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleNext = () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    setStep('members');
  };

  const handleCreate = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    try {
      setIsCreating(true);
      const memberIds = selectedMembers.map(m => m.id);
      const chat = await chatAPI.createGroup(groupName, memberIds, description);
      toast.success('Group created successfully!');
      onGroupCreated(chat);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a2332] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {step === 'name' ? 'New Group' : 'Add Members'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'name' ? (
            <div className="space-y-4">
              {/* Group Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-telegram-blue/20 rounded-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-telegram-blue" />
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full bg-[#0e1621] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full bg-[#0e1621] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-3 bg-[#0e1621] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                  autoFocus
                />
              </div>

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-telegram-blue/20 text-telegram-blue px-3 py-1.5 rounded-full text-sm"
                    >
                      <span>{member.first_name || member.username}</span>
                      <button
                        onClick={() => toggleMember(member)}
                        className="hover:bg-white/10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2">
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-telegram-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => {
                    const isSelected = selectedMembers.find(m => m.id === user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleMember(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <div className="w-12 h-12 bg-telegram-blue rounded-full flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white text-lg font-semibold">
                              {(user.first_name || user.username)?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-white font-medium truncate">
                            {user.first_name || user.username}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            +{user.username}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-telegram-blue rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : searchQuery ? (
                  <p className="text-center text-gray-400 py-8">No users found</p>
                ) : (
                  <p className="text-center text-gray-400 py-8">Search for users to add</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          {step === 'name' ? (
            <button
              onClick={handleNext}
              disabled={!groupName.trim()}
              className="w-full bg-telegram-blue hover:bg-telegram-blue/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep('name')}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={selectedMembers.length === 0 || isCreating}
                className="flex-1 bg-telegram-blue hover:bg-telegram-blue/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isCreating ? 'Creating...' : `Create (${selectedMembers.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
