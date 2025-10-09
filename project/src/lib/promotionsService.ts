import { supabase } from './supabase';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  products: string[];
  categories: string[];
  show_on_pwa: boolean;
  show_on_facebook: boolean;
  status: 'active' | 'upcoming' | 'expired';
  max_uses?: number;
  total_uses: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionStats {
  total_promotions: number;
  active_promotions: number;
  upcoming_promotions: number;
  expired_promotions: number;
  total_uses: number;
}

export interface CreatePromotionData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  products?: string[];
  categories?: string[];
  show_on_pwa?: boolean;
  show_on_facebook?: boolean;
  max_uses?: number;
  created_by?: string;
}

export interface UpdatePromotionData extends Partial<CreatePromotionData> {}

export interface PromotionFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class PromotionsService {
  /**
   * Get all promotions with optional filtering and pagination
   */
  static async getPromotions(filters: PromotionFilters = {}): Promise<{
    data: Promotion[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { status, search, page = 1, limit = 10 } = filters;
      
      let query = supabase
        .from('promotions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching promotions:', error);
        throw new Error(`Failed to fetch promotions: ${error.message}`);
      }

      // Parse JSON fields
      const promotions = data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];

      return {
        data: promotions,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getPromotions:', error);
      throw error;
    }
  }

  /**
   * Get a specific promotion by ID
   */
  static async getPromotion(id: string): Promise<Promotion> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching promotion:', error);
        throw new Error(`Failed to fetch promotion: ${error.message}`);
      }

      if (!data) {
        throw new Error('Promotion not found');
      }

      // Parse JSON fields
      return {
        ...data,
        products: typeof data.products === 'string' ? JSON.parse(data.products) : data.products,
        categories: typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories,
      };
    } catch (error) {
      console.error('Error in getPromotion:', error);
      throw error;
    }
  }

  /**
   * Create a new promotion
   */
  static async createPromotion(promotionData: CreatePromotionData): Promise<Promotion> {
    try {
      const {
        title,
        description,
        start_date,
        end_date,
        discount_type,
        discount_value,
        products = [],
        categories = [],
        show_on_pwa = true,
        show_on_facebook = false,
        max_uses,
        created_by
      } = promotionData;

      // Validate required fields
      if (!title || !description || !start_date || !end_date || !discount_type || !discount_value) {
        throw new Error('Missing required fields: title, description, start_date, end_date, discount_type, discount_value');
      }

      // Validate discount type
      if (!['flat', 'percent'].includes(discount_type)) {
        throw new Error('Invalid discount_type. Must be "flat" or "percent"');
      }

      // Validate discount value
      if (discount_value <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      // Validate date range
      if (new Date(start_date) >= new Date(end_date)) {
        throw new Error('End date must be after start date');
      }

      // Validate max_uses
      if (max_uses !== undefined && max_uses !== null && max_uses <= 0) {
        throw new Error('Max uses must be greater than 0 or null');
      }

      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          title,
          description,
          start_date,
          end_date,
          discount_type,
          discount_value: parseFloat(discount_value.toString()),
          products: JSON.stringify(products),
          categories: JSON.stringify(categories),
          show_on_pwa,
          show_on_facebook,
          max_uses: max_uses ? parseInt(max_uses.toString()) : null,
          total_uses: 0,
          created_by
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating promotion:', error);
        throw new Error(`Failed to create promotion: ${error.message}`);
      }

      // Parse JSON fields
      return {
        ...data,
        products: typeof data.products === 'string' ? JSON.parse(data.products) : data.products,
        categories: typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories,
      };
    } catch (error) {
      console.error('Error in createPromotion:', error);
      throw error;
    }
  }

  /**
   * Update an existing promotion
   */
  static async updatePromotion(id: string, updateData: UpdatePromotionData): Promise<Promotion> {
    try {
      const updateFields: any = {};

      // Only include fields that are provided
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.start_date !== undefined) updateFields.start_date = updateData.start_date;
      if (updateData.end_date !== undefined) updateFields.end_date = updateData.end_date;
      if (updateData.discount_type !== undefined) updateFields.discount_type = updateData.discount_type;
      if (updateData.discount_value !== undefined) updateFields.discount_value = parseFloat(updateData.discount_value.toString());
      if (updateData.products !== undefined) updateFields.products = JSON.stringify(updateData.products);
      if (updateData.categories !== undefined) updateFields.categories = JSON.stringify(updateData.categories);
      if (updateData.show_on_pwa !== undefined) updateFields.show_on_pwa = updateData.show_on_pwa;
      if (updateData.show_on_facebook !== undefined) updateFields.show_on_facebook = updateData.show_on_facebook;
      if (updateData.max_uses !== undefined) updateFields.max_uses = updateData.max_uses ? parseInt(updateData.max_uses.toString()) : null;

      // Validate discount type if provided
      if (updateData.discount_type && !['flat', 'percent'].includes(updateData.discount_type)) {
        throw new Error('Invalid discount_type. Must be "flat" or "percent"');
      }

      // Validate discount value if provided
      if (updateData.discount_value !== undefined && updateData.discount_value <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      // Validate date range if both dates provided
      if (updateData.start_date && updateData.end_date && new Date(updateData.start_date) >= new Date(updateData.end_date)) {
        throw new Error('End date must be after start date');
      }

      // Validate max_uses if provided
      if (updateData.max_uses !== undefined && updateData.max_uses !== null && updateData.max_uses <= 0) {
        throw new Error('Max uses must be greater than 0 or null');
      }

      const { data, error } = await supabase
        .from('promotions')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating promotion:', error);
        throw new Error(`Failed to update promotion: ${error.message}`);
      }

      if (!data) {
        throw new Error('Promotion not found');
      }

      // Parse JSON fields
      return {
        ...data,
        products: typeof data.products === 'string' ? JSON.parse(data.products) : data.products,
        categories: typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories,
      };
    } catch (error) {
      console.error('Error in updatePromotion:', error);
      throw error;
    }
  }

  /**
   * Delete a promotion
   */
  static async deletePromotion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting promotion:', error);
        throw new Error(`Failed to delete promotion: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deletePromotion:', error);
      throw error;
    }
  }

  /**
   * Get promotion statistics
   */
  static async getPromotionStats(): Promise<PromotionStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_promotion_stats');

      if (error) {
        console.error('Error fetching promotion stats:', error);
        throw new Error(`Failed to fetch promotion statistics: ${error.message}`);
      }

      return data?.[0] || {
        total_promotions: 0,
        active_promotions: 0,
        upcoming_promotions: 0,
        expired_promotions: 0,
        total_uses: 0
      };
    } catch (error) {
      console.error('Error in getPromotionStats:', error);
      throw error;
    }
  }

  /**
   * Get active promotions for PWA
   */
  static async getActivePromotionsForPWA(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_active_promotions_for_pwa');

      if (error) {
        console.error('Error fetching active promotions for PWA:', error);
        throw new Error(`Failed to fetch active promotions: ${error.message}`);
      }

      // Parse JSON fields
      return data?.map(promo => ({
        ...promo,
        products: typeof promo.products === 'string' ? JSON.parse(promo.products) : promo.products,
        categories: typeof promo.categories === 'string' ? JSON.parse(promo.categories) : promo.categories,
      })) || [];
    } catch (error) {
      console.error('Error in getActivePromotionsForPWA:', error);
      throw error;
    }
  }

  /**
   * Increment promotion usage count
   */
  static async usePromotion(id: string, quantity: number = 1): Promise<Promotion> {
    try {
      // Get current promotion
      const { data: promotion, error: fetchError } = await supabase
        .from('promotions')
        .select('total_uses, max_uses')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching promotion:', fetchError);
        throw new Error(`Failed to fetch promotion: ${fetchError.message}`);
      }

      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Check if promotion has reached max uses
      if (promotion.max_uses && (promotion.total_uses + quantity) > promotion.max_uses) {
        throw new Error('Promotion has reached maximum usage limit');
      }

      // Update usage count
      const { data: updatedPromotion, error: updateError } = await supabase
        .from('promotions')
        .update({ 
          total_uses: promotion.total_uses + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating promotion usage:', updateError);
        throw new Error(`Failed to update promotion usage: ${updateError.message}`);
      }

      // Parse JSON fields
      return {
        ...updatedPromotion,
        products: typeof updatedPromotion.products === 'string' ? JSON.parse(updatedPromotion.products) : updatedPromotion.products,
        categories: typeof updatedPromotion.categories === 'string' ? JSON.parse(updatedPromotion.categories) : updatedPromotion.categories,
      };
    } catch (error) {
      console.error('Error in usePromotion:', error);
      throw error;
    }
  }

  /**
   * Update expired promotions (for scheduled job)
   */
  static async updateExpiredPromotions(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('update_expired_promotions');

      if (error) {
        console.error('Error updating expired promotions:', error);
        throw new Error(`Failed to update expired promotions: ${error.message}`);
      }

      return data || 0;
    } catch (error) {
      console.error('Error in updateExpiredPromotions:', error);
      throw error;
    }
  }
}

export default PromotionsService;
