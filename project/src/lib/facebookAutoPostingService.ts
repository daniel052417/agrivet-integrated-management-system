import { FacebookService } from './facebookService';
import { FacebookApiService } from './facebookApiService';
import { PromotionsService } from './promotionsService';

export interface AutoPostingConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  postTime: string;
  timezone: string;
  includeImages: boolean;
  includeHashtags: boolean;
  hashtagStrategy: 'trending' | 'custom' | 'mixed';
  postFormat: 'simple' | 'detailed' | 'minimal';
  includeCallToAction: boolean;
  callToActionText: string;
  targetAudience: 'all' | 'followers' | 'custom';
  excludeWeekends: boolean;
  maxPostsPerDay: number;
  minIntervalHours: number;
}

export interface PostingSchedule {
  id: string;
  pageId: string;
  content: string;
  scheduledFor: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastAttempt?: string;
  error?: string;
  metadata?: any;
}

export class FacebookAutoPostingService {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize auto-posting for a page
   */
  static async initializeAutoPosting(pageId: string, config: AutoPostingConfig): Promise<void> {
    try {
      await FacebookService.updateSettings(pageId, config);
      
      // Schedule the first post
      await this.scheduleNextPost(pageId);
      
      console.log(`Auto-posting initialized for page ${pageId}`);
    } catch (error) {
      console.error('Error initializing auto-posting:', error);
      throw error;
    }
  }

  /**
   * Schedule the next post based on configuration
   */
  static async scheduleNextPost(pageId: string): Promise<void> {
    try {
      const settings = await FacebookService.getSettings(pageId);
      if (!settings || !settings.auto_post) {
        return;
      }

      const nextPostTime = this.calculateNextPostTime(settings);
      const content = await this.generatePostContent(pageId, settings);
      
      if (content) {
        await FacebookService.createPost({
          pageId,
          content,
          scheduledFor: nextPostTime.toISOString()
        });
        
        console.log(`Next post scheduled for ${nextPostTime.toISOString()}`);
      }
    } catch (error) {
      console.error('Error scheduling next post:', error);
      throw error;
    }
  }

