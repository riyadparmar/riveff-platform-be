const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message Schema
const MessageSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  conversationId: {
    type: String,
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    filename: {
      type: String
    },
    url: {
      type: String
    },
    size: {
      type: Number
    },
    type: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  isActionRequired: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: ['review', 'revision', 'approve', 'extend', 'cancel', 'none'],
    default: 'none'
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
MessageSchema.index({ 
  conversationId: 1,
  createdAt: -1 
});
MessageSchema.index({ 
  sender: 1, 
  receiver: 1 
});
MessageSchema.index({ 
  orderId: 1,
  createdAt: -1 
});
MessageSchema.index({ 
  receiver: 1, 
  isRead: 1 
});

// Method to mark message as read
MessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = Date.now();
  this.status = 'read';
  return this.save();
};

// Method to add attachment
MessageSchema.methods.addAttachment = function(attachment) {
  this.attachments.push(attachment);
  return this.save();
};

// Pre-save hook
MessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Message', MessageSchema);