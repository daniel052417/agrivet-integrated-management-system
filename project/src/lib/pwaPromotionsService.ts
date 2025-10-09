import { supabase } from './supabase';
import { Promotion } from './promotionsService';

/**
 * PWA Promotions Service
 * Handles promotion integration with the Progressive Web App
 */
export class PWAPromotionsService {
  /**
   * Get active promotions for PWA display
   * Only returns promotions that are:
   * - Active (status = 'active')
   * - Visible on PWA (show_on_pwa = true)
   * - Not expired (end_date >= current_date)
   */
  static async getActivePromotions(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_active_promotions_for_pwa');

      if (error) {
        console.error('Error fetching active promotions for PWA:', error);
        throw new Error(`Failed to fetch active promotions: ${error.message}`);
      }

      // Parse JSON fields and format for PWA display
      return data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];
    } catch (error) {
      console.error('Error in getActivePromotions:', error);
      throw error;
    }
  }

  /**
   * Get promotion by ID for PWA (with additional PWA-specific formatting)
   */
  static async getPromotionForPWA(id: string): Promise<Promotion | null> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .eq('show_on_pwa', true)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching promotion for PWA:', error);
        throw new Error(`Failed to fetch promotion: ${error.message}`);
      }

      // Parse JSON fields
      return {
        ...data,
        products: typeof data.products === 'string' ? JSON.parse(data.products) : data.products,
        categories: typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories,
      };
    } catch (error) {
      console.error('Error in getPromotionForPWA:', error);
      throw error;
    }
  }

  /**
   * Check if a product is included in any active promotion
   */
  static async isProductOnPromotion(productId: string): Promise<{
    isOnPromotion: boolean;
    promotions: Promotion[];
  }> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('show_on_pwa', true)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .contains('products', [productId]);

      if (error) {
        console.error('Error checking product promotions:', error);
        throw new Error(`Failed to check product promotions: ${error.message}`);
      }

      const promotions = data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];

      return {
        isOnPromotion: promotions.length > 0,
        promotions
      };
    } catch (error) {
      console.error('Error in isProductOnPromotion:', error);
      throw error;
    }
  }

  /**
   * Check if a category has any active promotions
   */
  static async isCategoryOnPromotion(categoryName: string): Promise<{
    isOnPromotion: boolean;
    promotions: Promotion[];
  }> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('show_on_pwa', true)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .contains('categories', [categoryName]);

      if (error) {
        console.error('Error checking category promotions:', error);
        throw new Error(`Failed to check category promotions: ${error.message}`);
      }

      const promotions = data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];

      return {
        isOnPromotion: promotions.length > 0,
        promotions
      };
    } catch (error) {
      console.error('Error in isCategoryOnPromotion:', error);
      throw error;
    }
  }

  /**
   * Calculate discount for a product based on active promotions
   */
  static async calculateProductDiscount(productId: string, originalPrice: number): Promise<{
    hasDiscount: boolean;
    discountAmount: number;
    finalPrice: number;
    promotion: Promotion | null;
  }> {
    try {
      const { isOnPromotion, promotions } = await this.isProductOnPromotion(productId);

      if (!isOnPromotion || promotions.length === 0) {
        return {
          hasDiscount: false,
          discountAmount: 0,
          finalPrice: originalPrice,
          promotion: null
        };
      }

      // Use the first promotion (could be enhanced to use the best discount)
      const promotion = promotions[0];
      let discountAmount = 0;

      if (promotion.discount_type === 'percent') {
        discountAmount = (originalPrice * promotion.discount_value) / 100;
      } else if (promotion.discount_type === 'flat') {
        discountAmount = promotion.discount_value;
      }

      const finalPrice = Math.max(0, originalPrice - discountAmount);

      return {
        hasDiscount: true,
        discountAmount,
        finalPrice,
        promotion
      };
    } catch (error) {
      console.error('Error in calculateProductDiscount:', error);
      throw error;
    }
  }

  /**
   * Get promotion banner data for PWA homepage
   */
  static async getPromotionBanners(): Promise<{
    banners: Array<{
      id: string;
      title: string;
      description: string;
      discountText: string;
      validUntil: string;
      imageUrl?: string;
      linkUrl?: string;
    }>;
  }> {
    try {
      const promotions = await this.getActivePromotions();

      const banners = promotions.map(promo => {
        const discountText = promo.discount_type === 'percent' 
          ? `${promo.discount_value}% OFF`
          : `₱${promo.discount_value} OFF`;

        return {
          id: promo.id,
          title: promo.title,
          description: promo.description,
          discountText,
          validUntil: promo.end_date,
          imageUrl: undefined, // Could be added to promotions table
          linkUrl: `/promotions/${promo.id}`
        };
      });

      return { banners };
    } catch (error) {
      console.error('Error in getPromotionBanners:', error);
      throw error;
    }
  }

  /**
   * Track promotion view for analytics
   */
  static async trackPromotionView(promotionId: string, userId?: string): Promise<void> {
    try {
      // This could be enhanced to track views in a separate analytics table
      console.log(`Promotion view tracked: ${promotionId} by user: ${userId || 'anonymous'}`);
      
      // Future enhancement: Store in analytics table
      // await supabase.from('promotion_views').insert({
      //   promotion_id: promotionId,
      //   user_id: userId,
      //   viewed_at: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Error in trackPromotionView:', error);
      // Don't throw error for analytics tracking
    }
  }

  /**
   * Get promotion count for PWA header badge
   */
  static async getActivePromotionCount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('id', { count: 'exact' })
        .eq('show_on_pwa', true)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching promotion count:', error);
        throw new Error(`Failed to fetch promotion count: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in getActivePromotionCount:', error);
      throw error;
    }
  }
}

export default PWAPromotionsService;