  /**
   * Calculate the next post time based on settings
   */
  private static calculateNextPostTime(settings: any): Date {
    const now = new Date();
    const postTime = new Date(settings.post_time);
    const timezone = settings.timezone || 'UTC';
    
    // Set the time for today
    const today = new Date(now);
    today.setHours(postTime.getHours(), postTime.getMinutes(), 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (today <= now) {
      today.setDate(today.getDate() + 1);
    }
    
    // Check if we should exclude weekends
    if (settings.exclude_weekends) {
      while (today.getDay() === 0 || today.getDay() === 6) {
        today.setDate(today.getDate() + 1);
      }
    }
    
    // Apply frequency logic
    switch (settings.post_frequency) {
      case 'daily':
        // Already set to next day
        break;
      case 'weekly':
        today.setDate(today.getDate() + 7);
        break;
      case 'monthly':
        today.setMonth(today.getMonth() + 1);
        break;
      case 'hourly':
        today.setHours(today.getHours() + 1);
        break;
    }
    
    return today;
  }

  /**
   * Generate post content based on settings and available data
   */
  private static async generatePostContent(pageId: string, settings: any): Promise<string | null> {
    try {
      // Get active promotions
      const promotions = await PromotionsService.getActivePromotionsForPWA();
      
      // Get recent sales data for inspiration
      const salesData = await this.getRecentSalesData();
      
      // Generate content based on post format
      let content = '';
      
      switch (settings.post_format) {
        case 'simple':
          content = await this.generateSimplePost(promotions, salesData);
          break;
        case 'detailed':
          content = await this.generateDetailedPost(promotions, salesData);
          break;
        case 'minimal':
          content = await this.generateMinimalPost(promotions, salesData);
          break;
        default:
          content = await this.generateSimplePost(promotions, salesData);
      }
      
      // Add hashtags if enabled
      if (settings.include_hashtags) {
        const hashtags = await this.generateHashtags(settings.hashtag_strategy);
        content += `\n\n${hashtags}`;
      }
      
      // Add call to action if enabled
      if (settings.include_call_to_action && settings.call_to_action_text) {
        content += `\n\n${settings.call_to_action_text}`;
      }
      
      return content;
    } catch (error) {
      console.error('Error generating post content:', error);
      return null;
    }
  }

  /**
   * Generate simple post content
   */
  private static async generateSimplePost(promotions: any[], salesData: any): Promise<string> {
    const templates = [
      "🌱 Discover our latest agricultural products! Visit our store today.",
      "🚜 Quality farming solutions for better harvests. Check out our products!",
      "🌾 From seeds to success - we've got everything you need for your farm.",
      "💚 Supporting local farmers with premium agricultural supplies.",
      "🌿 Grow with confidence using our trusted agricultural products."
    ];
    
    if (promotions.length > 0) {
      const promotion = promotions[0];
      return `🎉 Special Offer: ${promotion.title}\n\n${promotion.description}\n\nVisit our store to take advantage of this limited-time deal!`;
    }
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate detailed post content
   */
  private static async generateDetailedPost(promotions: any[], salesData: any): Promise<string> {
    let content = "🌱 Welcome to Tiongson Agrivet! 🌱\n\n";
    
    if (promotions.length > 0) {
      content += "🔥 CURRENT PROMOTIONS:\n";
      promotions.slice(0, 3).forEach(promo => {
        content += `• ${promo.title} - ${promo.description}\n`;
      });
      content += "\n";
    }
    
    content += "🌾 Our Products Include:\n";
    content += "• High-quality seeds and seedlings\n";
    content += "• Fertilizers and soil amendments\n";
    content += "• Pest control solutions\n";
    content += "• Farming tools and equipment\n";
    content += "• Animal feed and supplements\n\n";
    
    content += "📍 Visit us at our store for expert advice and premium products!\n";
    content += "🕒 Open Monday to Saturday, 8:00 AM - 6:00 PM";
    
    return content;
  }

  /**
   * Generate minimal post content
   */
  private static async generateMinimalPost(promotions: any[], salesData: any): Promise<string> {
    if (promotions.length > 0) {
      const promotion = promotions[0];
      return `🎉 ${promotion.title} - ${promotion.description}`;
    }
    
    return "🌱 Quality agricultural products. Visit us today! 🌱";
  }

  /**
   * Generate hashtags based on strategy
   */
  private static async generateHashtags(strategy: string): Promise<string> {
    const baseHashtags = [
      "#Agriculture", "#Farming", "#Agrivet", "#TiongsonAgrivet",
      "#Fertilizer", "#Seeds", "#FarmingTools", "#LocalBusiness"
    ];
    
    const trendingHashtags = [
      "#SustainableFarming", "#OrganicFarming", "#FarmLife", "#AgricultureLife",
      "#FarmingTips", "#CropProduction", "#SoilHealth", "#FarmToTable"
    ];
    
    const customHashtags = [
      "#TiongsonAgrivet", "#LocalFarmers", "#AgriculturalSupplies",
      "#FarmingCommunity", "#QualityProducts", "#ExpertAdvice"
    ];
    
    let hashtags: string[] = [];
    
    switch (strategy) {
      case 'trending':
        hashtags = [...baseHashtags, ...trendingHashtags];
        break;
      case 'custom':
        hashtags = [...baseHashtags, ...customHashtags];
        break;
      case 'mixed':
        hashtags = [...baseHashtags, ...trendingHashtags.slice(0, 3), ...customHashtags.slice(0, 3)];
        break;
      default:
        hashtags = baseHashtags;
    }
    
    // Return 5-8 random hashtags
    const shuffled = hashtags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 4) + 5).join(' ');
  }

  /**
   * Get recent sales data for content inspiration
   */
  private static async getRecentSalesData(): Promise<any> {
    try {
      // This would integrate with your sales data
      // For now, return mock data
      return {
        topProducts: ['Fertilizer', 'Seeds', 'Tools'],
        totalSales: 15000,
        customerCount: 45
      };
    } catch (error) {
      console.error('Error getting recent sales data:', error);
      return null;
    }
  }

