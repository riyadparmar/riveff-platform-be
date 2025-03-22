const express = require('express');
const router = express.Router();
const controllers = require('./lib/controllers.js');

router.get('/', controllers.getService);
router.get('/search', controllers.searchService);
router.get('/:serviceId', controllers.singleService);
router.delete('/:serviceId', controllers.deleteService);
router.put('/:serviceId', controllers.updateService);
router.post('/:serviceId/reviews',controllers.reviewService);
router.post('/',controllers.createService);

module.exports = router;
