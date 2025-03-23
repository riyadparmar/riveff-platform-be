const express = require('express');
const router = express.Router();
const controllers = require('./lib/controllers.js');

router.get('/', controllers.getService);
router.get('/search', controllers.searchService);
router.get('/:serviceId', controllers.singleService);
router.delete('/delete/:serviceId', controllers.deleteService);
router.put('/update/:serviceId', controllers.updateService);
router.post('/:serviceId/reviews',controllers.reviewService);
router.post('/add',controllers.createService);


module.exports = router;
