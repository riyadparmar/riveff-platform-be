const Service = require('../../../../models/lib/ServiceSchema');
const User = require('../../../../models/lib/UserSchema');

const controllers = {};

// 1. Get Services (Filtered & Paginated)
controllers.getService = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      minPrice, 
      maxPrice, 
      sellerLevel, 
      deliveryTime, 
      language,
      sortBy = 'newest'
    } = req.query;

    // Build query object
    const query = {};
    if (category) query.category = category;
    if (sellerLevel) query.sellerLevel = sellerLevel;
    if (language) query.languages = language;

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.startingAt'] = {};
      if (minPrice) query['pricing.startingAt'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.startingAt'].$lte = parseFloat(maxPrice);
    }

    // Sorting logic
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'price-low': { 'pricing.startingAt': 1 },
      'price-high': { 'pricing.startingAt': -1 },
      'rating': { averageRating: -1 }
    };

    const services = await Service.find(query)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('title description category pricing sellerName sellerLevel averageRating totalReviews images tags');

    const total = await Service.countDocuments(query);

    res.json({
      totalServices: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      services
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching services', 
      details: error.message 
    });
  }
};

// 2. Get Single Service Details
controllers.singleService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found' 
      });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching service details', 
      details: error.message 
    });
  }
};

// 3. Create a New Service
controllers.createService = async (req, res) => {
  try {
    // Check if user is a seller
    if (!req.user.isSeller) {
      return res.status(403).json({
        error: true,
        message: 'Only sellers can create services. Please upgrade to a seller account.'
      });
    }

    const newService = new Service({
      ...req.body,
      sellerId: req.user._id,
      sellerName: req.user.username || `${req.user.firstName} ${req.user.lastName}`.trim(),
      sellerLevel: req.user.sellerProfile?.sellerLevel || 'Level 1'
    });

    const savedService = await newService.save();

    // Add service to user's createdServices
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { createdServices: savedService._id } }
    );

    res.status(201).json(savedService);
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error creating service', 
      details: error.message 
    });
  }
};

// 4. Update a Service
controllers.updateService = async (req, res) => {
  try {
    // First find the service to check ownership
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found' 
      });
    }

    // Check if user is authorized to update this service
    if (service.sellerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to update this service'
      });
    }

    // Fields that can be updated
    const updatableFields = [
      'title',
      'description',
      'category',
      'subcategory',
      'tags',
      'pricing',
      'requirements',
      'images',
      'languages',
      'isActive'
    ];

    // Create update object with only allowed fields
    const updateData = {};
    Object.keys(req.body).forEach(field => {
      if (updatableFields.includes(field)) {
        updateData[field] = req.body[field];
      }
    });

    // Update the service with validated fields
    const updatedService = await Service.findByIdAndUpdate(
      req.params.serviceId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error updating service', 
      details: error.message 
    });
  }
};

// 5. Delete a Service
// 5. Delete a Service
controllers.deleteService = async (req, res) => {
  try {
    // First find the service to check ownership
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found' 
      });
    }

    // Check if user is authorized to delete this service
    if (service.sellerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to delete this service'
      });
    }

    // Check if service has active orders
    const activeOrders = await Order.countDocuments({
      serviceId: req.params.serviceId,
      status: { $nin: ['Completed', 'Cancelled'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        error: true,
        message: 'Cannot delete service with active orders. Please complete or cancel all orders first.'
      });
    }

    const deletedService = await Service.findByIdAndDelete(req.params.serviceId);
    
    // Remove service from user's createdServices
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { createdServices: req.params.serviceId } }
    );

    res.json({ 
      message: 'Service successfully deleted',
      deletedService 
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error deleting service', 
      details: error.message 
    });
  }
};

// 6. Add a Review to a Service
controllers.reviewService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found' 
      });
    }

    const newReview = {
      userId: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    };

    service.reviews.push(newReview);
    service.calculateAverageRating();

    await service.save();

    // Update seller's completedProjects count and rating
    // This assumes the review is being left after an order is completed
    const sellerUpdate = {
      $inc: { 'sellerProfile.completedProjects': 1 },
      $set: { averageRating: service.averageRating }
    };

    await User.findByIdAndUpdate(service.sellerId, sellerUpdate);

    res.status(201).json({
      message: 'Review added successfully',
      review: newReview,
      averageRating: service.averageRating,
      totalReviews: service.totalReviews
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error adding review', 
      details: error.message 
    });
  }
};

// 7. Search Services
controllers.searchService = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    const searchQuery = q ? { 
      $text: { $search: q } 
    } : {};

    const services = await Service.find(searchQuery)
      .sort({ score: { $meta: "textScore" } })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('title description category pricing sellerName sellerLevel averageRating totalReviews images tags');

    const total = await Service.countDocuments(searchQuery);

    res.json({
      totalServices: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      services
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error searching services', 
      details: error.message 
    });
  }
};

// Get Seller's Own Services
controllers.getSellerServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      status,
      sortBy = 'newest'
    } = req.query;

    // Ensure user is a seller
    if (!req.user.isSeller) {
      return res.status(403).json({
        error: true,
        message: 'Only sellers can access seller services'
      });
    }

    // Build query object
    const query = { sellerId: req.user._id };
    if (category) query.category = category;
    if (status) query.isActive = status === 'active';

    // Sorting logic
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'price-low': { 'pricing.startingAt': 1 },
      'price-high': { 'pricing.startingAt': -1 },
      'rating': { averageRating: -1 }
    };

    const services = await Service.find(query)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Service.countDocuments(query);

    res.json({
      totalServices: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      services
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching your services', 
      details: error.message 
    });
  }
};

module.exports = controllers;