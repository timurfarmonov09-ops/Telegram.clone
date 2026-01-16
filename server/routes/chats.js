const express = require('express');
const Chat = require('../models/ChatModel');
const User = require('../models/UserModel');

const router = express.Router();

// POST /api/chats/create-group - Create group chat
router.post('/create-group', async (req, res) => {
  try {
    const { name, memberIds, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one member is required'
      });
    }

    // Add creator to members if not included
    const allMembers = [...new Set([req.user.userId, ...memberIds])];

    // Create group chat
    const chat = new Chat({
      name: name.trim(),
      type: 'group',
      members: allMembers,
      admin: req.user.userId,
      description: description || ''
    });

    await chat.save();
    await chat.populate('members', 'username first_name last_name avatar isOnline lastSeen');
    await chat.populate('admin', 'username first_name last_name');

    res.json({
      success: true,
      data: { chat: chat.toJSON() }
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create group'
    });
  }
});

// PUT /api/chats/:chatId/add-members - Add members to group
router.put('/:chatId/add-members', async (req, res) => {
  try {
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Member IDs are required'
      });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      type: 'group',
      admin: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Group not found or you are not admin'
      });
    }

    // Add new members
    const newMembers = memberIds.filter(id => !chat.members.includes(id));
    chat.members.push(...newMembers);
    await chat.save();
    await chat.populate('members', 'username first_name last_name avatar isOnline lastSeen');

    res.json({
      success: true,
      data: { chat: chat.toJSON() }
    });

  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add members'
    });
  }
});

// PUT /api/chats/:chatId/remove-member - Remove member from group
router.put('/:chatId/remove-member', async (req, res) => {
  try {
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      type: 'group',
      admin: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Group not found or you are not admin'
      });
    }

    // Remove member
    chat.members = chat.members.filter(id => id.toString() !== memberId);
    await chat.save();
    await chat.populate('members', 'username first_name last_name avatar isOnline lastSeen');

    res.json({
      success: true,
      data: { chat: chat.toJSON() }
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member'
    });
  }
});

// PUT /api/chats/:chatId/leave - Leave group
router.put('/:chatId/leave', async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      type: 'group',
      members: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Remove user from members
    chat.members = chat.members.filter(id => id.toString() !== req.user.userId);
    
    // If admin leaves, assign new admin
    if (chat.admin.toString() === req.user.userId && chat.members.length > 0) {
      chat.admin = chat.members[0];
    }

    await chat.save();

    res.json({
      success: true,
      message: 'Left group successfully'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave group'
    });
  }
});

// POST /api/chats/create - Create or get existing chat
router.post('/create', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      type: 'private',
      members: { $all: [req.user.userId, userId] }
    }).populate('members', 'username first_name last_name avatar isOnline lastSeen');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        type: 'private',
        members: [req.user.userId, userId]
      });
      await chat.save();
      await chat.populate('members', 'username first_name last_name avatar isOnline lastSeen');
    }

    res.json({
      success: true,
      data: { chat: chat.toJSON() }
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat'
    });
  }
});

// GET /api/chats/my - Get user's chats
router.get('/my', async (req, res) => {
  try {
    const Message = require('../models/MessageModel');
    
    const chats = await Chat.find({
      members: req.user.userId
    })
    .populate('members', 'username first_name last_name avatar isOnline lastSeen')
    .populate('lastMessage.sender', 'username first_name last_name')
    .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });

    // Calculate unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user.userId },
          read: false
        });
        
        const chatObj = chat.toJSON();
        chatObj.unreadCount = unreadCount;
        return chatObj;
      })
    );

    res.json({
      success: true,
      data: { chats: chatsWithUnread }
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats'
    });
  }
});

// GET /api/chats/:chatId - Get chat by ID
router.get('/:chatId', async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      members: req.user.userId
    }).populate('members', 'username first_name last_name avatar isOnline lastSeen');

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    res.json({
      success: true,
      data: { chat: chat.toJSON() }
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat'
    });
  }
});

module.exports = router;
