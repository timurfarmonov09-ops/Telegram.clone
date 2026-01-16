import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Edit2, User as UserIcon, AtSign, FileText, Phone } from 'lucide-react';
import { User } from '@/types';
import { profileAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onUpdate: (user: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      const result = await profileAPI.uploadPhoto(file);
      console.log('Upload result:', result);
      onUpdate(result.user);
      toast.success('Profile photo updated!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    setIsEditing(field);
    setEditValue(currentValue || '');
  };

  const handleSave = async (field: string) => {
    try {
      const updateData: any = {};
      
      if (field === 'name') {
        updateData.firstName = editValue;
      } else if (field === 'username') {
        updateData.lastName = editValue;
      } else if (field === 'bio') {
        updateData.bio = editValue;
      }

      const updatedUser = await profileAPI.updateProfile(updateData);
      onUpdate(updatedUser);
      setIsEditing(null);
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setEditValue('');
  };

  const getAvatarUrl = () => {
    if (user.avatar) {
      return `http://localhost:3001${user.avatar}`;
    }
    return null;
  };

  return (
    <div className="flex-1 bg-[#0a1929] flex flex-col h-screen">
      {/* Header */}
      <div className="bg-[#0e1621] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Profile</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* Avatar Section */}
          <div className="bg-[#0e1621] rounded-2xl p-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-telegram-blue flex items-center justify-center overflow-hidden">
                  {getAvatarUrl() ? (
                    <img 
                      src={getAvatarUrl()!} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                {/* Camera Icon Overlay */}
                <button
                  onClick={handlePhotoClick}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-telegram-blue rounded-full flex items-center justify-center shadow-lg hover:bg-telegram-blue-dark transition-colors disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              
              <p className="mt-4 text-gray-400 text-sm">
                {isUploading ? 'Uploading...' : 'Tap to change photo'}
              </p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="bg-[#0e1621] rounded-2xl overflow-hidden">
            {/* Name Field */}
            <div className="border-b border-white/5 p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-1">Name</p>
                    {isEditing === 'name' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSave('name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave('name');
                          if (e.key === 'Escape') handleCancel();
                        }}
                        autoFocus
                        className="w-full bg-transparent text-white text-base focus:outline-none"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="text-white text-base">
                        {user.first_name || `User ${user.username?.slice(-4) || '9829'}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit('name', user.first_name || '')}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-telegram-blue" />
                </button>
              </div>
            </div>

            {/* Username Field */}
            <div className="border-b border-white/5 p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <AtSign className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-1">Username</p>
                    {isEditing === 'username' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSave('username')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave('username');
                          if (e.key === 'Escape') handleCancel();
                        }}
                        autoFocus
                        className="w-full bg-transparent text-white text-base focus:outline-none"
                        placeholder="Set username"
                      />
                    ) : (
                      <p className="text-white text-base">
                        {user.last_name || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit('username', user.last_name || '')}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-telegram-blue" />
                </button>
              </div>
            </div>

            {/* Bio Field */}
            <div className="border-b border-white/5 p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-1">Bio</p>
                    {isEditing === 'bio' ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSave('bio')}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') handleCancel();
                        }}
                        autoFocus
                        rows={2}
                        className="w-full bg-transparent text-white text-base focus:outline-none resize-none"
                        placeholder="Add a few words about yourself"
                      />
                    ) : (
                      <p className="text-white text-base">
                        {user.bio || 'Add a few words about yourself'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit('bio', user.bio || '')}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-telegram-blue" />
                </button>
              </div>
            </div>

            {/* Phone Field (Read-only) */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white text-base">
                    +{user.username || '998773109829'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};