  /**
   * Process scheduled posts
   */
  static async processScheduledPosts(): Promise<void> {
    try {
      const { data: pages } = await FacebookService.getPages();
      
      for (const page of pages) {
        if (page.status === 'active') {
          await this.processPageScheduledPosts(page.id);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
      throw error;
    }
  }

  /**
   * Process scheduled posts for a specific page
   */
  private static async processPageScheduledPosts(pageId: string): Promise<void> {
    try {
      const { data: posts } = await FacebookService.getPosts({
        pageId,
        status: 'scheduled',
        limit: 10
      });
      
      const now = new Date();
      
      for (const post of posts || []) {
        if (post.scheduled_for && new Date(post.scheduled_for) <= now) {
          await this.publishScheduledPost(post);
        }
      }
    } catch (error) {
      console.error(`Error processing scheduled posts for page ${pageId}:`, error);
    }
  }

  /**
   * Publish a scheduled post
   */
  private static async publishScheduledPost(post: any): Promise<void> {
    try {
      const result = await FacebookApiService.createPost(post.page_id, {
        message: post.content,
        hashtags: post.hashtags?.join(' ')
      });
      
      if (result.success) {
        await FacebookService.updatePage(post.id, {
          status: 'published',
          published_at: new Date().toISOString(),
          facebook_post_id: result.data.id
        });
        
        console.log(`Successfully published post ${post.id}`);
      } else {
        await this.handlePostingError(post, result.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error);
      await this.handlePostingError(post, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle posting errors with retry logic
   */
  private static async handlePostingError(post: any, error: string): Promise<void> {
    const retryCount = (post.retry_count || 0) + 1;
    
    if (retryCount <= this.MAX_RETRY_ATTEMPTS) {
      // Retry after delay
      const retryTime = new Date(Date.now() + this.RETRY_DELAY_MS);
      
      await FacebookService.updatePage(post.id, {
        retry_count: retryCount,
        last_attempt: new Date().toISOString(),
        error: error,
        scheduled_for: retryTime.toISOString()
      });
      
      console.log(`Post ${post.id} will be retried in ${this.RETRY_DELAY_MS / 1000 / 60} minutes`);
    } else {
      // Mark as failed
      await FacebookService.updatePage(post.id, {
        status: 'failed',
        error: error,
        last_attempt: new Date().toISOString()
      });
      
      console.error(`Post ${post.id} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
    }
  }

  /**
   * Get auto-posting statistics
   */
  static async getAutoPostingStats(pageId: string): Promise<any> {
    try {
      const { data: posts } = await FacebookService.getPosts({ pageId });
      const { data: settings } = await FacebookService.getSettings(pageId);
      
      const stats = {
        totalPosts: posts?.length || 0,
        publishedPosts: posts?.filter(p => p.status === 'published').length || 0,
        scheduledPosts: posts?.filter(p => p.status === 'scheduled').length || 0,
        failedPosts: posts?.filter(p => p.status === 'failed').length || 0,
        autoPostingEnabled: settings?.auto_post || false,
        nextScheduledPost: posts?.find(p => p.status === 'scheduled')?.scheduled_for,
        averageEngagement: 0,
        totalReach: 0
      };
      
      // Calculate engagement metrics
      const publishedPosts = posts?.filter(p => p.status === 'published') || [];
      if (publishedPosts.length > 0) {
        stats.averageEngagement = publishedPosts.reduce((sum, post) => 
          sum + (post.engagement || 0), 0) / publishedPosts.length;
        stats.totalReach = publishedPosts.reduce((sum, post) => 
          sum + (post.reach || 0), 0);
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting auto-posting stats:', error);
      throw error;
    }
  }

  /**
   * Stop auto-posting for a page
   */
  static async stopAutoPosting(pageId: string): Promise<void> {
    try {
      await FacebookService.updateSettings(pageId, {
        auto_post: false
      });
      
      // Cancel all scheduled posts
      const { data: posts } = await FacebookService.getPosts({
        pageId,
        status: 'scheduled'
      });
      
      for (const post of posts || []) {
        await FacebookService.updatePage(post.id, {
          status: 'cancelled'
        });
      }
      
      console.log(`Auto-posting stopped for page ${pageId}`);
    } catch (error) {
      console.error('Error stopping auto-posting:', error);
      throw error;
    }
  }
}

export default FacebookAutoPostingService;
