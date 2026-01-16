const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupPhoto: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
chatSchema.index({ members: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
