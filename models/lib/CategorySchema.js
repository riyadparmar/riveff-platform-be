const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Review Schema
const ReviewSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  response: {
    comment: {
      type: String
    },
    date: {
      type: Date
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  metrics: {
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    serviceAsDescribed: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5
    },
    onTimeDelivery: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  likes: {
    type: Number,
    default: 0
  },
  usersWhoLiked: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  flags: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
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

// Index for efficient querying
ReviewSchema.index({
  serviceId: 1,
  sellerId: 1,
  buyerId: 1,
  rating: -1,
  createdAt: -1
});

// Pre-save hook
ReviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Review', ReviewSchema);