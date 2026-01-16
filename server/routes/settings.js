const express = require('express');
const User = require('../models/UserModel');

const router = express.Router();

// GET /api/settings - Get user settings
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return default settings if not set
    const settings = user.settings || {
      privacy: {
        lastSeen: 'everyone',
        profilePhoto: 'everyone',
        readReceipts: true
      },
      notifications: {
        messageNotifications: true,
        soundEnabled: true,
        desktopNotifications: true
      },
      theme: 'dark'
    };

    res.json({
      success: true,
      data: {
        settings
      }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// PUT /api/settings - Update user settings
router.put('/', async (req, res) => {
  try {
    const { privacy, notifications, theme } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize settings if not exists
    if (!user.settings) {
      user.settings = {
        privacy: {},
        notifications: {}
      };
    }

    // Update privacy settings
    if (privacy) {
      if (privacy.lastSeen !== undefined) {
        user.settings.privacy.lastSeen = privacy.lastSeen;
      }
      if (privacy.profilePhoto !== undefined) {
        user.settings.privacy.profilePhoto = privacy.profilePhoto;
      }
      if (privacy.readReceipts !== undefined) {
        user.settings.privacy.readReceipts = privacy.readReceipts;
      }
    }

    // Update notification settings
    if (notifications) {
      if (notifications.messageNotifications !== undefined) {
        user.settings.notifications.messageNotifications = notifications.messageNotifications;
      }
      if (notifications.soundEnabled !== undefined) {
        user.settings.notifications.soundEnabled = notifications.soundEnabled;
      }
      if (notifications.desktopNotifications !== undefined) {
        user.settings.notifications.desktopNotifications = notifications.desktopNotifications;
      }
    }

    // Update theme
    if (theme !== undefined) {
      user.settings.theme = theme;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

module.exports = router;
