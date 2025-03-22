const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Conversation Schema
const ConversationSchema = new Schema({
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    unreadCount: {
      type: Number,
      default: 0
    },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  }],
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  type: {
    type: String,
    enum: ['order', 'inquiry', 'support'],
    required: true
  },
  lastMessage: {
    content: {
      type: String
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date
    },
    isAttachment: {
      type: Boolean,
      default: false
    }
  },
  title: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  blockReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ConversationSchema.index({ 
  'participants.userId': 1,
  lastActivity: -1 
});
ConversationSchema.index({ 
  orderId: 1 
});
ConversationSchema.index({ 
  serviceId: 1 
});

// Method to update last message
ConversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    content: message.content.substring(0, 100), // Truncate for preview
    sender: message.sender,
    timestamp: message.createdAt,
    isAttachment: message.attachments && message.attachments.length > 0
  };
  this.lastActivity = message.createdAt;
  
  // Increment unread count for other participants
  this.participants.forEach(participant => {
    if (!participant.userId.equals(message.sender)) {
      participant.unreadCount += 1;
    }
  });
  
  return this.save();
};

// Method to mark as read for a participant
ConversationSchema.methods.markAsReadForUser = function(userId, messageId) {
  const participant = this.participants.find(p => p.userId.equals(userId));
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadMessageId = messageId;
  }
  return this.save();
};

// Pre-save hook
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);s