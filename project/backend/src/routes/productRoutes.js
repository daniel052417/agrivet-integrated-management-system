const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Product routes
router.get('/categories', productController.getCategories);
router.get('/search/:branchId', productController.searchProducts);
router.get('/:branchId', productController.getProducts);
router.get('/:branchId/:productId', productController.getProductById);
router.get('/:branchId/:productId/availability', productController.checkAvailability);

module.exports = router;
















