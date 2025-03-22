const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Payment Schema
const PaymentSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
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
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  platformFee: {
    type: Number,
    required: true
  },
  sellerEarnings: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer', 'wallet'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentDetails: {
    type: Map,
    of: Schema.Types.Mixed
  },
  refunds: [{
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    transactionId: {
      type: String
    },
    processingFee: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    }
  }],
  billingAddress: {
    name: {
      type: String
    },
    addressLine1: {
      type: String
    },
    addressLine2: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    country: {
      type: String
    },
    zipCode: {
      type: String
    }
  },
  invoiceId: {
    type: String
  },
  invoiceUrl: {
    type: String
  },
  notes: {
    type: String
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  paymentIntentId: {
    type: String
  },
  payoutId: {
    type: String
  },
  isDisputed: {
    type: Boolean,
    default: false
  },
  disputeDetails: {
    disputeId: {
      type: String
    },
    reason: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'closed'],
      default: 'pending'
    },
    openedAt: {
      type: Date
    },
    closedAt: {
      type: Date
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
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
PaymentSchema.index({ 
  orderId: 1 
});
PaymentSchema.index({ 
  buyerId: 1, 
  status: 1 
});
PaymentSchema.index({ 
  sellerId: 1, 
  status: 1 
});
PaymentSchema.index({ 
  transactionId: 1 
});
PaymentSchema.index({ 
  createdAt: -1 
});

// Method to process refund
PaymentSchema.methods.processRefund = function(amount, reason, requestedBy) {
  const refund = {
    amount,
    reason,
    requestedBy,
    createdAt: Date.now()
  };
  
  this.refunds.push(refund);
  
  // Update status if full refund
  if (amount === this.amount) {
    this.status = 'refunded';
  } else if (amount < this.amount) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Pre-save hook
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set completedAt date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);