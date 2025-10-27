const { query } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// PWA Session Management
class PWASessionService {
  // Create or update PWA session
  static async createOrUpdateSession(sessionData) {
    try {
      const { sessionId, branchId, customerId, isGuest, cartData, dismissedBanners, modalShown } = sessionData;
      
      // Check if session exists
      const existingSession = await this.getSession(sessionId);
      
      if (existingSession) {
        // Update existing session
        const result = await query(`
          UPDATE pwa_sessions 
          SET 
            branch_id = $2,
            customer_id = $3,
            is_guest = $4,
            cart_data = $5,
            dismissed_banners = $6,
            modal_shown = $7,
            updated_at = NOW(),
            expires_at = NOW() + INTERVAL '${process.env.PWA_SESSION_EXPIRY_HOURS || 24} hours'
          WHERE session_id = $1
          RETURNING *
        `, [sessionId, branchId, customerId, isGuest, JSON.stringify(cartData), JSON.stringify(dismissedBanners), JSON.stringify(modalShown)]);
        
        return result.rows[0];
      } else {
        // Create new session
        const result = await query(`
          INSERT INTO pwa_sessions (
            session_id, branch_id, customer_id, is_guest, cart_data, 
            dismissed_banners, modal_shown, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '${process.env.PWA_SESSION_EXPIRY_HOURS || 24} hours')
          RETURNING *
        `, [sessionId, branchId, customerId, isGuest, JSON.stringify(cartData), JSON.stringify(dismissedBanners), JSON.stringify(modalShown)]);
        
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Error creating/updating PWA session:', error);
      throw error;
    }
  }

  // Get PWA session
  static async getSession(sessionId) {
    try {
      const result = await query(`
        SELECT * FROM pwa_sessions 
        WHERE session_id = $1 AND expires_at > NOW()
      `, [sessionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const session = result.rows[0];
      
      // Parse JSON fields
      session.cart_data = session.cart_data ? JSON.parse(session.cart_data) : null;
      session.dismissed_banners = session.dismissed_banners ? JSON.parse(session.dismissed_banners) : null;
      session.modal_shown = session.modal_shown ? JSON.parse(session.modal_shown) : null;
      
      return session;
    } catch (error) {
      logger.error('Error fetching PWA session:', error);
      throw error;
    }
  }

  // Update session cart data
  static async updateCartData(sessionId, cartData) {
    try {
      const result = await query(`
        UPDATE pwa_sessions 
        SET cart_data = $2, updated_at = NOW()
        WHERE session_id = $1
        RETURNING *
      `, [sessionId, JSON.stringify(cartData)]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating session cart data:', error);
      throw error;
    }
  }

  // Update dismissed banners
  static async updateDismissedBanners(sessionId, dismissedBanners) {
    try {
      const result = await query(`
        UPDATE pwa_sessions 
        SET dismissed_banners = $2, updated_at = NOW()
        WHERE session_id = $1
        RETURNING *
      `, [sessionId, JSON.stringify(dismissedBanners)]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating dismissed banners:', error);
      throw error;
    }
  }

  // Update modal shown status
  static async updateModalShown(sessionId, modalShown) {
    try {
      const result = await query(`
        UPDATE pwa_sessions 
        SET modal_shown = $2, updated_at = NOW()
        WHERE session_id = $1
        RETURNING *
      `, [sessionId, JSON.stringify(modalShown)]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating modal shown status:', error);
      throw error;
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions() {
    try {
      const result = await query(`
        DELETE FROM pwa_sessions 
        WHERE expires_at <= NOW()
      `);
      
      logger.info(`Cleaned up ${result.rowCount} expired PWA sessions`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }
}

// PWA Analytics Service
class PWAAnalyticsService {
  // Track PWA event
  static async trackEvent(eventData) {
    try {
      const { sessionId, eventType, eventData: data, branchId, customerId } = eventData;
      
      const result = await query(`
        INSERT INTO pwa_analytics (
          session_id, event_type, event_data, branch_id, customer_id
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [sessionId, eventType, JSON.stringify(data), branchId, customerId]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error tracking PWA event:', error);
      throw error;
    }
  }

  // Get analytics data
  static async getAnalytics(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (filters.branchId) {
        params.push(filters.branchId);
        whereClause += ` AND branch_id = $${params.length}`;
      }
      
      if (filters.eventType) {
        params.push(filters.eventType);
        whereClause += ` AND event_type = $${params.length}`;
      }
      
      if (filters.startDate) {
        params.push(filters.startDate);
        whereClause += ` AND created_at >= $${params.length}`;
      }
      
      if (filters.endDate) {
        params.push(filters.endDate);
        whereClause += ` AND created_at <= $${params.length}`;
      }
      
      const result = await query(`
        SELECT 
          event_type,
          COUNT(*) as event_count,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT customer_id) as unique_customers,
          DATE(created_at) as event_date
        FROM pwa_analytics
        ${whereClause}
        GROUP BY event_type, DATE(created_at)
        ORDER BY event_date DESC, event_count DESC
      `, params);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  // Get popular products
  static async getPopularProducts(branchId, limit = 10) {
    try {
      const result = await query(`
        SELECT 
          (event_data->>'productId') as product_id,
          (event_data->>'productName') as product_name,
          COUNT(*) as view_count
        FROM pwa_analytics
        WHERE event_type = 'product_view' 
          AND branch_id = $1
          AND event_data->>'productId' IS NOT NULL
        GROUP BY event_data->>'productId', event_data->>'productName'
        ORDER BY view_count DESC
        LIMIT $2
      `, [branchId, limit]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching popular products:', error);
      throw error;
    }
  }

  // Get conversion funnel
  static async getConversionFunnel(branchId, startDate, endDate) {
    try {
      const result = await query(`
        WITH funnel_data AS (
          SELECT 
            session_id,
            MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_view,
            MAX(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END) as product_view,
            MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as add_to_cart,
            MAX(CASE WHEN event_type = 'checkout_start' THEN 1 ELSE 0 END) as checkout_start,
            MAX(CASE WHEN event_type = 'order_complete' THEN 1 ELSE 0 END) as order_complete
          FROM pwa_analytics
          WHERE branch_id = $1
            AND created_at >= $2
            AND created_at <= $3
          GROUP BY session_id
        )
        SELECT 
          COUNT(*) as total_sessions,
          SUM(page_view) as page_views,
          SUM(product_view) as product_views,
          SUM(add_to_cart) as add_to_carts,
          SUM(checkout_start) as checkout_starts,
          SUM(order_complete) as order_completes
        FROM funnel_data
      `, [branchId, startDate, endDate]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching conversion funnel:', error);
      throw error;
    }
  }
}

// PWA Cache Service
class PWACacheService {
  // Cache product catalog for branch
  static async cacheProductCatalog(branchId, categoryId, products) {
    try {
      const cacheKey = `product_catalog:${branchId}:${categoryId || 'all'}`;
      await cache.set(cacheKey, products, 1800); // Cache for 30 minutes
      logger.debug(`Cached product catalog for branch ${branchId}, category ${categoryId}`);
    } catch (error) {
      logger.error('Error caching product catalog:', error);
    }
  }

  // Get cached product catalog
  static async getCachedProductCatalog(branchId, categoryId) {
    try {
      const cacheKey = `product_catalog:${branchId}:${categoryId || 'all'}`;
      return await cache.get(cacheKey);
    } catch (error) {
      logger.error('Error getting cached product catalog:', error);
      return null;
    }
  }

  // Cache branch data
  static async cacheBranchData(branchId, branchData) {
    try {
      const cacheKey = `branch:${branchId}`;
      await cache.set(cacheKey, branchData, 3600); // Cache for 1 hour
      logger.debug(`Cached branch data for ${branchId}`);
    } catch (error) {
      logger.error('Error caching branch data:', error);
    }
  }

  // Get cached branch data
  static async getCachedBranchData(branchId) {
    try {
      const cacheKey = `branch:${branchId}`;
      return await cache.get(cacheKey);
    } catch (error) {
      logger.error('Error getting cached branch data:', error);
      return null;
    }
  }

  // Clear PWA cache
  static async clearPWACache() {
    try {
      await cache.delPattern('product_catalog:*');
      await cache.delPattern('branch:*');
      await cache.delPattern('products:*');
      await cache.delPattern('categories:*');
      logger.info('PWA cache cleared');
    } catch (error) {
      logger.error('Error clearing PWA cache:', error);
    }
  }
}

// PWA Notification Service
class PWANotificationService {
  // Create notification
  static async createNotification(notificationData) {
    try {
      const { customerId, title, body, type, data } = notificationData;
      
      const result = await query(`
        INSERT INTO notifications (
          customer_id, title, body, type, data
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [customerId, title, body, type, JSON.stringify(data)]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for customer
  static async getNotifications(customerId, limit = 20) {
    try {
      const result = await query(`
        SELECT * FROM notifications
        WHERE customer_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [customerId, limit]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const result = await query(`
        UPDATE notifications 
        SET read_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [notificationId]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Send push notification
  static async sendPushNotification(notificationData) {
    try {
      // This would integrate with a push notification service
      // For now, we'll just log the notification
      logger.info('Push notification sent:', notificationData);
      
      // In a real implementation, you would:
      // 1. Get push subscription from database
      // 2. Send notification using web-push library
      // 3. Update notification status
      
      return { success: true };
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }
}

module.exports = {
  PWASessionService,
  PWAAnalyticsService,
  PWACacheService,
  PWANotificationService
};




















