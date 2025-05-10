const express = require('express');
const router = express.Router();
const controllers = require('./lib/controllers');
const auth = require('../../../../backend/app/routers/users/lib/middlewares');

// Authentication routes (no auth required)
router.post('/register', controllers.register);
router.post('/login', controllers.login);
router.get('/verify-token', auth, controllers.verifyToken);

// User routes (auth required)
router.get('/profile', auth, controllers.getProfile);
router.put('/profile', auth, controllers.updateProfile);
router.put('/change-password', auth, controllers.changePassword);
router.delete('/delete', auth, controllers.deleteAccount);

// Seller-related routes
router.post('/become-seller', auth, controllers.becomeSeller);

// Favorites
router.post('/favorites', auth, controllers.addFavorite);
router.delete('/favorites/:serviceId', auth, controllers.removeFavorite);

// Notifications
router.get('/notifications', auth, controllers.getNotifications);
router.put('/notifications/:notificationId/read', auth, controllers.markNotificationRead);

// Public user profile
router.get('/:userId', controllers.getUserById);

module.exports = router;