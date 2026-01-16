import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Bell, Palette, Globe, ChevronRight } from 'lucide-react';
import { settingsAPI } from '@/services/api';

interface SettingsPageProps {
  onBack: () => void;
}

type SettingsView = 'main' | 'privacy' | 'notifications' | 'appearance';

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentView, setCurrentView] = useState<SettingsView>('main');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsAPI.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (path: string[], value: any) => {
    try {
      setSaving(true);
      
      const newSettings = { ...settings };
      let current: any = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      
      const updated = await settingsAPI.updateSettings(newSettings);
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a1929] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-telegram-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex-1 bg-[#0a1929] flex items-center justify-center">
        <p className="text-white">Failed to load settings</p>
      </div>
    );
  }

  const renderMainView = () => (
    <div className="max-w-2xl mx-auto">
      {/* Privacy */}
      <button
        onClick={() => setCurrentView('privacy')}
        className="w-full bg-[#1a2332] hover:bg-[#1f2937] transition-colors rounded-xl p-4 mb-3 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-medium">Privacy</h3>
          <p className="text-sm text-gray-400">Last seen, profile photo, read receipts</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Notifications */}
      <button
        onClick={() => setCurrentView('notifications')}
        className="w-full bg-[#1a2332] hover:bg-[#1f2937] transition-colors rounded-xl p-4 mb-3 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-medium">Notifications</h3>
          <p className="text-sm text-gray-400">Messages, sounds, vibration</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Appearance */}
      <button
        onClick={() => setCurrentView('appearance')}
        className="w-full bg-[#1a2332] hover:bg-[#1f2937] transition-colors rounded-xl p-4 mb-3 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
          <Palette className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-medium">Appearance</h3>
          <p className="text-sm text-gray-400">Theme: {settings.theme || 'dark'}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Language */}
      <button
        className="w-full bg-[#1a2332] hover:bg-[#1f2937] transition-colors rounded-xl p-4 mb-3 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
          <Globe className="w-6 h-6 text-orange-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-medium">Language</h3>
          <p className="text-sm text-gray-400">English</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );

  const renderPrivacyView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#1a2332] rounded-xl p-4 mb-3">
        <h3 className="text-white font-medium mb-4">Who can see my last seen</h3>
        <select
          value={settings.privacy?.lastSeen || 'everyone'}
          onChange={(e) => updateSetting(['privacy', 'lastSeen'], e.target.value)}
          disabled={saving}
          className="w-full bg-[#0e1621] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue disabled:opacity-50"
        >
          <option value="everyone">Everyone</option>
          <option value="contacts">My Contacts</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>

      <div className="bg-[#1a2332] rounded-xl p-4 mb-3">
        <h3 className="text-white font-medium mb-4">Who can see my profile photo</h3>
        <select
          value={settings.privacy?.profilePhoto || 'everyone'}
          onChange={(e) => updateSetting(['privacy', 'profilePhoto'], e.target.value)}
          disabled={saving}
          className="w-full bg-[#0e1621] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue disabled:opacity-50"
        >
          <option value="everyone">Everyone</option>
          <option value="contacts">My Contacts</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>

      <div className="bg-[#1a2332] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Read Receipts</h3>
            <p className="text-sm text-gray-400 mt-1">Show double check marks when messages are read</p>
          </div>
          <button
            onClick={() => updateSetting(['privacy', 'readReceipts'], !settings.privacy?.readReceipts)}
            disabled={saving}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.privacy?.readReceipts ? 'bg-telegram-blue' : 'bg-gray-600'
            } disabled:opacity-50`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.privacy?.readReceipts ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#1a2332] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium">Message Notifications</h3>
            <p className="text-sm text-gray-400 mt-1">Show notifications for new messages</p>
          </div>
          <button
            onClick={() => updateSetting(['notifications', 'messageNotifications'], !settings.notifications?.messageNotifications)}
            disabled={saving}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.notifications?.messageNotifications ? 'bg-telegram-blue' : 'bg-gray-600'
            } disabled:opacity-50`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.notifications?.messageNotifications ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-[#1a2332] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Sound</h3>
            <p className="text-sm text-gray-400 mt-1">Play sound for notifications</p>
          </div>
          <button
            onClick={() => updateSetting(['notifications', 'soundEnabled'], !settings.notifications?.soundEnabled)}
            disabled={saving}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.notifications?.soundEnabled ? 'bg-telegram-blue' : 'bg-gray-600'
            } disabled:opacity-50`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.notifications?.soundEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-[#1a2332] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Desktop Notifications</h3>
            <p className="text-sm text-gray-400 mt-1">Show desktop notifications</p>
          </div>
          <button
            onClick={() => updateSetting(['notifications', 'desktopNotifications'], !settings.notifications?.desktopNotifications)}
            disabled={saving}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.notifications?.desktopNotifications ? 'bg-telegram-blue' : 'bg-gray-600'
            } disabled:opacity-50`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.notifications?.desktopNotifications ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#1a2332] rounded-xl p-4">
        <h3 className="text-white font-medium mb-4">Theme</h3>
        <div className="space-y-2">
          {[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto (System)' }
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => updateSetting(['theme'], theme.value)}
              disabled={saving}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                settings.theme === theme.value ? 'bg-telegram-blue/20 border-2 border-telegram-blue' : 'bg-[#0e1621] hover:bg-[#1a2332]'
              } disabled:opacity-50`}
            >
              <span className="text-white">{theme.label}</span>
              {settings.theme === theme.value && (
                <div className="w-5 h-5 bg-telegram-blue rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#0a1929] flex flex-col h-screen">
      {/* Header */}
      <div className="bg-[#0e1621] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => currentView === 'main' ? onBack() : setCurrentView('main')}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">
          {currentView === 'main' && 'Settings'}
          {currentView === 'privacy' && 'Privacy'}
          {currentView === 'notifications' && 'Notifications'}
          {currentView === 'appearance' && 'Appearance'}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentView === 'main' && renderMainView()}
        {currentView === 'privacy' && renderPrivacyView()}
        {currentView === 'notifications' && renderNotificationsView()}
        {currentView === 'appearance' && renderAppearanceView()}
      </div>
    </div>
  );
};
