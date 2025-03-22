const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Review Schema (Sub-document)
const ReviewSchema = new Schema({
  userId: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Service Schema
const ServiceSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  sellerLevel: {
    type: String,
    enum: ['Level 1', 'Level 2', 'Top Rated'],
    default: 'Level 1'
  },
  category: {
    type: String,
    required: true,
    enum: ['Graphics & Design', 'Digital Marketing', 'Writing & Translation', 
           'Video & Animation', 'Programming & Tech', 'Other']
  },
  subcategory: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  pricing: {
    startingAt: {
      type: Number,
      required: true,
      min: 0
    },
    packages: [{
      name: {
        type: String,
        required: true,
        enum: ['Basic', 'Standard', 'Premium']
      },
      description: {
        type: String,
        required: true
      },
      deliveryTime: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 1
      },
      includedFeatures: [{
        type: String
      }]
    }]
  },
  requirements: {
    type: String,
    default: ''
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  reviews: [ReviewSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  languages: [{
    type: String,
    enum: ['English', 'Spanish', 'French', 'German', 'Other']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  featuredStatus: {
    isFeatured: {
      type: Boolean,
      default: false
    },
    featuredUntil: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Virtual for creating a URL-friendly slug
ServiceSchema.virtual('slug').get(function() {
  return this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
});

// Index for search functionality
ServiceSchema.index({ 
  title: 'text', 
  description: 'text',
  tags: 'text',
  category: 1,
  subcategory: 1,
  'pricing.startingAt': 1,
  averageRating: 1,
  createdAt: 1
});

// Method to calculate average rating when reviews are added/modified
ServiceSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = (totalRating / this.reviews.length).toFixed(1);
  this.totalReviews = this.reviews.length;
};

// Pre-save hook to update timestamp and recalculate rating
ServiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculateAverageRating();
  next();
});

module.exports = mongoose.model('Service', ServiceSchema);