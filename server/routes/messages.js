const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/MessageModel');
const Chat = require('../models/ChatModel');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET /api/messages/:chatId - Get messages for a chat
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is a member of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user.userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this chat'
      });
    }

    // Get messages with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username first_name last_name avatar isOnline')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await Message.countDocuments({ chat: chatId });

    res.json({
      success: true,
      data: {
        messages: messages.reverse().map(msg => msg.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// POST /api/messages/send - Send a message
router.post('/send', async (req, res) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    // Verify user is a member of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user.userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this chat'
      });
    }

    // Create message
    const message = new Message({
      chat: chatId,
      sender: req.user.userId,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'username first_name last_name avatar isOnline');

    // Update chat's last message
    chat.lastMessage = {
      content: content.trim(),
      sender: req.user.userId,
      timestamp: new Date()
    };
    await chat.save();

    // Broadcast message to chat room via socket
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new-message', message.toJSON());
    }

    res.json({
      success: true,
      data: {
        message: message.toJSON()
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// POST /api/messages/send-image - Send an image message
router.post('/send-image', upload.single('image'), async (req, res) => {
  try {
    const { chatId, content } = req.body;

    console.log('📸 Send image request:', { chatId, hasFile: !!req.file, fileName: req.file?.filename });

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
    }

    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    // Get user from request (should be set by auth middleware)
    const userId = req.user?.userId;
    if (!userId) {
      // Delete uploaded file if not authenticated
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.error('❌ Unauthorized - no userId');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Verify user is a member of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: userId
    });

    if (!chat) {
      // Delete uploaded file if chat access denied
      const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('❌ Access denied to chat:', chatId);
      return res.status(403).json({
        success: false,
        error: 'Access denied to this chat'
      });
    }

    // Create message with image
    const imageUrl = `/uploads/messages/${req.file.filename}`;
    console.log('✅ Image saved:', { filename: req.file.filename, path: imageUrl, fullPath: path.join(__dirname, '../uploads/messages', req.file.filename) });
    
    // Verify file exists
    const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
    if (!fs.existsSync(filePath)) {
      console.error('❌ File does not exist after upload:', filePath);
      return res.status(500).json({
        success: false,
        error: 'File upload failed - file not found'
      });
    }
    
    const message = new Message({
      chat: chatId,
      sender: userId,
      content: content?.trim() || '',
      image: imageUrl
    });

    await message.save();
    await message.populate('sender', 'username first_name last_name avatar isOnline');

    console.log('✅ Message saved:', { id: message._id, image: message.image });

    // Update chat's last message
    chat.lastMessage = {
      content: content?.trim() || '📷 Photo',
      sender: userId,
      timestamp: new Date()
    };
    await chat.save();

    // Broadcast message to chat room via socket
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new-message', message.toJSON());
    }

    res.json({
      success: true,
      data: {
        message: message.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Send image error:', error);
    
    // Delete uploaded file if database update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send image'
    });
  }
});

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages'
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

// PUT /api/messages/:chatId/read - Mark messages as read
router.put('/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is a member of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user.userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this chat'
      });
    }

    // Mark all unread messages from other users as read
    const result = await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user.userId },
        read: false
      },
      {
        $set: { read: true }
      }
    );

    // Broadcast to sender that messages were read
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('messages-read', {
        chatId,
        readBy: req.user.userId,
        count: result.modifiedCount
      });
    }

    res.json({
      success: true,
      data: {
        markedAsRead: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /video\/mp4|video\/quicktime|video\/x-msvideo|video\/x-matroska|video\/webm/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// POST /api/messages/send-video - Send a video message
router.post('/send-video', videoUpload.single('video'), async (req, res) => {
  try {
    const { chatId, content } = req.body;

    console.log('🎥 Send video request:', { chatId, hasFile: !!req.file, fileName: req.file?.filename });

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
    }

    if (!req.file) {
      console.error('❌ No video file uploaded');
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    // Get user from request (should be set by auth middleware)
    const userId = req.user?.userId;
    if (!userId) {
      // Delete uploaded file if not authenticated
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.error('❌ Unauthorized - no userId');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Verify user is a member of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: userId
    });

    if (!chat) {
      // Delete uploaded file if chat access denied
      const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('❌ Access denied to chat:', chatId);
      return res.status(403).json({
        success: false,
        error: 'Access denied to this chat'
      });
    }

    // Create message with video
    const videoUrl = `/uploads/messages/${req.file.filename}`;
    console.log('✅ Video URL:', videoUrl);
    
    const message = new Message({
      chat: chatId,
      sender: userId,
      content: content?.trim() || '',
      video: videoUrl
    });

    await message.save();
    await message.populate('sender', 'username first_name last_name avatar isOnline');

    console.log('✅ Video message saved:', { id: message._id, video: message.video });

    // Update chat's last message
    chat.lastMessage = {
      content: content?.trim() || '🎥 Video',
      sender: userId,
      timestamp: new Date()
    };
    await chat.save();

    // Broadcast message to chat room via socket
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new-message', message.toJSON());
    }

    res.json({
      success: true,
      data: {
        message: message.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Send video error:', error);
    
    // Delete uploaded file if database update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/messages', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send video'
    });
  }
});

// Configure multer for file uploads (documents, PDFs, ZIPs, etc.)
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for files
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types
    cb(null, true);
  }
});

// POST /api/messages/send-file - Send a file message
router.post('/send-file', fileUpload.single('file'), async (req, res) => {
  try {
    const { chatId, content } = req.body;

    console.log('📎 Send file request:', { chatId, hasFile: !!req.file, fileName: req.file?.originalname });

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
    }

    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'File is required'
      });
    }

    // Get user from request (should be set by auth middleware)
    const userId = req.user?.userId;
    if (!userId) {
      // Delete uploaded file if not authenticated
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/files', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.error('❌ Unauthorized - no userId');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Verify user is a member of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: userId
    });

    if (!chat) {
      // Delete uploaded file if chat access denied
      const filePath = path.join(__dirname, '../uploads/files', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('❌ Access denied to chat:', chatId);
      return res.status(403).json({
        success: false,
        error: 'Access denied to this chat'
      });
    }

    // Create message with file
    const fileUrl = `/uploads/files/${req.file.filename}`;
    console.log('✅ File URL:', fileUrl);
    
    const message = new Message({
      chat: chatId,
      sender: userId,
      content: content?.trim() || '',
      file: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    await message.save();
    await message.populate('sender', 'username first_name last_name avatar isOnline');

    console.log('✅ File message saved:', { id: message._id, file: message.file, fileName: message.fileName });

    // Update chat's last message
    const fileIcon = getFileIcon(req.file.mimetype);
    chat.lastMessage = {
      content: content?.trim() || `${fileIcon} ${req.file.originalname}`,
      sender: userId,
      timestamp: new Date()
    };
    await chat.save();

    // Broadcast message to chat room via socket
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new-message', message.toJSON());
    }

    res.json({
      success: true,
      data: {
        message: message.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Send file error:', error);
    
    // Delete uploaded file if database update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/files', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send file'
    });
  }
});

// Helper function to get file icon emoji
function getFileIcon(mimeType) {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
  if (mimeType.includes('text')) return '📄';
  return '📎';
}

module.exports = router;
