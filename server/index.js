require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Initialize database - try MongoDB first, fallback to memory DB
let database;
let useMemoryDB = false;
let useMongoose = false;

async function initializeDatabase() {
  // Try MongoDB with Mongoose first
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost:27017')) {
    try {
      console.log('🔄 Attempting to connect to MongoDB Atlas...');
      const MongoDB = require('./database/mongodb');
      database = new MongoDB();
      await database.initialize();
      useMongoose = true;
      console.log('✅ Using MongoDB with Mongoose');
      return;
    } catch (error) {
      console.log('⚠️  MongoDB connection failed:', error.message);
      console.log('📋 Full error:', error);
    }
  }

  // Fallback to memory database
  console.log('⚠️  Using IN-MEMORY database (data will be lost on restart)');
  console.log('💡 To use MongoDB, configure MONGODB_URI in server/.env');
  console.log('📖 See MONGODB_INSTALL.md for setup instructions');
  const MemoryDB = require('./database/memory-db');
  database = new MemoryDB();
  await database.initialize();
  useMemoryDB = true;
}

// Create test users for demo
async function createTestUsers() {
  try {
    const User = require('./models/UserModel');
    
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`✅ Database has ${existingUsers} users`);
      return;
    }

    const testUsers = [
      { username: '998901234567', phone_number: '998901234567', first_name: 'Alisher', last_name: 'Navoiy', bio: 'O\'zbek shoiri va mutafakkiri', isOnline: true },
      { username: '998901234568', phone_number: '998901234568', first_name: 'Mirzo', last_name: 'Ulug\'bek', bio: 'Buyuk olim va astronom', isOnline: true },
      { username: '998901234569', phone_number: '998901234569', first_name: 'Abdulla', last_name: 'Qodiriy', bio: 'O\'zbek yozuvchisi', isOnline: false },
      { username: '998901234570', phone_number: '998901234570', first_name: 'Hamid', last_name: 'Olimjon', bio: 'Shoir va dramaturg', isOnline: true },
      { username: '998901234571', phone_number: '998901234571', first_name: 'Oybek', last_name: 'Malikov', bio: 'Yozuvchi va shoir', isOnline: false },
    ];

    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }
    
    console.log(`✅ Created ${testUsers.length} test users for demo`);
  } catch (error) {
    console.log('⚠️  Could not create test users:', error.message);
  }
}

// Import routes based on database type
let authRouter, authenticateToken, initializeAuthRoutes;
let profileRouter, initializeProfileRoutes;
let usersRouter, initializeUserRoutes;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "ws://localhost:*"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Set proper content type for images
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Content-Type', 'image/' + ext.slice(1));
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // Set proper content type for videos
    else if (filePath.match(/\.(mp4|webm|ogg)$/i)) {
      res.setHeader('Content-Type', 'video/' + ext.slice(1));
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // Set proper content type for documents
    else if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
    else if (ext === '.doc' || ext === '.docx') {
      res.setHeader('Content-Type', 'application/msword');
    }
    else if (ext === '.xls' || ext === '.xlsx') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
    }
    else if (ext === '.zip') {
      res.setHeader('Content-Type', 'application/zip');
    }
    else if (ext === '.rar') {
      res.setHeader('Content-Type', 'application/x-rar-compressed');
    }
    else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    database: useMemoryDB ? 'memory' : 'mongodb',
    timestamp: new Date().toISOString()
  });
});

// Initialize routes after database is ready
async function setupRoutes() {
  if (useMemoryDB) {
    // Use simple routes for memory DB
    const authModule = require('./routes/auth-simple');
    authRouter = authModule.router;
    authenticateToken = authModule.authenticateToken;
    initializeAuthRoutes = authModule.initializeAuthRoutes;
    
    const profileModule = require('./routes/profile-simple');
    profileRouter = profileModule.router;
    initializeProfileRoutes = profileModule.initializeProfileRoutes;
    
    const usersModule = require('./routes/users-simple');
    usersRouter = usersModule.router;
    initializeUserRoutes = usersModule.initializeUserRoutes;
    
    // Initialize with memory DB
    initializeAuthRoutes(database);
    initializeProfileRoutes(database);
    initializeUserRoutes(database);
  } else {
    // Use Mongoose routes
    const authModule = require('./routes/auth');
    authRouter = authModule.router;
    authenticateToken = authModule.authenticateToken;
    
    profileRouter = require('./routes/profile');
    usersRouter = require('./routes/users');
  }

  // API routes
  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/profile', authenticateToken, profileRouter);
  app.use('/api/users', authenticateToken, usersRouter);
  
  // Settings routes
  const settingsRouter = require('./routes/settings');
  app.use('/api/settings', authenticateToken, settingsRouter);
  
  // Chat routes
  const chatsRouter = require('./routes/chats');
  app.use('/api/chats', authenticateToken, chatsRouter);
  
  // Message routes - make io available to routes
  app.set('io', io);
  const messagesRouter = require('./routes/messages');
  app.use('/api/messages', authenticateToken, messagesRouter);

  // Chats and messages routes
  setupChatRoutes();
  
  // Error handling middleware (must be after all routes)
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  // 404 handler (must be last)
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found'
    });
  });
}

