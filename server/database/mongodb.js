const mongoose = require('mongoose');

class MongoDB {
  constructor() {
    this.connection = null;
  }

  async initialize() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-clone';
      
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.connection = mongoose.connection;
      
      this.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      this.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      console.log('Connected to MongoDB database');
      
      return this.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  async close() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }
}

module.exports = MongoDB;
