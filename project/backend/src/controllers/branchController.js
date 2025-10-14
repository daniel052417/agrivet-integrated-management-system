const Branch = require('../models/Branch');
const logger = require('../config/logger');

// Get all branches
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.getAll();
    
    res.json({
      success: true,
      data: branches,
      message: 'Branches retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getAllBranches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branches',
      error: error.message
    });
  }
};

// Get branch by ID
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.getById(id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: branch,
      message: 'Branch retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getBranchById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch',
      error: error.message
    });
  }
};

// Get branch by code
const getBranchByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const branch = await Branch.getByCode(code);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: branch,
      message: 'Branch retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getBranchByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch',
      error: error.message
    });
  }
};

// Get branch operating hours
const getBranchOperatingHours = async (req, res) => {
  try {
    const { id } = req.params;
    const operatingHours = await Branch.getOperatingHours(id);
    
    res.json({
      success: true,
      data: operatingHours,
      message: 'Branch operating hours retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getBranchOperatingHours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch operating hours',
      error: error.message
    });
  }
};

// Check if branch is open
const isBranchOpen = async (req, res) => {
  try {
    const { id } = req.params;
    const isOpen = await Branch.isBranchOpen(id);
    
    res.json({
      success: true,
      data: { isOpen },
      message: 'Branch status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in isBranchOpen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check branch status',
      error: error.message
    });
  }
};

// Get branch availability
const getBranchAvailability = async (req, res) => {
  try {
    const availability = await Branch.getBranchAvailability();
    
    res.json({
      success: true,
      data: availability,
      message: 'Branch availability retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getBranchAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch availability',
      error: error.message
    });
  }
};

// Create new branch
const createBranch = async (req, res) => {
  try {
    const branchData = req.body;
    const branch = await Branch.create(branchData);
    
    res.status(201).json({
      success: true,
      data: branch,
      message: 'Branch created successfully'
    });
  } catch (error) {
    logger.error('Error in createBranch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch',
      error: error.message
    });
  }
};

// Update branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const branch = await Branch.update(id, updateData);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: branch,
      message: 'Branch updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateBranch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update branch',
      error: error.message
    });
  }
};

// Delete branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.delete(id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: branch,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteBranch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch',
      error: error.message
    });
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  getBranchByCode,
  getBranchOperatingHours,
  isBranchOpen,
  getBranchAvailability,
  createBranch,
  updateBranch,
  deleteBranch
};













