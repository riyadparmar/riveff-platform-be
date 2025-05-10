const express = require('express');
const router = express.Router();
const controllers = require('./lib/controllers');
const auth = require('../../../../backend/app/routers/users/lib/middlewares'); // Assuming you have auth middleware

// Order routes
router.get('/', controllers.getOrders);
router.get('/buyer', auth, controllers.getBuyerOrders);
router.get('/seller', auth, controllers.getSellerOrders);
router.get('/:orderId', controllers.getOrderById);
router.post('/create', auth, controllers.createOrder);
router.put('/updateOrder/:orderId', auth, controllers.updateOrder);
router.delete('/deleteOrder/:orderId', auth, controllers.deleteOrder);

// Seller-specific order routes
router.get('/seller/orders', auth, controllers.getSellerOrders);

// Order actions
router.put('/:orderId/status', auth, controllers.updateOrderStatus);
router.post('/:orderId/message', auth, controllers.addMessage);
router.put('/:orderId/extend-delivery', auth, controllers.extendDelivery);
router.post('/:orderId/milestone/:milestoneIndex/complete', auth, controllers.completeMilestone);
router.post('/:orderId/file', auth, controllers.uploadFile);
router.post('/:orderId/review', auth, controllers.submitReview);
router.post('/:orderId/cancel', auth, controllers.requestCancellation);

module.exports = router;