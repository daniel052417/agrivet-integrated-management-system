const Customer = require('../models/Customer');
const logger = require('../config/logger');

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.getById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getCustomerById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer',
      error: error.message
    });
  }
};

// Get customer by email
const getCustomerByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.getByEmail(email);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getCustomerByEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer',
      error: error.message
    });
  }
};

// Get customer by phone
const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = await Customer.getByPhone(phone);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getCustomerByPhone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer',
      error: error.message
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const customerData = req.body;
    const customer = await Customer.create(customerData);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    logger.error('Error in createCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Create guest customer
const createGuestCustomer = async (req, res) => {
  try {
    const guestData = req.body;
    const customer = await Customer.createGuest(guestData);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Guest customer created successfully'
    });
  } catch (error) {
    logger.error('Error in createGuestCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create guest customer',
      error: error.message
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const customer = await Customer.update(id, updateData);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// Get customer order history
const getCustomerOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const orders = await Customer.getOrderHistory(id, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: orders,
      message: 'Customer order history retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getCustomerOrderHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer order history',
      error: error.message
    });
  }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await Customer.getCustomerStats(id);
    
    res.json({
      success: true,
      data: stats,
      message: 'Customer statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getCustomerStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer statistics',
      error: error.message
    });
  }
};

// Search customers
const searchCustomers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const customers = await Customer.searchCustomers(q, parseInt(limit));
    
    res.json({
      success: true,
      data: customers,
      message: 'Customers searched successfully'
    });
  } catch (error) {
    logger.error('Error in searchCustomers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search customers',
      error: error.message
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.delete(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

module.exports = {
  getCustomerById,
  getCustomerByEmail,
  getCustomerByPhone,
  createCustomer,
  createGuestCustomer,
  updateCustomer,
  getCustomerOrderHistory,
  getCustomerStats,
  searchCustomers,
  deleteCustomer
};












