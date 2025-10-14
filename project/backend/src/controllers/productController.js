const { ProductService } = require('../models/Product');
const logger = require('../config/logger');

// Get products for branch
const getProducts = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { 
      category, 
      priceMin, 
      priceMax, 
      searchQuery, 
      inStock, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filters = {
      category,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      searchQuery,
      inStock: inStock !== undefined ? inStock === 'true' : undefined
    };
    
    const result = await ProductService.getProducts(
      branchId, 
      filters, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { productId, branchId } = req.params;
    const product = await ProductService.getProductById(productId, branchId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product,
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: error.message
    });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const categories = await ProductService.getCategories();
    
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const products = await ProductService.searchProducts(q, branchId, parseInt(limit));
    
    res.json({
      success: true,
      data: products,
      message: 'Products searched successfully'
    });
  } catch (error) {
    logger.error('Error in searchProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

// Check product availability
const checkAvailability = async (req, res) => {
  try {
    const { productId, branchId } = req.params;
    const { quantity = 1 } = req.query;
    
    const isAvailable = await ProductService.checkAvailability(
      productId, 
      branchId, 
      parseInt(quantity)
    );
    
    res.json({
      success: true,
      data: { isAvailable },
      message: 'Product availability checked successfully'
    });
  } catch (error) {
    logger.error('Error in checkAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check product availability',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  searchProducts,
  checkAvailability
};













