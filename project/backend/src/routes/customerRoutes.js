const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Customer routes
router.get('/search', customerController.searchCustomers);
router.get('/email/:email', customerController.getCustomerByEmail);
router.get('/phone/:phone', customerController.getCustomerByPhone);
router.get('/:id', customerController.getCustomerById);
router.get('/:id/orders', customerController.getCustomerOrderHistory);
router.get('/:id/stats', customerController.getCustomerStats);
router.post('/', customerController.createCustomer);
router.post('/guest', customerController.createGuestCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;