function setupChatRoutes() {
  // GET /api/chats - Get user's chats
  app.get('/api/chats', authenticateToken, async (req, res) => {
    try {
      const chats = await database.findChatsByUserId(req.user.userId);
      
      // Populate user data for each chat
      const chatsWithUsers = await Promise.all(chats.map(async (chat) => {
        const populatedMembers = await Promise.all(
          chat.members.map(memberId => database.findUserById(memberId))
        );
        
        return {
          ...chat,
          members: populatedMembers.filter(m => m).map(m => {
            const { password, ...user } = m;
            return user;
          })
        };
      }));

      res.json({
        success: true,
        data: chatsWithUsers
      });

    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chats'
      });
    }
  });

  // GET /api/messages/:chatId - Get messages for a chat
  app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify user is a member of this chat
      const chat = await database.findChatById(chatId);
      if (!chat || !chat.members.includes(req.user.userId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this chat'
        });
      }

      // Get messages
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const messages = await database.findMessagesByChatId(chatId, parseInt(limit), skip);

      // Populate sender data
      const messagesWithSender = await Promise.all(messages.map(async (msg) => {
        const sender = await database.findUserById(msg.sender);
        const { password, ...senderData } = sender || {};
        return {
          ...msg,
          sender: senderData
        };
      }));

      res.json({
        success: true,
        data: messagesWithSender
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }
  });

  // POST /api/chats - Create or get existing chat
  app.post('/api/chats', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Check if chat already exists
      let chat = await database.findChatByMembers([req.user.userId, userId]);

      if (!chat) {
        // Create new chat
        chat = await database.createChat({
          type: 'private',
          members: [req.user.userId, userId]
        });
      }

      // Populate members
      const populatedMembers = await Promise.all(
        chat.members.map(memberId => database.findUserById(memberId))
      );

      res.json({
        success: true,
        data: {
          ...chat,
          members: populatedMembers.filter(m => m).map(m => {
            const { password, ...user } = m;
            return user;
          })
        }
      });

    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat'
      });
    }
  });
}

// Socket.io connection handling
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication and online status
  socket.on('user-online', async (userId) => {
    try {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // Join user-specific room for notifications
      socket.join(`user-${userId}`);
      
      // Update user online status in database
      const User = require('./models/UserModel');
      await User.findByIdAndUpdate(userId, { 
        isOnline: true, 
        lastSeen: new Date() 
      });

      // Broadcast to all users that this user is online
      io.emit('user-status-changed', { userId, isOnline: true });
      
      console.log(`User ${userId} is now online and joined user room`);
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  });

  // Handle joining a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Handle leaving a chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Handle typing indicator
  socket.on('typing-start', ({ chatId, userId, username }) => {
    socket.to(chatId).emit('user-typing', { userId, username, isTyping: true });
  });

  socket.on('typing-stop', ({ chatId, userId }) => {
    socket.to(chatId).emit('user-typing', { userId, isTyping: false });
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { chatId, userId, content } = data;
      
      if (!chatId || !userId || !content) {
        socket.emit('error', { message: 'Missing required message data' });
        return;
      }

      // Verify user is a member of the chat
      const Chat = require('./models/ChatModel');
      const chat = await Chat.findOne({
        _id: chatId,
        members: userId
      });

      if (!chat) {
        socket.emit('error', { message: 'Access denied to this chat' });
        return;
      }

      // Create message
      const Message = require('./models/MessageModel');
      const message = new Message({
        chat: chatId,
        sender: userId,
        content: content
      });

      await message.save();
      await message.populate('sender', 'username first_name last_name avatar');

      // Update chat's last message
      chat.lastMessage = {
        content: content,
        sender: userId,
        timestamp: new Date()
      };
      await chat.save();

      // Broadcast message
      io.to(chatId).emit('new-message', message.toJSON());
      
      // Broadcast unread count update to all chat members except sender
      chat.members.forEach(memberId => {
        if (memberId.toString() !== userId) {
          io.to(`user-${memberId}`).emit('unread-count-update', {
            chatId: chatId,
            increment: true
          });
        }
      });
      
      console.log(`Message sent to chat ${chatId}`);

    } catch (error) {
      console.error('Error handling send-message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Update user offline status
    if (socket.userId) {
      try {
        onlineUsers.delete(socket.userId);
        
        const User = require('./models/UserModel');
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });

        // Broadcast to all users that this user is offline
        io.emit('user-status-changed', { 
          userId: socket.userId, 
          isOnline: false 
        });
        
        console.log(`User ${socket.userId} is now offline`);
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await setupRoutes();
    
    // Create test users if using MongoDB
    if (useMongoose) {
      await createTestUsers();
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🗄️  Database: ${useMemoryDB ? 'In-Memory (temporary)' : 'MongoDB'}`);
      if (useMemoryDB) {
        console.log('');
        console.log('⚠️  WARNING: Using temporary in-memory database');
        console.log('📖 To use MongoDB, see: MONGODB_INSTALL.md');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await database.close();
    server.close(() => {
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  try {
    await database.close();
    server.close(() => {
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();
