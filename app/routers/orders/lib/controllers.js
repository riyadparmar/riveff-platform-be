const Order = require('../../../../models/lib/OrderSchema');
const Service = require('../../../../models/lib/ServiceSchema');
const User = require('../../../../models/lib/UserSchema'); // Assuming you have a User model

const controllers = {};

// 1. Get All Orders (Admin)
controllers.getOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      sortBy = 'newest',
      startDate,
      endDate
    } = req.query;

    // Build query object
    const query = {};
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sorting logic
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      'due-soon': { dueDate: 1 }
    };

    const orders = await Order.find(query)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('buyerId', 'name email profileImage')
      .populate('sellerId', 'name email profileImage')
      .select('-messages'); // Exclude messages to reduce response size

    const total = await Order.countDocuments(query);

    res.json({
      totalOrders: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching orders', 
      details: error.message 
    });
  }
};

// 2. Get Buyer Orders (Filtered by logged-in user)
controllers.getBuyerOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      sortBy = 'newest'
    } = req.query;

    // Build query object
    const query = { buyerId: req.user._id };
    if (status) query.status = status;

    // Sorting logic
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'due-soon': { dueDate: 1 }
    };

    const orders = await Order.find(query)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sellerId', 'name email profileImage')
      .select('-messages'); // Exclude messages to reduce response size

    const total = await Order.countDocuments(query);

    res.json({
      totalOrders: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching your orders', 
      details: error.message 
    });
  }
};

// 3. Get Seller Orders (Filtered by logged-in user)
controllers.getSellerOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      sortBy = 'newest'
    } = req.query;

    // Ensure user is a seller
    if (!req.user.isSeller) {
      return res.status(403).json({
        error: true,
        message: 'Only sellers can access seller orders'
      });
    }

    // Build query object
    const query = { sellerId: req.user._id };
    if (status) query.status = status;

    // Sorting logic
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'due-soon': { dueDate: 1 }
    };

    const orders = await Order.find(query)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('buyerId', 'username firstName lastName profilePicture email')
      .populate('serviceId', 'title category pricing');

    const total = await Order.countDocuments(query);

    res.json({
      totalOrders: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching your orders', 
      details: error.message 
    });
  }
};

// New function: Get seller's created services
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

// 4. Get Single Order Details
controllers.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('buyerId', 'name email profileImage')
      .populate('sellerId', 'name email profileImage')
      .populate('serviceId');

    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if user is authorized to view this order
    // Uncomment when using authentication
    /*
    if (req.user && (order.buyerId._id.toString() !== req.user._id.toString() && 
        order.sellerId._id.toString() !== req.user._id.toString() &&
        !req.user.isAdmin)) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to view this order'
      });
    }
    */

    res.json(order);
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error fetching order details', 
      details: error.message 
    });
  }
};

// 5. Create a New Order
controllers.createOrder = async (req, res) => {
  try {
    // Get service details
    const service = await Service.findById(req.body.serviceId);
    if (!service) {
      return res.status(404).json({ 
        error: true, 
        message: 'Service not found' 
      });
    }

    // Check if user is trying to order their own service
    if (service.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: true,
        message: 'You cannot order your own service'
      });
    }

    // Get package details
    const packageSelected = req.body.packageSelected || 'Basic';
    const packageDetails = service.pricing.packages.find(pkg => pkg.name === packageSelected);
    
    if (!packageDetails) {
      return res.status(400).json({ 
        error: true, 
        message: 'Invalid package selected' 
      });
    }

    // Create new order
    const newOrder = new Order({
      serviceId: service._id,
      serviceTitle: service.title,
      packageSelected,
      buyerId: req.user._id,
      sellerId: service.sellerId,
      price: packageDetails.price,
      deliveryTime: packageDetails.deliveryTime,
      dueDate: new Date(Date.now() + (packageDetails.deliveryTime * 24 * 60 * 60 * 1000)), // Convert days to milliseconds
      requirements: req.body.requirements,
      status: 'Pending',
      statusHistory: [{
        status: 'Pending',
        note: 'Order created',
        changedBy: req.user._id
      }],
      milestones: req.body.milestones || [],
      revisions: {
        available: packageDetails.revisions || 0,
        used: 0
      }
    });

    // Create initial message
    if (req.body.initialMessage) {
      newOrder.messages.push({
        sender: 'buyer',
        userId: req.user._id,
        text: req.body.initialMessage
      });
    }

    const savedOrder = await newOrder.save();

    // Add order to user's purchasedServices
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { purchasedServices: savedOrder._id } }
    );
    
    // Update seller's ongoingProjects count
    await User.findByIdAndUpdate(
      service.sellerId,
      { $inc: { 'sellerProfile.ongoingProjects': 1 } }
    );

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error creating order', 
      details: error.message 
    });
  }
};

