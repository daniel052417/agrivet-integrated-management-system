import { supabase } from './supabase';

// Type definitions matching the component and database schema
export interface PromotionBranchRow {
  promotion_id?: string;
  branch_id: string;
  branch?: {
    id: string;
    name: string;
  };
}

export interface PromotionImageRow {
  id: string;
  promotion_id?: string;
  image_url: string;
  storage_path?: string | null;
  display_order: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  promotion_type: 'new_item' | 'restock' | 'event';
  status: 'draft' | 'active' | 'upcoming' | 'expired' | 'archived';
  start_date: string;
  end_date: string;
  show_on_pwa: boolean;
  show_on_landing_page?: boolean;
  pin_to_top?: boolean;
  auto_end?: boolean;
  slideshow_autoplay?: boolean;
  slideshow_speed?: number;
  share_to_facebook: boolean;
  total_views: number;
  total_clicks: number;
  layout_style?: string;
  text_alignment?: string;
  font_family?: string;
  font_size?: string;
  text_color?: string;
  button_text?: string;
  button_link?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  promotion_branches?: PromotionBranchRow[];
  promotion_images?: PromotionImageRow[];
}

export interface CreatePromotionData {
  title: string;
  description: string;
  promotion_type: 'new_item' | 'restock' | 'event';
  start_date: string;
  end_date: string;
  show_on_pwa: boolean;
  show_on_landing_page?: boolean;
  pin_to_top?: boolean;
  auto_end?: boolean;
  slideshow_autoplay?: boolean;
  slideshow_speed?: number;
  share_to_facebook: boolean;
  layout_style?: string;
  text_alignment?: string;
  font_family?: string;
  font_size?: string;
  text_color?: string;
  button_text?: string;
  button_link?: string;
  branches?: string[];
  image_urls?: string[];
}

export interface UpdatePromotionData extends Partial<CreatePromotionData> {
  id: string;
}

