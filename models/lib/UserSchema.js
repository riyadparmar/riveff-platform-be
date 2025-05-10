const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: '/default-avatar.png'
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  isSeller: {
    type: Boolean,
    default: false
  },
  sellerProfile: {
    description: {
      type: String
    },
    languages: [{
      type: String
    }],
    skills: [{
      type: String
    }],
    sellerLevel: {
      type: String,
      enum: ['Level 1', 'Level 2', 'Top Rated'],
      default: 'Level 1'
    },
    averageResponseTime: {
      type: Number,
      default: 24 // in hours
    },
    completedProjects: {
      type: Number,
      default: 0
    },
    ongoingProjects: {
      type: Number,
      default: 0
    },
    location: {
      country: {
        type: String
      },
      city: {
        type: String
      }
    },
    memberSince: {
      type: Date,
      default: Date.now
    }
  },
  balance: {
    available: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  favoritedServices: [{
    type: Schema.Types.ObjectId,
    ref: 'Service'
  }],
  purchasedServices: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  createdServices: [{
    type: Schema.Types.ObjectId,
    ref: 'Service'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for search
UserSchema.index({ 
  username: 'text', 
  firstName: 'text', 
  lastName: 'text',
  'sellerProfile.skills': 'text' 
});

module.exports = mongoose.model('User', UserSchema);