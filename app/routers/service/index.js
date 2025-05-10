const express = require('express');
const router = express.Router();
const controllers = require('./lib/controllers.js');
const auth = require('../../../../backend/app/routers/users/lib/middlewares');

// Public routes
router.get('/', controllers.getService);
router.get('/search', controllers.searchService);
router.get('/:serviceId', controllers.singleService);

// Seller-specific routes
router.get('/seller/services', auth, controllers.getSellerServices);

// Protected routes (require authentication)
router.post('/add', auth, controllers.createService);
router.put('/update/:serviceId', auth, controllers.updateService);
router.delete('/delete/:serviceId', auth, controllers.deleteService);
router.post('/:serviceId/reviews', auth, controllers.reviewService);

module.exports = router;
