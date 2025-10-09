import { supabase } from './supabase';

export interface FacebookPage {
  id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  last_sync?: string;
  expires_at?: string;
  webhook_verify_token?: string;
  webhook_secret?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FacebookPost {
  id: string;
  facebook_post_id?: string;
  page_id: string;
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  scheduled_for?: string;
  published_at?: string;
  template_id?: string;
  promotion_id?: string;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FacebookTemplate {
  id: string;
  name: string;
  content: string;
  type: 'product' | 'seasonal' | 'announcement' | 'promotion' | 'general';
  category: 'marketing' | 'sales' | 'news' | 'events' | 'tips';
  status: 'active' | 'inactive' | 'draft';
  variables?: any;
  hashtags?: string[];
  call_to_action?: string;
  media_required: boolean;
  usage_count: number;
  last_used?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FacebookAnalytics {
  total_posts: number;
  total_reach: number;
  total_engagement: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_clicks: number;
  average_reach: number;
  average_engagement: number;
  engagement_rate: number;
}

export interface FacebookSettings {
  id: string;
  page_id: string;
  auto_post: boolean;
  post_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  post_time: string;
  timezone: string;
  include_images: boolean;
  include_hashtags: boolean;
  hashtag_strategy: 'trending' | 'custom' | 'mixed';
  post_format: 'simple' | 'detailed' | 'minimal';
  include_call_to_action: boolean;
  call_to_action_text: string;
  target_audience: 'all' | 'followers' | 'custom';
  exclude_weekends: boolean;
  max_posts_per_day: number;
  min_interval_hours: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class FacebookService {
  /**
   * Get all Facebook pages
   */
  static async getPages(): Promise<FacebookPage[]> {
    try {
      const { data: pages, error } = await supabase
        .from('facebook_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Facebook pages:', error);
        throw new Error(`Failed to fetch Facebook pages: ${error.message}`);
      }

      return pages || [];
    } catch (error) {
      console.error('Error in getPages:', error);
      throw error;
    }
  }

  /**
   * Get a specific Facebook page
   */
  static async getPage(id: string): Promise<FacebookPage> {
    try {
      const { data: page, error } = await supabase
        .from('facebook_pages')
        .select(`
          *,
          facebook_settings(*),
          facebook_posts(count)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching Facebook page:', error);
        throw new Error(`Failed to fetch Facebook page: ${error.message}`);
      }

      return page;
    } catch (error) {
      console.error('Error in getPage:', error);
      throw error;
    }
  }

  /**
   * Connect a new Facebook page
   */
  static async connectPage(pageData: {
    pageId: string;
    pageName: string;
    accessToken: string;
    permissions?: string[];
  }): Promise<FacebookPage> {
    try {
      const { data: page, error } = await supabase
        .from('facebook_pages')
        .upsert({
          page_id: pageData.pageId,
          page_name: pageData.pageName,
          access_token: pageData.accessToken,
          permissions: pageData.permissions || [],
          status: 'active',
          last_sync: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        }, {
          onConflict: 'page_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error connecting Facebook page:', error);
        throw new Error(`Failed to connect Facebook page: ${error.message}`);
      }

      return page;
    } catch (error) {
      console.error('Error in connectPage:', error);
      throw error;
    }
  }

  /**
   * Update a Facebook page
   */
  static async updatePage(id: string, updateData: Partial<FacebookPage>): Promise<FacebookPage> {
    try {
      const { data: page, error } = await supabase
        .from('facebook_pages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating Facebook page:', error);
        throw new Error(`Failed to update Facebook page: ${error.message}`);
      }

      return page;
    } catch (error) {
      console.error('Error in updatePage:', error);
      throw error;
    }
  }

  /**
   * Disconnect a Facebook page
   */
  static async disconnectPage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('facebook_pages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error disconnecting Facebook page:', error);
        throw new Error(`Failed to disconnect Facebook page: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in disconnectPage:', error);
      throw error;
    }
  }

  /**
   * Test Facebook page connection
   */
  static async testConnection(id: string): Promise<{
    connected: boolean;
    pageInfo?: any;
    error?: string;
  }> {
    try {
      const { data: page, error: pageError } = await supabase
        .from('facebook_pages')
        .select('page_id, access_token')
        .eq('id', id)
        .single();

      if (pageError) {
        throw new Error('Facebook page not found');
      }

      // Test the connection by making a simple API call
      const response = await fetch(`https://graph.facebook.com/v18.0/${page.page_id}?access_token=${page.access_token}&fields=id,name,fan_count`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          connected: false,
          error: errorData.error?.message || 'Connection test failed'
        };
      }

      const pageInfo = await response.json();
      return {
        connected: true,
        pageInfo
      };
    } catch (error) {
      console.error('Error testing Facebook connection:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Get Facebook posts
   */
  static async getPosts(filters: {
    pageId?: string;
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ data: FacebookPost[]; pagination: any }> {
    try {
      const {
        pageId,
        page = 1,
        limit = 10,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('facebook_posts')
        .select('*', { count: 'exact' });

      if (pageId) {
        query = query.eq('page_id', pageId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: posts, error, count } = await query;

      if (error) {
        console.error('Error fetching Facebook posts:', error);
        throw new Error(`Failed to fetch Facebook posts: ${error.message}`);
      }

      return {
        data: posts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getPosts:', error);
      throw error;
    }
  }

  /**
   * Create a Facebook post
   */
  static async createPost(postData: {
    pageId: string;
    content: string;
    mediaUrls?: string[];
    hashtags?: string[];
    scheduledFor?: string;
    templateId?: string;
    promotionId?: string;
  }): Promise<FacebookPost> {
    try {
      const { data: post, error } = await supabase
        .from('facebook_posts')
        .insert({
          page_id: postData.pageId,
          content: postData.content,
          media_urls: postData.mediaUrls,
          hashtags: postData.hashtags,
          scheduled_for: postData.scheduledFor,
          template_id: postData.templateId,
          promotion_id: postData.promotionId,
          status: postData.scheduledFor ? 'scheduled' : 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Facebook post:', error);
        throw new Error(`Failed to create Facebook post: ${error.message}`);
      }

      return post;
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }

  /**
   * Publish a Facebook post
   */
  static async publishPost(postId: string): Promise<FacebookPost> {
    try {
      const { data: post, error: postError } = await supabase
        .from('facebook_posts')
        .select(`
          *,
          facebook_pages(page_id, access_token)
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        throw new Error('Facebook post not found');
      }

      if (post.status !== 'scheduled') {
        throw new Error('Post is not scheduled for publishing');
      }

      // Here you would implement the actual Facebook API call
      // For now, we'll simulate it
      const facebookPostId = `fb_${Date.now()}`;

      const { data: updatedPost, error: updateError } = await supabase
        .from('facebook_posts')
        .update({
          facebook_post_id: facebookPostId,
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating post status:', updateError);
        throw new Error(`Failed to update post status: ${updateError.message}`);
      }

      return updatedPost;
    } catch (error) {
      console.error('Error in publishPost:', error);
      throw error;
    }
  }

  /**
   * Get Facebook page analytics
   */
  static async getAnalytics(pageId: string, startDate?: string, endDate?: string): Promise<FacebookAnalytics> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const { data: analytics, error } = await supabase
        .rpc('get_facebook_page_analytics', {
          page_uuid: pageId,
          start_date: start,
          end_date: end
        });

      if (error) {
        console.error('Error fetching Facebook analytics:', error);
        throw new Error(`Failed to fetch Facebook analytics: ${error.message}`);
      }

      return analytics?.[0] || {
        total_posts: 0,
        total_reach: 0,
        total_engagement: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        total_clicks: 0,
        average_reach: 0,
        average_engagement: 0,
        engagement_rate: 0
      };
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get Facebook templates
   */
  static async getTemplates(filters: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ data: FacebookTemplate[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('facebook_templates')
        .select('*', { count: 'exact' });

      if (type) {
        query = query.eq('type', type);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: templates, error, count } = await query;

      if (error) {
        console.error('Error fetching Facebook templates:', error);
        throw new Error(`Failed to fetch Facebook templates: ${error.message}`);
      }

      return {
        data: templates || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  }

  /**
   * Create a Facebook template
   */
  static async createTemplate(templateData: {
    name: string;
    content: string;
    type: string;
    category: string;
    status?: string;
    variables?: any;
    hashtags?: string[];
    callToAction?: string;
    mediaRequired?: boolean;
  }): Promise<FacebookTemplate> {
    try {
      const { data: template, error } = await supabase
        .from('facebook_templates')
        .insert({
          name: templateData.name,
          content: templateData.content,
          type: templateData.type,
          category: templateData.category,
          status: templateData.status || 'active',
          variables: templateData.variables,
          hashtags: templateData.hashtags,
          call_to_action: templateData.callToAction,
          media_required: templateData.mediaRequired || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Facebook template:', error);
        throw new Error(`Failed to create Facebook template: ${error.message}`);
      }

      return template;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  }

  /**
   * Update a Facebook template
   */
  static async updateTemplate(id: string, updateData: Partial<FacebookTemplate>): Promise<FacebookTemplate> {
    try {
      const { data: template, error } = await supabase
        .from('facebook_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating Facebook template:', error);
        throw new Error(`Failed to update Facebook template: ${error.message}`);
      }

      return template;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  }

  /**
   * Delete a Facebook template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('facebook_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting Facebook template:', error);
        throw new Error(`Failed to delete Facebook template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }

  /**
   * Get Facebook settings
   */
  static async getSettings(pageId: string): Promise<FacebookSettings | null> {
    try {
      const { data: settings, error } = await supabase
        .from('facebook_settings')
        .select('*')
        .eq('page_id', pageId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching Facebook settings:', error);
        throw new Error(`Failed to fetch Facebook settings: ${error.message}`);
      }

      return settings;
    } catch (error) {
      console.error('Error in getSettings:', error);
      throw error;
    }
  }

  /**
   * Update Facebook settings
   */
  static async updateSettings(pageId: string, settingsData: Partial<FacebookSettings>): Promise<FacebookSettings> {
    try {
      const { data: settings, error } = await supabase
        .from('facebook_settings')
        .upsert({
          page_id: pageId,
          ...settingsData
        }, {
          onConflict: 'page_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating Facebook settings:', error);
        throw new Error(`Failed to update Facebook settings: ${error.message}`);
      }

      return settings;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  }

  /**
   * Get scheduled posts
   */
  static async getScheduledPosts(pageId: string): Promise<any[]> {
    try {
      const { data: posts, error } = await supabase
        .rpc('get_scheduled_facebook_posts', {
          page_uuid: pageId
        });

      if (error) {
        console.error('Error fetching scheduled posts:', error);
        throw new Error(`Failed to fetch scheduled posts: ${error.message}`);
      }

      return posts || [];
    } catch (error) {
      console.error('Error in getScheduledPosts:', error);
      throw error;
    }
  }
}

export default FacebookService;
