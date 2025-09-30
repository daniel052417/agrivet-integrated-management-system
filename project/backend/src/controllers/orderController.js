const { OrderService } = require('../models/Order');
const logger = require('../config/logger');

// Create new order
const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const result = await OrderService.createOrder(orderData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Order created successfully'
    });
  } catch (error) {
    logger.error('Error in createOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderService.getById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
};

// Get order by order number
const getOrderByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await OrderService.getByOrderNumber(orderNumber);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getOrderByOrderNumber:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await OrderService.updateStatus(id, status);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Get orders by customer
const getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const orders = await OrderService.getByCustomer(
      customerId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: orders,
      message: 'Customer orders retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getOrdersByCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer orders',
      error: error.message
    });
  }
};

// Get orders by branch
const getOrdersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    const orders = await OrderService.getByBranch(
      branchId, 
      status, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: orders,
      message: 'Branch orders retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getOrdersByBranch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch orders',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderService.cancelOrder(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    logger.error('Error in cancelOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    
    const stats = await OrderService.getOrderStats(branchId, startDate, endDate);
    
    res.json({
      success: true,
      data: stats,
      message: 'Order statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getOrderStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order statistics',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByOrderNumber,
  updateOrderStatus,
  getOrdersByCustomer,
  getOrdersByBranch,
  cancelOrder,
  getOrderStats
};

