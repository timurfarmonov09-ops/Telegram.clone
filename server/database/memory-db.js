// Simple in-memory database for testing without MongoDB
class MemoryDB {
  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.initialized = false;
  }

  async initialize() {
    console.log('⚠️  Using IN-MEMORY database (data will be lost on restart)');
    console.log('💡 For production, please configure MongoDB in .env file');
    this.initialized = true;
    
    // Create some test users for demo
    await this.createTestUsers();
    
    return this;
  }

  async createTestUsers() {
    const testUsers = [
      { username: '998901234567', phone_number: '998901234567', first_name: 'Alisher', last_name: 'Navoiy', bio: 'O\'zbek shoiri va mutafakkiri' },
      { username: '998901234568', phone_number: '998901234568', first_name: 'Mirzo', last_name: 'Ulug\'bek', bio: 'Buyuk olim va astronom' },
      { username: '998901234569', phone_number: '998901234569', first_name: 'Abdulla', last_name: 'Qodiriy', bio: 'O\'zbek yozuvchisi' },
      { username: '998901234570', phone_number: '998901234570', first_name: 'Hamid', last_name: 'Olimjon', bio: 'Shoir va dramaturg' },
      { username: '998901234571', phone_number: '998901234571', first_name: 'Oybek', last_name: 'Malikov', bio: 'Yozuvchi va shoir' },
    ];

    for (const userData of testUsers) {
      await this.createUser(userData);
    }
    
    console.log(`✅ Created ${testUsers.length} test users for demo`);
  }

  getConnection() {
    return this;
  }

  async close() {
    this.users.clear();
    this.chats.clear();
    this.messages.clear();
    console.log('Memory database cleared');
  }

  // User operations
  async createUser(userData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const user = {
      _id: id,
      id: id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async findUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async findUserByPhone(phone) {
    for (const user of this.users.values()) {
      if (user.phone_number === phone || user.username === phone) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id, updateData) {
    const user = this.users.get(id);
    if (!user) return null;
    
    Object.assign(user, updateData, { updatedAt: new Date() });
    this.users.set(id, user);
    return user;
  }

  async searchUsers(query, excludeUserId) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const user of this.users.values()) {
      if (user._id === excludeUserId) continue;
      
      const matchUsername = user.username?.toLowerCase().includes(lowerQuery);
      const matchFirstName = user.first_name?.toLowerCase().includes(lowerQuery);
      const matchLastName = user.last_name?.toLowerCase().includes(lowerQuery);
      const matchPhone = user.phone_number?.includes(query);
      
      if (matchUsername || matchFirstName || matchLastName || matchPhone) {
        results.push(user);
        if (results.length >= 10) break;
      }
    }
    
    return results;
  }

  // Chat operations
  async createChat(chatData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const chat = {
      _id: id,
      id: id,
      ...chatData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }

  async findChatById(id) {
    return this.chats.get(id) || null;
  }

  async findChatByMembers(members) {
    for (const chat of this.chats.values()) {
      if (chat.type === 'private' && 
          chat.members.length === 2 &&
          chat.members.includes(members[0]) &&
          chat.members.includes(members[1])) {
        return chat;
      }
    }
    return null;
  }

  async findChatsByUserId(userId) {
    const results = [];
    for (const chat of this.chats.values()) {
      if (chat.members.includes(userId)) {
        results.push(chat);
      }
    }
    return results.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || a.createdAt;
      const bTime = b.lastMessage?.timestamp || b.createdAt;
      return new Date(bTime) - new Date(aTime);
    });
  }

  async updateChat(id, updateData) {
    const chat = this.chats.get(id);
    if (!chat) return null;
    
    Object.assign(chat, updateData, { updatedAt: new Date() });
    this.chats.set(id, chat);
    return chat;
  }

  // Message operations
  async createMessage(messageData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const message = {
      _id: id,
      id: id,
      ...messageData,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async findMessagesByChatId(chatId, limit = 50, skip = 0) {
    const results = [];
    for (const message of this.messages.values()) {
      if (message.chat === chatId) {
        results.push(message);
      }
    }
    return results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit)
      .reverse();
  }
}

module.exports = MemoryDB;
