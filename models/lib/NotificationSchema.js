const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Notification Schema
const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'message', 'payment', 'review', 'system', 'milestone'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  referenceId: {
    type: Schema.Types.ObjectId
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Message', 'Service', 'Review', 'Payment']
  },
  actionUrl: {
    type: String
  },
  icon: {
    type: String
  },
  data: {
    type: Map,
    of: Schema.Types.Mixed
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  expireAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
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
NotificationSchema.index({ 
  userId: 1, 
  isRead: 1, 
  createdAt: -1 
});
NotificationSchema.index({ 
  userId: 1, 
  type: 1 
});
NotificationSchema.index({ 
  expireAt: 1 
}, { 
  expireAfterSeconds: 0 
});

// Method to mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = Date.now();
  return this.save();
};

// Method to mark notification as deleted
NotificationSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  return this.save();
};

// Pre-save hook
NotificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to create a system notification
NotificationSchema.statics.createSystemNotification = async function(userId, title, message, data = {}) {
  return this.create({
    userId,
    title,
    message,
    type: 'system',
    data
  });
};

// Static method to create an order notification
NotificationSchema.statics.createOrderNotification = async function(userId, title, message, orderId, data = {}) {
  return this.create({
    userId,
    title,
    message,
    type: 'order',
    referenceId: orderId,
    referenceModel: 'Order',
    actionUrl: `/orders/${orderId}`,
    data
  });
};

module.exports = mongoose.model('Notification', NotificationSchema);