// 6. Update Order
controllers.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if user is authorized to update this order
    if (req.user._id.toString() !== order.buyerId.toString() && 
        req.user._id.toString() !== order.sellerId.toString() &&
        !req.user.isAdmin) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to update this order'
      });
    }

    // Restrict what can be updated based on order status
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        error: true,
        message: 'Cannot update a completed or cancelled order'
      });
    }

    // Fields that can be updated
    const updatableFields = [
      'requirements',
      'milestones',
      'files',
      'progress'
    ];

    // Apply updates for allowed fields only
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error updating order', 
      details: error.message 
    });
  }
};

// 7. Delete Order
controllers.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check user authorization
    const isSeller = req.user._id.toString() === order.sellerId.toString();
    const isBuyer = req.user._id.toString() === order.buyerId.toString();
    const isAdmin = req.user.isAdmin;

    if (!isAdmin && !isSeller && !isBuyer) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to delete this order'
      });
    }

    // Check order status
    if (order.status !== 'Pending') {
      return res.status(400).json({
        error: true,
        message: `Order cannot be deleted because it is in ${order.status} status. Only Pending orders can be deleted.`
      });
    }

    const deletedOrder = await Order.findByIdAndDelete(req.params.orderId);

    res.json({ 
      message: 'Order successfully deleted',
      deletedOrder 
    });
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Error deleting order', 
      details: error.message 
    });
  }
};

// 8. Update Order Status
controllers.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if status is valid
    const validStatuses = ['Pending', 'In Progress', 'Delivered', 'Revision Requested', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: true, 
        message: 'Invalid status' 
      });
    }

    // Check permission based on status change
    const isBuyer = req.user._id.toString() === order.buyerId.toString();
    const isSeller = req.user._id.toString() === order.sellerId.toString();

    // Define who can change to which status
    const statusPermissions = {
      'In Progress': ['seller'],
      'Delivered': ['seller'],
      'Revision Requested': ['buyer'],
      'Completed': ['buyer'],
      'Cancelled': ['buyer', 'seller', 'admin']
    };

    const userRole = isBuyer ? 'buyer' : isSeller ? 'seller' : req.user.isAdmin ? 'admin' : 'none';
    
    if (statusPermissions[status] && !statusPermissions[status].includes(userRole)) {
      return res.status(403).json({
        error: true,
        message: `You are not authorized to change the status to ${status}`
      });
    }

    // If status is Completed, set completedAt
    if (status === 'Completed' && order.status !== 'Completed') {
      order.completedAt = new Date();
    }

    // Update status
    order.status = status;
    
    // Add to status history
    order.statusHistory.push({
      status,
      note: note || `Status changed to ${status}`,
      changedBy: req.user._id
    });

    // If delivered and previously revision requested, increment revision used count
    if (status === 'Delivered' && order.status === 'Revision Requested') {
      order.revisions.used += 1;
    }

    const updatedOrder = await order.save();

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error updating order status', 
      details: error.message 
    });
  }
};

// 9. Add Message
controllers.addMessage = async (req, res) => {
  try {
    const { text, attachment } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if user is a participant in this order
    const isBuyer = req.user._id.toString() === order.buyerId.toString();
    const isSeller = req.user._id.toString() === order.sellerId.toString();

    if (!isBuyer && !isSeller && !req.user.isAdmin) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to send messages in this order'
      });
    }

    // Create new message
    const newMessage = {
      sender: isBuyer ? 'buyer' : 'seller',
      userId: req.user._id,
      text,
      attachment,
      time: new Date(),
      isRead: false
    };

    order.messages.push(newMessage);
    await order.save();

    res.status(201).json({
      message: 'Message sent successfully',
      sentMessage: newMessage
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error sending message', 
      details: error.message 
    });
  }
};

// 10. Extend Delivery Time
controllers.extendDelivery = async (req, res) => {
  try {
    const { additionalDays, reason } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Only seller can request extension
    if (req.user._id.toString() !== order.sellerId.toString()) {
      return res.status(403).json({
        error: true,
        message: 'Only the seller can request a delivery extension'
      });
    }

    // Check if order is in a status that can be extended
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        error: true,
        message: 'Cannot extend a completed or cancelled order'
      });
    }

    // Update extension details
    order.extendedDelivery = {
      isExtended: true,
      additionalDays: parseInt(additionalDays),
      reason,
      approvedAt: null // Will be set when buyer approves
    };

    await order.save();

    // Create system message about the extension request
    const extensionMessage = {
      sender: 'seller',
      userId: req.user._id,
      text: `Requested a delivery extension of ${additionalDays} days. Reason: ${reason}`,
      time: new Date(),
      isRead: false
    };

    order.messages.push(extensionMessage);
    await order.save();

    res.json({
      message: 'Delivery extension requested successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error requesting delivery extension', 
      details: error.message 
    });
  }
};

