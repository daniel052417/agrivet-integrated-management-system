const { query } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

class Promotion {
  constructor(data) {
    this.id = data.id;
    this.campaign_id = data.campaign_id;
    this.name = data.name;
    this.code = data.code;
    this.type = data.type;
    this.discount_value = data.discount_value;
    this.minimum_amount = data.minimum_amount;
    this.maximum_discount = data.maximum_discount;
    this.usage_limit = data.usage_limit;
    this.usage_count = data.usage_count;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.is_active = data.is_active;
    this.applies_to = data.applies_to;
    this.created_at = data.created_at;
  }
}

// Promotion Service
class PromotionService {
  // Get active promotions for PWA
  static async getActivePromotions(branchId = null) {
    try {
      const cacheKey = `promotions:active:${branchId || 'all'}`;
      let promotions = await cache.get(cacheKey);
      
      if (!promotions) {
        let whereClause = 'WHERE p.is_active = true AND p.start_date <= NOW() AND p.end_date >= NOW()';
        const params = [];
        
        if (branchId) {
          params.push(branchId);
          whereClause += ` AND (pb.branch_id = $${params.length} OR pb.branch_id IS NULL)`;
        }
        
        const result = await query(`
          SELECT DISTINCT
            p.*,
            pb.branch_id
          FROM promotions p
          LEFT JOIN promotion_branches pb ON p.id = pb.promotion_id
          ${whereClause}
          ORDER BY p.created_at DESC
        `, params);
        
        promotions = result.rows.map(row => new Promotion(row));
        await cache.set(cacheKey, promotions, 1800); // Cache for 30 minutes
      }
      
      return promotions;
    } catch (error) {
      logger.error('Error fetching active promotions:', error);
      throw error;
    }
  }

  // Get banner promotions for PWA
  static async getBannerPromotions(branchId = null) {
    try {
      const promotions = await this.getActivePromotions(branchId);
      
      // Filter promotions that should be shown as banners
      return promotions.filter(promotion => {
        // This would be based on display_settings in a real implementation
        // For now, we'll use a simple filter
        return promotion.type === 'percentage' || promotion.type === 'fixed';
      });
    } catch (error) {
      logger.error('Error fetching banner promotions:', error);
      throw error;
    }
  }

  // Get modal promotions for PWA
  static async getModalPromotions(branchId = null) {
    try {
      const promotions = await this.getActivePromotions(branchId);
      
      // Filter promotions that should be shown as modals
      return promotions.filter(promotion => {
        // This would be based on display_settings in a real implementation
        // For now, we'll use a simple filter
        return promotion.type === 'bogo' || promotion.discount_value >= 20;
      });
    } catch (error) {
      logger.error('Error fetching modal promotions:', error);
      throw error;
    }
  }

