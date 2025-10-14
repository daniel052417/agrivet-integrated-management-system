const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Order routes
router.get('/stats', orderController.getOrderStats);
router.get('/customer/:customerId', orderController.getOrdersByCustomer);
router.get('/branch/:branchId', orderController.getOrdersByBranch);
router.get('/:id', orderController.getOrderById);
router.get('/number/:orderNumber', orderController.getOrderByOrderNumber);
router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/cancel', orderController.cancelOrder);

module.exports = router;













