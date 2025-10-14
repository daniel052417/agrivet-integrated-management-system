const { PromotionService } = require('../models/Promotion');
const logger = require('../config/logger');

// Get active promotions
const getActivePromotions = async (req, res) => {
  try {
    const { branchId } = req.query;
    const promotions = await PromotionService.getActivePromotions(branchId);
    
    res.json({
      success: true,
      data: promotions,
      message: 'Active promotions retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getActivePromotions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active promotions',
      error: error.message
    });
  }
};

// Get banner promotions
const getBannerPromotions = async (req, res) => {
  try {
    const { branchId } = req.query;
    const promotions = await PromotionService.getBannerPromotions(branchId);
    
    res.json({
      success: true,
      data: promotions,
      message: 'Banner promotions retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getBannerPromotions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve banner promotions',
      error: error.message
    });
  }
};

// Get modal promotions
const getModalPromotions = async (req, res) => {
  try {
    const { branchId } = req.query;
    const promotions = await PromotionService.getModalPromotions(branchId);
    
    res.json({
      success: true,
      data: promotions,
      message: 'Modal promotions retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getModalPromotions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve modal promotions',
      error: error.message
    });
  }
};

// Get promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await PromotionService.getById(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.json({
      success: true,
      data: promotion,
      message: 'Promotion retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getPromotionById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promotion',
      error: error.message
    });
  }
};

// Get promotion by code
const getPromotionByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const promotion = await PromotionService.getByCode(code);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.json({
      success: true,
      data: promotion,
      message: 'Promotion retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getPromotionByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promotion',
      error: error.message
    });
  }
};

// Validate promotion
const validatePromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const orderData = req.body;
    
    const validation = await PromotionService.validatePromotion(promotionId, orderData);
    
    res.json({
      success: validation.valid,
      data: validation,
      message: validation.valid ? 'Promotion is valid' : validation.message
    });
  } catch (error) {
    logger.error('Error in validatePromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promotion',
      error: error.message
    });
  }
};

// Apply promotion
const applyPromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const orderData = req.body;
    
    const result = await PromotionService.applyPromotion(promotionId, orderData);
    
    res.json({
      success: result.valid,
      data: result,
      message: result.valid ? 'Promotion applied successfully' : result.message
    });
  } catch (error) {
    logger.error('Error in applyPromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply promotion',
      error: error.message
    });
  }
};

// Record promotion usage
const recordPromotionUsage = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const { customerId, orderId } = req.body;
    
    const usage = await PromotionService.recordUsage(promotionId, customerId, orderId);
    
    res.json({
      success: true,
      data: usage,
      message: 'Promotion usage recorded successfully'
    });
  } catch (error) {
    logger.error('Error in recordPromotionUsage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record promotion usage',
      error: error.message
    });
  }
};

// Get promotion targets (products/categories)
const getPromotionTargets = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const targets = await PromotionService.getPromotionTargets(promotionId);
    
    res.json({
      success: true,
      data: targets,
      message: 'Promotion targets retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getPromotionTargets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promotion targets',
      error: error.message
    });
  }
};

// Get promotion branches
const getPromotionBranches = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const branches = await PromotionService.getPromotionBranches(promotionId);
    
    res.json({
      success: true,
      data: branches,
      message: 'Promotion branches retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getPromotionBranches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promotion branches',
      error: error.message
    });
  }
};

// Create promotion
const createPromotion = async (req, res) => {
  try {
    const promotionData = req.body;
    const promotion = await PromotionService.create(promotionData);
    
    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully'
    });
  } catch (error) {
    logger.error('Error in createPromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create promotion',
      error: error.message
    });
  }
};

// Update promotion
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const promotion = await PromotionService.update(id, updateData);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.json({
      success: true,
      data: promotion,
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    logger.error('Error in updatePromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update promotion',
      error: error.message
    });
  }
};

// Delete promotion
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await PromotionService.delete(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.json({
      success: true,
      data: promotion,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deletePromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
      error: error.message
    });
  }
};

module.exports = {
  getActivePromotions,
  getBannerPromotions,
  getModalPromotions,
  getPromotionById,
  getPromotionByCode,
  validatePromotion,
  applyPromotion,
  recordPromotionUsage,
  getPromotionTargets,
  getPromotionBranches,
  createPromotion,
  updatePromotion,
  deletePromotion
};













