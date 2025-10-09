import { supabase } from './supabase';
import { Promotion } from './promotionsService';

export interface PromotionUsage {
  promotionId: string;
  orderId: string;
  customerId?: string;
  discountAmount: number;
  usedAt: string;
}

export interface SalesPromotionData {
  promotion: Promotion;
  discountAmount: number;
  finalPrice: number;
  isValid: boolean;
  reason?: string;
}

/**
 * Sales Promotions Service
 * Handles promotion integration with the Sales/POS module
 */
export class SalesPromotionsService {
  /**
   * Apply promotion to a cart item or order
   */
  static async applyPromotion(
    promotionId: string, 
    originalPrice: number, 
    quantity: number = 1
  ): Promise<SalesPromotionData> {
    try {
      // Get promotion details
      const { data: promotion, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error || !promotion) {
        return {
          promotion: null,
          discountAmount: 0,
          finalPrice: originalPrice,
          isValid: false,
          reason: 'Promotion not found'
        };
      }

      // Parse JSON fields
      const parsedPromotion = {
        ...promotion,
        products: typeof promotion.products === 'string' ? JSON.parse(promotion.products) : promotion.products,
        categories: typeof promotion.categories === 'string' ? JSON.parse(promotion.categories) : promotion.categories,
      };

      // Validate promotion status
      if (parsedPromotion.status !== 'active') {
        return {
          promotion: parsedPromotion,
          discountAmount: 0,
          finalPrice: originalPrice,
          isValid: false,
          reason: 'Promotion is not active'
        };
      }

      // Validate date range
      const now = new Date();
      const startDate = new Date(parsedPromotion.start_date);
      const endDate = new Date(parsedPromotion.end_date);

      if (now < startDate) {
        return {
          promotion: parsedPromotion,
          discountAmount: 0,
          finalPrice: originalPrice,
          isValid: false,
          reason: 'Promotion has not started yet'
        };
      }

      if (now > endDate) {
        return {
          promotion: parsedPromotion,
          discountAmount: 0,
          finalPrice: originalPrice,
          isValid: false,
          reason: 'Promotion has expired'
        };
      }

      // Check usage limits
      if (parsedPromotion.max_uses && parsedPromotion.total_uses >= parsedPromotion.max_uses) {
        return {
          promotion: parsedPromotion,
          discountAmount: 0,
          finalPrice: originalPrice,
          isValid: false,
          reason: 'Promotion usage limit reached'
        };
      }

      // Calculate discount
      const totalPrice = originalPrice * quantity;
      let discountAmount = 0;

      if (parsedPromotion.discount_type === 'percent') {
        discountAmount = (totalPrice * parsedPromotion.discount_value) / 100;
      } else if (parsedPromotion.discount_type === 'flat') {
        discountAmount = parsedPromotion.discount_value;
      }

      const finalPrice = Math.max(0, totalPrice - discountAmount);

      return {
        promotion: parsedPromotion,
        discountAmount,
        finalPrice,
        isValid: true
      };
    } catch (error) {
      console.error('Error in applyPromotion:', error);
      throw error;
    }
  }

  /**
   * Record promotion usage in sales transaction
   */
  static async recordPromotionUsage(
    promotionId: string,
    orderId: string,
    customerId: string | null,
    discountAmount: number,
    quantity: number = 1
  ): Promise<void> {
    try {
      // Update promotion usage count
      const { error: updateError } = await supabase
        .from('promotions')
        .update({ 
          total_uses: supabase.raw('total_uses + ?', [quantity]),
          updated_at: new Date().toISOString()
        })
        .eq('id', promotionId);

      if (updateError) {
        console.error('Error updating promotion usage:', updateError);
        throw new Error(`Failed to update promotion usage: ${updateError.message}`);
      }

      // Record usage in sales_promotion_usage table (if it exists)
      // This would track individual usage instances for analytics
      const usageData = {
        promotion_id: promotionId,
        order_id: orderId,
        customer_id: customerId,
        discount_amount: discountAmount,
        quantity: quantity,
        used_at: new Date().toISOString()
      };

      // Future enhancement: Store detailed usage records
      console.log('Promotion usage recorded:', usageData);
      
      // await supabase.from('sales_promotion_usage').insert([usageData]);
    } catch (error) {
      console.error('Error in recordPromotionUsage:', error);
      throw error;
    }
  }

