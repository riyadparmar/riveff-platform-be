const User = require('../../../../models/lib/UserSchema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Secret key for JWT - should be in env variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const controllers = {};

// 1. Register a new user
controllers.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      isSeller,
      sellerProfile
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: existingUser.email === email.toLowerCase() ? 
          'Email already in use' : 'Username already taken'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password, // will be hashed by pre-save hook
      firstName,
      lastName,
      isSeller: isSeller || false,
      sellerProfile: isSeller ? sellerProfile : undefined
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isSeller: newUser.isSeller 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    newUser.lastLogin = Date.now();
    await newUser.save();

    // Return user data without password
    const userResponse = { ...newUser._doc };
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error registering user',
      details: error.message
    });
  }
};

// 2. Login user
controllers.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        error: true,
        message: `Your account is ${user.accountStatus}. Please contact support.`
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username,
        email: user.email,
        isSeller: user.isSeller 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Return user data without password
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error logging in',
      details: error.message
    });
  }
};

// 3. Get user profile
controllers.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('favoritedServices', 'title description pricing category')
      .populate('purchasedServices', 'serviceTitle status dueDate price')
      .populate('createdServices', 'title description pricing category');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error fetching user profile',
      details: error.message
    });
  }
};

// 4. Get user by ID (public profile)
controllers.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username firstName lastName profilePicture isSeller sellerProfile averageRating totalReviews createdAt');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error fetching user',
      details: error.message
    });
  }
};

// 5. Update user profile
controllers.updateProfile = async (req, res) => {
  try {
    const updatableFields = [
      'firstName',
      'lastName',
      'profilePicture',
      'sellerProfile'
    ];

    // Create update object with only allowed fields
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (updatableFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Special handling for becoming a seller
    if (req.body.isSeller === true && !req.user.isSeller) {
      updateData.isSeller = true;
      
      // Initialize seller profile if not exists
      if (!updateData.sellerProfile) {
        updateData.sellerProfile = {
          description: '',
          languages: [],
          skills: [],
          sellerLevel: 'Level 1',
          memberSince: Date.now()
        };
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error updating profile',
      details: error.message
    });
  }
};

// 6. Change password
controllers.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error changing password',
      details: error.message
    });
  }
};

// 7. Delete account
controllers.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Password is incorrect'
      });
    }

    // Instead of actually deleting, deactivate the account
    user.accountStatus = 'deactivated';
    await user.save();

    // For complete deletion, use:
    // await User.findByIdAndDelete(req.user.id);

    res.json({
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error deactivating account',
      details: error.message
    });
  }
};

// 8. Add favorite service
controllers.addFavorite = async (req, res) => {
  try {
    const { serviceId } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favoritedServices: serviceId } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json({
      message: 'Service added to favorites',
      favoritedServices: user.favoritedServices
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error adding service to favorites',
      details: error.message
    });
  }
};

// 9. Remove favorite service
controllers.removeFavorite = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favoritedServices: serviceId } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json({
      message: 'Service removed from favorites',
      favoritedServices: user.favoritedServices
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error removing service from favorites',
      details: error.message
    });
  }
};

// 10. Get user notifications
controllers.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Filter and paginate notifications
    let notifications = user.notifications;
    
    if (unreadOnly === 'true') {
      notifications = notifications.filter(notif => !notif.isRead);
    }
    
    // Sort by date (newest first)
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotifications = notifications.slice(startIndex, endIndex);
    
    res.json({
      total: notifications.length,
      totalPages: Math.ceil(notifications.length / limit),
      currentPage: parseInt(page),
      notifications: paginatedNotifications
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error fetching notifications',
      details: error.message
    });
  }
};

// 11. Mark notification as read
controllers.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Find and update the notification
    const notification = user.notifications.id(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        error: true,
        message: 'Notification not found'
      });
    }
    
    notification.isRead = true;
    await user.save();
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error marking notification as read',
      details: error.message
    });
  }
};

// 12. Verify token (useful for frontend authentication)
controllers.verifyToken = async (req, res) => {
  try {
    // The auth middleware already verified the token
    // Just fetch user data without password
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      valid: true,
      user
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      message: 'Invalid token',
      details: error.message
    });
  }
};

// New function to become a seller
controllers.becomeSeller = async (req, res) => {
  try {
    const { description, skills, languages, location } = req.body;
    
    // Check if already a seller
    if (req.user.isSeller) {
      return res.status(400).json({
        error: true,
        message: 'You are already registered as a seller'
      });
    }
    
    // Create seller profile data
    const sellerProfile = {
      description: description || '',
      skills: skills || [],
      languages: languages || [],
      sellerLevel: 'Level 1',
      averageResponseTime: 24,
      completedProjects: 0,
      ongoingProjects: 0,
      location: location || {},
      memberSince: Date.now()
    };
    
    // Update user to seller
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        isSeller: true,
        sellerProfile: sellerProfile
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      message: 'Successfully upgraded to seller account',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error becoming a seller',
      details: error.message
    });
  }
};

module.exports = controllers;