export interface PromotionFilters {
  status?: string;
  promotion_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class PromotionsManagementService {
  /**
   * Get all promotions with optional filtering
   */
  static async getPromotions(filters: PromotionFilters = {}): Promise<{ data: Promotion[]; error: any }> {
    try {
      let query = supabase
        .from('promotions')
        .select(`
          *,
          promotion_branches:promotion_branches(
            promotion_id,
            branch_id,
            branch:branches(id, name)
          ),
          promotion_images:promotion_images(
            id,
            promotion_id,
            image_url,
            storage_path,
            display_order
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.promotion_type) {
        query = query.eq('promotion_type', filters.promotion_type);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      const promotions: Promotion[] = (data ?? []) as Promotion[];

      return { data: promotions, error };
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return { data: [], error };
    }
  }

  /**
   * Get a single promotion by ID
   */
  static async getPromotion(id: string): Promise<{ data: Promotion | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          promotion_branches:promotion_branches(
            promotion_id,
            branch_id,
            branch:branches(id, name)
          ),
          promotion_images:promotion_images(
            id,
            promotion_id,
            image_url,
            storage_path,
            display_order
          )
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching promotion:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new promotion
   */
  static async createPromotion(promotionData: CreatePromotionData): Promise<{ data: Promotion | null; error: any }> {
    try {
      // Get current user ID for created_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const {
        branches = [],
        image_urls = [],
        ...promotionFields
      } = promotionData;

      const { data, error } = await supabase
        .from('promotions')
        .insert({
          ...promotionFields,
          created_by: user?.id,
          status: 'draft' // New promotions start as draft
        })
        .select()
        .single();

      if (error || !data) {
        return { data, error };
      }

      await this.syncPromotionBranches(data.id, branches);
      await this.syncPromotionImages(data.id, image_urls);

      return this.getPromotion(data.id);
    } catch (error) {
      console.error('Error creating promotion:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing promotion
   */
  static async updatePromotion(promotionData: UpdatePromotionData): Promise<{ data: Promotion | null; error: any }> {
    try {
      // Get current user ID for updated_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const { id, branches = [], image_urls = [], ...updateData } = promotionData as UpdatePromotionData & {
        branches?: string[];
        image_urls?: string[];
      };
      
      const { data, error } = await supabase
        .from('promotions')
        .update({
          ...updateData,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return { data, error };
      }

      await this.syncPromotionBranches(id, branches);
      await this.syncPromotionImages(id, image_urls);

      return this.getPromotion(id);
    } catch (error) {
      console.error('Error updating promotion:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a promotion
   */
  static async deletePromotion(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error deleting promotion:', error);
      return { error };
    }
  }

  /**
   * Update promotion status
   */
  static async updatePromotionStatus(id: string, status: Promotion['status']): Promise<{ data: Promotion | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('promotions')
        .update({
          status,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating promotion status:', error);
      return { data: null, error };
    }
  }

  /**
   * Increment view count for a promotion
   */
  static async incrementViews(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.rpc('increment_promotion_views', {
        promotion_id: id
      });

      return { error };
    } catch (error) {
      console.error('Error incrementing views:', error);
      return { error };
    }
  }

  /**
   * Increment click count for a promotion
   */
  static async incrementClicks(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.rpc('increment_promotion_clicks', {
        promotion_id: id
      });

      return { error };
    } catch (error) {
      console.error('Error incrementing clicks:', error);
      return { error };
    }
  }

  /**
   * Get promotion statistics
   */
  static async getPromotionStats(): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('status, total_views, total_clicks')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        active: data?.filter(p => p.status === 'active').length || 0,
        upcoming: data?.filter(p => p.status === 'upcoming').length || 0,
        expired: data?.filter(p => p.status === 'expired').length || 0,
        draft: data?.filter(p => p.status === 'draft').length || 0,
        totalViews: data?.reduce((sum, p) => sum + (p.total_views || 0), 0) || 0,
        totalClicks: data?.reduce((sum, p) => sum + (p.total_clicks || 0), 0) || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching promotion stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Upload promotion image to Supabase Storage
   */
  static async uploadPromotionImage(file: File, promotionId: string): Promise<{ data: string | null; error: any }> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return { 
          data: null, 
          error: { message: 'Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.' } 
        };
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { 
          data: null, 
          error: { message: 'File too large. Please upload an image smaller than 10MB.' } 
        };
      }

      const fileExt = file.name.split('.').pop();
      const safeExt = fileExt || 'png';
      const timeStamp = Date.now();
      // Ensure consistent path: promotions/${id}/images/... .
      // If promotionId includes a subpath (e.g., `${id}/images/0`), treat it as a directory under promotions/.
      const cleanId = promotionId.replace(/^\/+|\/+$/g, '');
      const dir = cleanId.includes('/') ? `promotions/${cleanId}` : `promotions/${cleanId}/images`;
      const fileName = `banner-${timeStamp}.${safeExt}`;
      const filePath = `${dir}/${fileName}`;

      console.log('Uploading image:', { fileName, filePath, fileSize: file.size, fileType: file.type });

      const { data, error } = await supabase.storage
        .from('promotion-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { data: null, error };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('promotion-images')
        .getPublicUrl(filePath);

      console.log('Image uploaded successfully:', publicUrl);
      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading promotion image:', error);
      return { 
        data: null, 
        error: { message: 'Failed to upload image. Please try again.' } 
      };
    }
  }

  private static async syncPromotionBranches(promotionId: string, branchIds: string[]) {
    try {
      await supabase
        .from('promotion_branches')
        .delete()
        .eq('promotion_id', promotionId);

      if (!branchIds || branchIds.length === 0) {
        return;
      }

      const rows = branchIds.map((branchId, index) => ({
        promotion_id: promotionId,
        branch_id: branchId,
        display_order: index
      }));

      await supabase
        .from('promotion_branches')
        .insert(rows);
    } catch (error) {
      console.error('Error syncing promotion branches:', error);
    }
  }

  private static async syncPromotionImages(promotionId: string, imageUrls: string[]) {
    try {
      await supabase
        .from('promotion_images')
        .delete()
        .eq('promotion_id', promotionId);

      if (!imageUrls || imageUrls.length === 0) {
        await supabase
          .from('promotions')
          .update({ image_url: null })
          .eq('id', promotionId);
        return;
      }

      const rows = imageUrls.map((url, index) => ({
        promotion_id: promotionId,
        image_url: url,
        display_order: index
      }));

      await supabase
        .from('promotion_images')
        .insert(rows);

      await supabase
        .from('promotions')
        .update({ image_url: imageUrls[0] })
        .eq('id', promotionId);
    } catch (error) {
      console.error('Error syncing promotion images:', error);
    }
  }

  static async getBranches(): Promise<{ data: { id: string; name: string }[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      return { data: data ?? [], error };
    } catch (error) {
      console.error('Error fetching branches:', error);
      return { data: [], error };
    }
  }
}