  /**
   * Get available promotions for a specific product
   */
  static async getProductPromotions(productId: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .contains('products', [productId]);

      if (error) {
        console.error('Error fetching product promotions:', error);
        throw new Error(`Failed to fetch product promotions: ${error.message}`);
      }

      return data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];
    } catch (error) {
      console.error('Error in getProductPromotions:', error);
      throw error;
    }
  }

  /**
   * Get available promotions for a specific category
   */
  static async getCategoryPromotions(categoryName: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .contains('categories', [categoryName]);

      if (error) {
        console.error('Error fetching category promotions:', error);
        throw new Error(`Failed to fetch category promotions: ${error.message}`);
      }

      return data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];
    } catch (error) {
      console.error('Error in getCategoryPromotions:', error);
      throw error;
    }
  }

  /**
   * Validate promotion code (for future coupon system)
   */
  static async validatePromotionCode(code: string): Promise<{
    isValid: boolean;
    promotion: Promotion | null;
    reason?: string;
  }> {
    try {
      // Future enhancement: Add promotion codes table
      // For now, we'll use promotion ID as code
      const { data: promotion, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', code)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .single();

      if (error || !promotion) {
        return {
          isValid: false,
          promotion: null,
          reason: 'Invalid or expired promotion code'
        };
      }

      // Parse JSON fields
      const parsedPromotion = {
        ...promotion,
        products: typeof promotion.products === 'string' ? JSON.parse(promotion.products) : promotion.products,
        categories: typeof promotion.categories === 'string' ? JSON.parse(promotion.categories) : promotion.categories,
      };

      // Check usage limits
      if (parsedPromotion.max_uses && parsedPromotion.total_uses >= parsedPromotion.max_uses) {
        return {
          isValid: false,
          promotion: parsedPromotion,
          reason: 'Promotion usage limit reached'
        };
      }

      return {
        isValid: true,
        promotion: parsedPromotion
      };
    } catch (error) {
      console.error('Error in validatePromotionCode:', error);
      throw error;
    }
  }

  /**
   * Get promotion analytics for sales reporting
   */
  static async getPromotionAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalPromotions: number;
    activePromotions: number;
    totalDiscountGiven: number;
    totalUsage: number;
    topPromotions: Array<{
      promotion: Promotion;
      usageCount: number;
      totalDiscount: number;
    }>;
  }> {
    try {
      // Get promotion statistics
      const { data: stats, error: statsError } = await supabase
        .rpc('get_promotion_stats');

      if (statsError) {
        console.error('Error fetching promotion stats:', statsError);
        throw new Error(`Failed to fetch promotion statistics: ${statsError.message}`);
      }

      // Get detailed promotion data
      let query = supabase
        .from('promotions')
        .select('*')
        .order('total_uses', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: promotions, error: promotionsError } = await query;

      if (promotionsError) {
        console.error('Error fetching promotions for analytics:', promotionsError);
        throw new Error(`Failed to fetch promotions: ${promotionsError.message}`);
      }

      const parsedPromotions = promotions?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];

      // Calculate total discount given (simplified calculation)
      const totalDiscountGiven = parsedPromotions.reduce((sum, promo) => {
        return sum + (promo.total_uses * (promo.discount_value || 0));
      }, 0);

      // Get top promotions by usage
      const topPromotions = parsedPromotions
        .filter(promo => promo.total_uses > 0)
        .slice(0, 5)
        .map(promo => ({
          promotion: promo,
          usageCount: promo.total_uses,
          totalDiscount: promo.total_uses * (promo.discount_value || 0)
        }));

      return {
        totalPromotions: stats?.[0]?.total_promotions || 0,
        activePromotions: stats?.[0]?.active_promotions || 0,
        totalDiscountGiven,
        totalUsage: stats?.[0]?.total_uses || 0,
        topPromotions
      };
    } catch (error) {
      console.error('Error in getPromotionAnalytics:', error);
      throw error;
    }
  }

  /**
   * Check if a customer is eligible for a promotion
   */
  static async checkCustomerEligibility(
    customerId: string,
    promotionId: string
  ): Promise<{
    isEligible: boolean;
    reason?: string;
  }> {
    try {
      // Get promotion details
      const { data: promotion, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error || !promotion) {
        return {
          isEligible: false,
          reason: 'Promotion not found'
        };
      }

      // Future enhancement: Add customer-specific promotion rules
      // For now, all customers are eligible if promotion is active
      if (promotion.status !== 'active') {
        return {
          isEligible: false,
          reason: 'Promotion is not active'
        };
      }

      // Check date range
      const now = new Date();
      const startDate = new Date(promotion.start_date);
      const endDate = new Date(promotion.end_date);

      if (now < startDate || now > endDate) {
        return {
          isEligible: false,
          reason: 'Promotion is not valid for current date'
        };
      }

      return {
        isEligible: true
      };
    } catch (error) {
      console.error('Error in checkCustomerEligibility:', error);
      throw error;
    }
  }
}

export default SalesPromotionsService;