  // Get promotion by ID
  static async getById(promotionId) {
    try {
      const result = await query(`
        SELECT * FROM promotions 
        WHERE id = $1 AND is_active = true
      `, [promotionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Promotion(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching promotion by ID:', error);
      throw error;
    }
  }

  // Get promotion by code
  static async getByCode(code) {
    try {
      const result = await query(`
        SELECT * FROM promotions 
        WHERE code = $1 AND is_active = true 
          AND start_date <= NOW() AND end_date >= NOW()
      `, [code]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Promotion(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching promotion by code:', error);
      throw error;
    }
  }

  // Check if promotion is valid for order
  static async validatePromotion(promotionId, orderData) {
    try {
      const promotion = await this.getById(promotionId);
      
      if (!promotion) {
        return { valid: false, message: 'Promotion not found' };
      }
      
      // Check if promotion is still active
      const now = new Date();
      if (now < new Date(promotion.start_date) || now > new Date(promotion.end_date)) {
        return { valid: false, message: 'Promotion has expired' };
      }
      
      // Check usage limit
      if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
        return { valid: false, message: 'Promotion usage limit reached' };
      }
      
      // Check minimum amount
      if (promotion.minimum_amount && orderData.subtotal < promotion.minimum_amount) {
        return { 
          valid: false, 
          message: `Minimum order amount of ₱${promotion.minimum_amount} required` 
        };
      }
      
      // Check if customer has already used this promotion
      if (orderData.customer_id) {
        const usageResult = await query(`
          SELECT COUNT(*) as usage_count
          FROM promotion_usage
          WHERE promotion_id = $1 AND customer_id = $2
        `, [promotionId, orderData.customer_id]);
        
        if (parseInt(usageResult.rows[0].usage_count) > 0) {
          return { valid: false, message: 'Promotion already used by this customer' };
        }
      }
      
      return { valid: true, promotion };
    } catch (error) {
      logger.error('Error validating promotion:', error);
      return { valid: false, message: 'Error validating promotion' };
    }
  }

  // Apply promotion to order
  static async applyPromotion(promotionId, orderData) {
    try {
      const validation = await this.validatePromotion(promotionId, orderData);
      
      if (!validation.valid) {
        return validation;
      }
      
      const promotion = validation.promotion;
      let discountAmount = 0;
      
      // Calculate discount based on promotion type
      switch (promotion.type) {
        case 'percentage':
          discountAmount = (orderData.subtotal * promotion.discount_value) / 100;
          if (promotion.maximum_discount && discountAmount > promotion.maximum_discount) {
            discountAmount = promotion.maximum_discount;
          }
          break;
          
        case 'fixed':
          discountAmount = promotion.discount_value;
          break;
          
        case 'bogo':
          // Buy One Get One logic would be implemented here
          // For now, we'll apply a 50% discount on the cheapest item
          discountAmount = orderData.subtotal * 0.5;
          break;
          
        default:
          return { valid: false, message: 'Invalid promotion type' };
      }
      
      // Ensure discount doesn't exceed order total
      discountAmount = Math.min(discountAmount, orderData.subtotal);
      
      return {
        valid: true,
        promotion,
        discountAmount: Math.round(discountAmount * 100) / 100
      };
    } catch (error) {
      logger.error('Error applying promotion:', error);
      return { valid: false, message: 'Error applying promotion' };
    }
  }

  // Record promotion usage
  static async recordUsage(promotionId, customerId, orderId) {
    try {
      const result = await query(`
        INSERT INTO promotion_usage (promotion_id, customer_id, order_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [promotionId, customerId, orderId]);
      
      // Update usage count
      await query(`
        UPDATE promotions 
        SET usage_count = usage_count + 1
        WHERE id = $1
      `, [promotionId]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording promotion usage:', error);
      throw error;
    }
  }

  // Get promotion products/categories
  static async getPromotionTargets(promotionId) {
    try {
      const result = await query(`
        SELECT 
          pp.product_id,
          pp.category_id,
          p.name as product_name,
          c.name as category_name
        FROM promotion_products pp
        LEFT JOIN products p ON pp.product_id = p.id
        LEFT JOIN categories c ON pp.category_id = c.id
        WHERE pp.promotion_id = $1
      `, [promotionId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching promotion targets:', error);
      throw error;
    }
  }

  // Get promotion branches
  static async getPromotionBranches(promotionId) {
    try {
      const result = await query(`
        SELECT 
          pb.branch_id,
          b.name as branch_name
        FROM promotion_branches pb
        JOIN branches b ON pb.branch_id = b.id
        WHERE pb.promotion_id = $1
      `, [promotionId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching promotion branches:', error);
      throw error;
    }
  }

  // Create promotion
  static async create(promotionData) {
    try {
      const result = await query(`
        INSERT INTO promotions (
          campaign_id, name, code, type, discount_value, minimum_amount,
          maximum_discount, usage_limit, start_date, end_date, applies_to
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        promotionData.campaign_id,
        promotionData.name,
        promotionData.code,
        promotionData.type,
        promotionData.discount_value,
        promotionData.minimum_amount,
        promotionData.maximum_discount,
        promotionData.usage_limit,
        promotionData.start_date,
        promotionData.end_date,
        promotionData.applies_to || 'all'
      ]);
      
      const promotion = new Promotion(result.rows[0]);
      await this.clearCache();
      
      return promotion;
    } catch (error) {
      logger.error('Error creating promotion:', error);
      throw error;
    }
  }

  // Update promotion
  static async update(promotionId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(promotionId);
      
      const result = await query(`
        UPDATE promotions 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const promotion = new Promotion(result.rows[0]);
      await this.clearCache();
      
      return promotion;
    } catch (error) {
      logger.error('Error updating promotion:', error);
      throw error;
    }
  }

  // Delete promotion (soft delete)
  static async delete(promotionId) {
    try {
      const result = await query(`
        UPDATE promotions 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [promotionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      await this.clearCache();
      return new Promotion(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting promotion:', error);
      throw error;
    }
  }

  // Clear promotion cache
  static async clearCache() {
    try {
      await cache.delPattern('promotions:*');
      logger.info('Promotion cache cleared');
    } catch (error) {
      logger.error('Error clearing promotion cache:', error);
    }
  }
}

module.exports = {
  Promotion,
  PromotionService
};
















