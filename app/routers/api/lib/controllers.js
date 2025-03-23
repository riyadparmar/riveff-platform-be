const Service = require('../../../../models/lib/ServiceSchema');

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
    const service = await Service.findById(req.params.serviceId)
      .populate('sellerId', 'name level languages');

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
    const newService = new Service({
      ...req.body,
      // sellerId: req.user._id,
      // sellerName: req.user.name
    });

    const savedService = await newService.save();

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
    const updatedService = await Service.findOneAndUpdate(
      { _id: req.params.serviceId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found or you are not authorized to update' 
      });
    }

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
controllers.deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findOneAndDelete({ 
      _id: req.params.serviceId, 
      // sellerId: req.user._id 
    });
    console.log(req.user);
    console.log(req.params);
    
    if (!deletedService) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found or you are not authorized to delete' 
      });
    }

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

module.exports = controllers;