// 11. Complete Milestone
controllers.completeMilestone = async (req, res) => {
  try {
    const { milestoneIndex } = req.params;
    const { deliverables, feedback } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if milestone exists
    if (!order.milestones[milestoneIndex]) {
      return res.status(404).json({ 
        error: true, 
        message: 'Milestone not found' 
      });
    }

    // Only seller can mark milestone as completed
    if (req.user._id.toString() !== order.sellerId.toString()) {
      return res.status(403).json({
        error: true,
        message: 'Only the seller can mark a milestone as completed'
      });
    }

    // Update milestone
    order.milestones[milestoneIndex].status = 'completed';
    
    // Add deliverables if provided
    if (deliverables && deliverables.length > 0) {
      order.milestones[milestoneIndex].deliverables = deliverables;
    }
    
    // Add feedback if provided
    if (feedback) {
      order.milestones[milestoneIndex].feedback = feedback;
    }

    // Recalculate progress
    order.progress = order.calculateProgress();

    await order.save();

    // Create system message about the milestone completion
    const milestoneMessage = {
      sender: 'seller',
      userId: req.user._id,
      text: `Completed milestone: ${order.milestones[milestoneIndex].title}`,
      time: new Date(),
      isRead: false
    };

    order.messages.push(milestoneMessage);
    await order.save();

    res.json({
      message: 'Milestone completed successfully',
      milestone: order.milestones[milestoneIndex],
      progress: order.progress
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error completing milestone', 
      details: error.message 
    });
  }
};

// 12. Upload File
controllers.uploadFile = async (req, res) => {
  try {
    const { name, url, size, type, description, category } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if user is a participant in this order
    const isBuyer = req.user._id.toString() === order.buyerId.toString();
    const isSeller = req.user._id.toString() === order.sellerId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to upload files to this order'
      });
    }

    // Create new file
    const newFile = {
      name,
      url,
      size,
      type,
      uploadedBy: isBuyer ? 'buyer' : 'seller',
      date: new Date(),
      description,
      category: category || 'reference'
    };

    order.files.push(newFile);
    await order.save();

    // Create message about the file upload
    const fileMessage = {
      sender: isBuyer ? 'buyer' : 'seller',
      userId: req.user._id,
      text: `Uploaded a new file: ${name}`,
      attachment: url,
      time: new Date(),
      isRead: false
    };

    order.messages.push(fileMessage);
    await order.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: newFile
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error uploading file', 
      details: error.message 
    });
  }
};

// 13. Submit Review
controllers.submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Only buyer can submit review
    if (req.user._id.toString() !== order.buyerId.toString()) {
      return res.status(403).json({
        error: true,
        message: 'Only the buyer can submit a review'
      });
    }

    // Check if order is completed
    if (order.status !== 'Completed') {
      return res.status(400).json({
        error: true,
        message: 'Can only review completed orders'
      });
    }

    // Check if already reviewed
    if (order.review && order.review.rating) {
      return res.status(400).json({
        error: true,
        message: 'You have already submitted a review for this order'
      });
    }

    // Add review
    order.review = {
      rating: parseFloat(rating),
      comment,
      createdAt: new Date()
    };

    await order.save();

    // Also update service rating - You may need to adjust this based on your Service model structure
    const service = await Service.findById(order.serviceId);
    if (service) {
      // Assuming your Service model has a method to recalculate rating
      // If not, you'll need to implement the logic here
      if (typeof service.calculateAverageRating === 'function') {
        service.reviews.push({
          userId: req.user._id,
          rating: parseFloat(rating),
          comment
        });
        service.calculateAverageRating();
        await service.save();
      }
    }

    res.json({
      message: 'Review submitted successfully',
      review: order.review
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error submitting review', 
      details: error.message 
    });
  }
};

// 14. Request Cancellation
controllers.requestCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: true, 
        message: 'Order not found' 
      });
    }

    // Check if user is a participant in this order
    const isBuyer = req.user._id.toString() === order.buyerId.toString();
    const isSeller = req.user._id.toString() === order.sellerId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        error: true,
        message: 'You are not authorized to request cancellation for this order'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        error: true,
        message: 'Cannot request cancellation for a completed or already cancelled order'
      });
    }

    // Check if cancellation already requested
    if (order.cancellationRequest.isRequested) {
      return res.status(400).json({
        error: true,
        message: 'Cancellation has already been requested for this order'
      });
    }

    // Update cancellation request
    order.cancellationRequest = {
      isRequested: true,
      requestedBy: isBuyer ? 'buyer' : 'seller',
      reason,
      requestDate: new Date(),
      status: 'pending'
    };

    await order.save();

    // Create message about the cancellation request
    const cancellationMessage = {
      sender: isBuyer ? 'buyer' : 'seller',
      userId: req.user._id,
      text: `Requested cancellation. Reason: ${reason}`,
      time: new Date(),
      isRead: false
    };

    order.messages.push(cancellationMessage);
    await order.save();

    res.json({
      message: 'Cancellation requested successfully',
      cancellationRequest: order.cancellationRequest
    });
  } catch (error) {
    res.status(400).json({ 
      error: true, 
      message: 'Error requesting cancellation', 
      details: error.message 
    });
  }
};

module.exports = controllers;