const { 
  PWASessionService, 
  PWAAnalyticsService, 
  PWACacheService, 
  PWANotificationService 
} = require('../models/PWAService');
const logger = require('../config/logger');

// PWA Session Management

// Create or update PWA session
const createOrUpdateSession = async (req, res) => {
  try {
    const sessionData = req.body;
    const session = await PWASessionService.createOrUpdateSession(sessionData);
    
    res.json({
      success: true,
      data: session,
      message: 'PWA session created/updated successfully'
    });
  } catch (error) {
    logger.error('Error in createOrUpdateSession:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update PWA session',
      error: error.message
    });
  }
};

// Get PWA session
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await PWASessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'PWA session not found'
      });
    }
    
    res.json({
      success: true,
      data: session,
      message: 'PWA session retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getSession:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve PWA session',
      error: error.message
    });
  }
};

// Update session cart data
const updateCartData = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { cartData } = req.body;
    
    const session = await PWASessionService.updateCartData(sessionId, cartData);
    
    res.json({
      success: true,
      data: session,
      message: 'Cart data updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateCartData:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart data',
      error: error.message
    });
  }
};

// Update dismissed banners
const updateDismissedBanners = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { dismissedBanners } = req.body;
    
    const session = await PWASessionService.updateDismissedBanners(sessionId, dismissedBanners);
    
    res.json({
      success: true,
      data: session,
      message: 'Dismissed banners updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateDismissedBanners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dismissed banners',
      error: error.message
    });
  }
};

// Update modal shown status
const updateModalShown = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { modalShown } = req.body;
    
    const session = await PWASessionService.updateModalShown(sessionId, modalShown);
    
    res.json({
      success: true,
      data: session,
      message: 'Modal shown status updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateModalShown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update modal shown status',
      error: error.message
    });
  }
};

// PWA Analytics

// Track PWA event
const trackEvent = async (req, res) => {
  try {
    const eventData = req.body;
    const event = await PWAAnalyticsService.trackEvent(eventData);
    
    res.json({
      success: true,
      data: event,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    logger.error('Error in trackEvent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      error: error.message
    });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    const { branchId, eventType, startDate, endDate } = req.query;
    
    const filters = {
      branchId,
      eventType,
      startDate,
      endDate
    };
    
    const analytics = await PWAAnalyticsService.getAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      message: 'Analytics data retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics data',
      error: error.message
    });
  }
};

// Get popular products
const getPopularProducts = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { limit = 10 } = req.query;
    
    const products = await PWAAnalyticsService.getPopularProducts(
      branchId, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: products,
      message: 'Popular products retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getPopularProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular products',
      error: error.message
    });
  }
};

// Get conversion funnel
const getConversionFunnel = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const funnel = await PWAAnalyticsService.getConversionFunnel(
      branchId, 
      startDate, 
      endDate
    );
    
    res.json({
      success: true,
      data: funnel,
      message: 'Conversion funnel retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getConversionFunnel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversion funnel',
      error: error.message
    });
  }
};

// PWA Cache Management

// Clear PWA cache
const clearCache = async (req, res) => {
  try {
    await PWACacheService.clearPWACache();
    
    res.json({
      success: true,
      message: 'PWA cache cleared successfully'
    });
  } catch (error) {
    logger.error('Error in clearCache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear PWA cache',
      error: error.message
    });
  }
};

// PWA Notifications

// Create notification
const createNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    const notification = await PWANotificationService.createNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    logger.error('Error in createNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Get notifications for customer
const getNotifications = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 20 } = req.query;
    
    const notifications = await PWANotificationService.getNotifications(
      customerId, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await PWANotificationService.markAsRead(notificationId);
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read successfully'
    });
  } catch (error) {
    logger.error('Error in markNotificationAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Send push notification
const sendPushNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    const result = await PWANotificationService.sendPushNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'Push notification sent successfully'
    });
  } catch (error) {
    logger.error('Error in sendPushNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push notification',
      error: error.message
    });
  }
};

module.exports = {
  // Session Management
  createOrUpdateSession,
  getSession,
  updateCartData,
  updateDismissedBanners,
  updateModalShown,
  
  // Analytics
  trackEvent,
  getAnalytics,
  getPopularProducts,
  getConversionFunnel,
  
  // Cache Management
  clearCache,
  
  // Notifications
  createNotification,
  getNotifications,
  markNotificationAsRead,
  sendPushNotification
};
















