const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message Schema (Sub-document)
const MessageSchema = new Schema({
  sender: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  attachment: {
    type: String
  },
  time: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

// Milestone Schema (Sub-document)
const MilestoneSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  date: {
    type: Date,
    required: true
  },
  deliverables: [{
    url: {
      type: String
    },
    filename: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    type: String
  }
});

// File Schema (Sub-document)
const FileSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: String
  },
  type: {
    type: String,
    enum: ['pdf', 'image', 'document', 'archive', 'other'],
    default: 'other'
  },
  uploadedBy: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['deliverable', 'reference', 'draft'],
    default: 'reference'
  }
});

// Order Schema
const OrderSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceTitle: {
    type: String,
    required: true
  },
  packageSelected: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium'],
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
  price: {
    type: Number,
    required: true
  },
  deliveryTime: {
    type: Number,
    required: true // in days
  },
  dueDate: {
    type: Date,
    required: true
  },
  extendedDelivery: {
    isExtended: {
      type: Boolean,
      default: false
    },
    additionalDays: {
      type: Number,
      default: 0
    },
    reason: {
      type: String
    },
    approvedAt: {
      type: Date
    }
  },
  requirements: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Delivered', 'Revision Requested', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Delivered', 'Revision Requested', 'Completed', 'Cancelled']
    },
    note: {
      type: String
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [MilestoneSchema],
  files: [FileSchema],
  messages: [MessageSchema],
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    createdAt: {
      type: Date
    }
  },
  paymentInfo: {
    transactionId: {
      type: String
    },
    paymentMethod: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Refunded', 'Failed'],
      default: 'Pending'
    },
    platformFee: {
      type: Number
    },
    sellerEarnings: {
      type: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  revisions: {
    available: {
      type: Number,
      default: 0
    },
    used: {
      type: Number,
      default: 0
    }
  },
  cancellationRequest: {
    isRequested: {
      type: Boolean,
      default: false
    },
    requestedBy: {
      type: String,
      enum: ['buyer', 'seller']
    },
    reason: {
      type: String
    },
    requestDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    resolvedDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index for efficiency
OrderSchema.index({ 
  buyerId: 1,
  sellerId: 1,
  status: 1,
  createdAt: -1
});

// Calculate due date based on current date and delivery time
OrderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('deliveryTime')) {
    const currentDate = new Date();
    this.dueDate = new Date(currentDate.setDate(currentDate.getDate() + this.deliveryTime));
  }
  
  // If extended delivery was approved, update the due date
  if (this.extendedDelivery.isExtended && this.extendedDelivery.approvedAt && this.isModified('extendedDelivery.isExtended')) {
    const currentDueDate = new Date(this.dueDate);
    this.dueDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + this.extendedDelivery.additionalDays));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Method to calculate progress based on milestone completion
OrderSchema.methods.calculateProgress = function() {
  if (!this.milestones || this.milestones.length === 0) {
    return 0;
  }
  
  const completedMilestones = this.milestones.filter(milestone => milestone.status === 'completed').length;
  const totalMilestones = this.milestones.length;
  
  return Math.round((completedMilestones / totalMilestones) * 100);
};

// Pre-save hook to update progress
OrderSchema.pre('save', function(next) {
  if (this.milestones && this.milestones.length > 0) {
    this.progress = this.calculateProgress();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);