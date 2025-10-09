import { FacebookService } from './facebookService';
import { FacebookAutoPostingService } from './facebookAutoPostingService';
import { PromotionsService } from './promotionsService';
import { FacebookApiService } from './facebookApiService';

export interface PromotionPostData {
  promotionId: string;
  pageId: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledFor?: string;
  templateId?: string;
}

export interface PromotionPostTemplate {
  id: string;
  name: string;
  content: string;
  type: 'promotion_announcement' | 'promotion_reminder' | 'promotion_ending' | 'promotion_highlight';
  variables: string[];
  hashtags: string[];
  callToAction: string;
  mediaRequired: boolean;
}

export interface PromotionPostingConfig {
  autoPostPromotions: boolean;
  postFrequency: 'immediate' | 'daily' | 'weekly' | 'custom';
  customSchedule?: string;
  includeImages: boolean;
  includeHashtags: boolean;
  hashtagStrategy: 'trending' | 'custom' | 'mixed';
  postFormat: 'simple' | 'detailed' | 'minimal';
  includeCallToAction: boolean;
  callToActionText: string;
  reminderDays: number[];
  endingReminderDays: number[];
  maxPostsPerPromotion: number;
  excludeWeekends: boolean;
}

export class FacebookPromotionsIntegration {
  private static readonly PROMOTION_TEMPLATES: PromotionPostTemplate[] = [
    {
      id: 'promo_announcement',
      name: 'Promotion Announcement',
      content: '🎉 NEW PROMOTION ALERT! 🎉\n\n{{title}}\n\n{{description}}\n\n💰 {{discount_type}}: {{discount_value}}\n📅 Valid: {{start_date}} - {{end_date}}\n\n{{call_to_action}}',
      type: 'promotion_announcement',
      variables: ['title', 'description', 'discount_type', 'discount_value', 'start_date', 'end_date', 'call_to_action'],
      hashtags: ['#Promotion', '#Sale', '#Discount', '#SpecialOffer', '#LimitedTime'],
      callToAction: 'Visit our store today!',
      mediaRequired: true
    },
    {
      id: 'promo_reminder',
      name: 'Promotion Reminder',
      content: '⏰ Don\'t miss out! ⏰\n\n{{title}} is still available!\n\n{{description}}\n\n💰 {{discount_type}}: {{discount_value}}\n⏳ Ends: {{end_date}}\n\n{{call_to_action}}',
      type: 'promotion_reminder',
      variables: ['title', 'description', 'discount_type', 'discount_value', 'end_date', 'call_to_action'],
      hashtags: ['#Reminder', '#LastChance', '#Sale', '#Discount', '#HurryUp'],
      callToAction: 'Shop now before it\'s too late!',
      mediaRequired: true
    },
    {
      id: 'promo_ending',
      name: 'Promotion Ending Soon',
      content: '🚨 FINAL HOURS! 🚨\n\n{{title}} ends soon!\n\n{{description}}\n\n💰 {{discount_type}}: {{discount_value}}\n⏰ Last day: {{end_date}}\n\n{{call_to_action}}',
      type: 'promotion_ending',
      variables: ['title', 'description', 'discount_type', 'discount_value', 'end_date', 'call_to_action'],
      hashtags: ['#FinalHours', '#LastDay', '#EndingSoon', '#Sale', '#Discount'],
      callToAction: 'Get it now!',
      mediaRequired: true
    },
    {
      id: 'promo_highlight',
      name: 'Promotion Highlight',
      content: '✨ FEATURED PROMOTION ✨\n\n{{title}}\n\n{{description}}\n\n💰 {{discount_type}}: {{discount_value}}\n📅 {{start_date}} - {{end_date}}\n\n{{call_to_action}}',
      type: 'promotion_highlight',
      variables: ['title', 'description', 'discount_type', 'discount_value', 'start_date', 'end_date', 'call_to_action'],
      hashtags: ['#Featured', '#Highlight', '#Promotion', '#Sale', '#Special'],
      callToAction: 'Check it out!',
      mediaRequired: true
    }
  ];

  /**
   * Initialize Facebook promotions integration
   */
  static async initializePromotionsIntegration(pageId: string, config: PromotionPostingConfig): Promise<void> {
    try {
      // Update Facebook settings with promotion posting configuration
      await FacebookService.updateSettings(pageId, {
        auto_post: config.autoPostPromotions,
        post_frequency: config.postFrequency === 'immediate' ? 'daily' : config.postFrequency,
        include_hashtags: config.includeHashtags,
        hashtag_strategy: config.hashtagStrategy,
        post_format: config.postFormat,
        include_call_to_action: config.includeCallToAction,
        call_to_action_text: config.callToActionText,
        exclude_weekends: config.excludeWeekends,
        max_posts_per_day: config.maxPostsPerPromotion
      });

      // Create promotion post templates
      await this.createPromotionTemplates(pageId);

      console.log(`Facebook promotions integration initialized for page ${pageId}`);
    } catch (error) {
      console.error('Error initializing Facebook promotions integration:', error);
      throw error;
    }
  }

  /**
   * Create promotion post templates
   */
  private static async createPromotionTemplates(pageId: string): Promise<void> {
    try {
      for (const template of this.PROMOTION_TEMPLATES) {
        await FacebookService.createTemplate({
          name: template.name,
          content: template.content,
          type: template.type,
          category: 'marketing',
          status: 'active',
          variables: template.variables,
          hashtags: template.hashtags,
          callToAction: template.callToAction,
          mediaRequired: template.mediaRequired
        });
      }
    } catch (error) {
      console.error('Error creating promotion templates:', error);
      throw error;
    }
  }

  /**
   * Process new promotions for Facebook posting
   */
  static async processNewPromotion(promotionId: string): Promise<void> {
    try {
      const promotion = await PromotionsService.getPromotion(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Get all active Facebook pages
      const pages = await FacebookService.getPages();
      const activePages = pages.filter(page => page.status === 'active');

      for (const page of activePages) {
        const settings = await FacebookService.getSettings(page.id);
        if (settings?.auto_post && settings.show_on_facebook) {
          await this.createPromotionPost(page.id, promotion, 'promotion_announcement');
        }
      }
    } catch (error) {
      console.error('Error processing new promotion:', error);
      throw error;
    }
  }

  /**
   * Create a promotion post
   */
  private static async createPromotionPost(
    pageId: string,
    promotion: any,
    templateType: string
  ): Promise<void> {
    try {
      const template = this.PROMOTION_TEMPLATES.find(t => t.type === templateType);
      if (!template) {
        throw new Error(`Template not found: ${templateType}`);
      }

      const content = this.generatePromotionContent(promotion, template);
      const hashtags = await this.generatePromotionHashtags(promotion, template);
      const mediaUrls = await this.getPromotionMediaUrls(promotion);

      await FacebookService.createPost({
        pageId,
        content,
        hashtags,
        mediaUrls,
        templateId: template.id,
        promotionId: promotion.id
      });

      console.log(`Promotion post created for ${promotion.title} on page ${pageId}`);
    } catch (error) {
      console.error('Error creating promotion post:', error);
      throw error;
    }
  }

  /**
   * Generate promotion content using template
   */
  private static generatePromotionContent(promotion: any, template: PromotionPostTemplate): string {
    let content = template.content;

    // Replace template variables
    const variables = {
      title: promotion.title,
      description: promotion.description,
      discount_type: promotion.discount_type === 'percentage' ? 'Save' : 'Get',
      discount_value: promotion.discount_type === 'percentage' 
        ? `${promotion.discount_value}% OFF` 
        : `₱${promotion.discount_value} OFF`,
      start_date: new Date(promotion.start_date).toLocaleDateString(),
      end_date: new Date(promotion.end_date).toLocaleDateString(),
      call_to_action: template.callToAction
    };

    // Replace variables in content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  }

  /**
   * Generate hashtags for promotion post
   */
  private static async generatePromotionHashtags(promotion: any, template: PromotionPostTemplate): Promise<string[]> {
    const baseHashtags = [...template.hashtags];
    const promotionHashtags = this.extractHashtagsFromPromotion(promotion);
    const trendingHashtags = await this.getTrendingHashtags();

    // Combine hashtags based on strategy
    let hashtags = [...baseHashtags, ...promotionHashtags];

    // Add trending hashtags if strategy includes them
    if (template.type === 'promotion_announcement') {
      hashtags = [...hashtags, ...trendingHashtags.slice(0, 3)];
    }

    // Remove duplicates and limit to 10 hashtags
    return [...new Set(hashtags)].slice(0, 10);
  }

  /**
   * Extract hashtags from promotion data
   */
  private static extractHashtagsFromPromotion(promotion: any): string[] {
    const hashtags: string[] = [];

    // Add hashtags based on promotion title
    const titleWords = promotion.title.toLowerCase().split(' ');
    titleWords.forEach(word => {
      if (word.length > 3) {
        hashtags.push(`#${word.charAt(0).toUpperCase() + word.slice(1)}`);
      }
    });

    // Add hashtags based on discount type
    if (promotion.discount_type === 'percentage') {
      hashtags.push('#PercentageOff', '#Discount');
    } else {
      hashtags.push('#AmountOff', '#Savings');
    }

    // Add hashtags based on products/categories
    if (promotion.products && promotion.products.length > 0) {
      hashtags.push('#Products', '#Items');
    }
    if (promotion.categories && promotion.categories.length > 0) {
      hashtags.push('#Categories', '#Types');
    }

    return hashtags;
  }

  /**
   * Get trending hashtags (mock implementation)
   */
  private static async getTrendingHashtags(): Promise<string[]> {
    // In a real implementation, this would fetch from a trending hashtags API
    return [
      '#Agriculture', '#Farming', '#LocalBusiness', '#Community',
      '#SustainableFarming', '#OrganicFarming', '#FarmLife'
    ];
  }

  /**
   * Get promotion media URLs
   */
  private static async getPromotionMediaUrls(promotion: any): Promise<string[]> {
    // In a real implementation, this would fetch from your media storage
    // For now, return empty array or placeholder URLs
    return [];
  }

  /**
   * Schedule promotion reminders
   */
  static async schedulePromotionReminders(promotionId: string): Promise<void> {
    try {
      const promotion = await PromotionsService.getPromotion(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }

      const pages = await FacebookService.getPages();
      const activePages = pages.filter(page => page.status === 'active');

      for (const page of activePages) {
        const settings = await FacebookService.getSettings(page.id);
        if (settings?.auto_post && settings.show_on_facebook) {
          await this.scheduleReminderPosts(page.id, promotion);
        }
      }
    } catch (error) {
      console.error('Error scheduling promotion reminders:', error);
      throw error;
    }
  }

  /**
   * Schedule reminder posts for a promotion
   */
  private static async scheduleReminderPosts(pageId: string, promotion: any): Promise<void> {
    try {
      const startDate = new Date(promotion.start_date);
      const endDate = new Date(promotion.end_date);
      const now = new Date();

      // Schedule reminder posts
      const reminderDays = [3, 1]; // 3 days and 1 day before end
      
      for (const days of reminderDays) {
        const reminderDate = new Date(endDate);
        reminderDate.setDate(reminderDate.getDate() - days);
        
        if (reminderDate > now) {
          const content = this.generatePromotionContent(promotion, 
            this.PROMOTION_TEMPLATES.find(t => t.type === 'promotion_reminder')!);
          const hashtags = await this.generatePromotionHashtags(promotion, 
            this.PROMOTION_TEMPLATES.find(t => t.type === 'promotion_reminder')!);

          await FacebookService.createPost({
            pageId,
            content,
            hashtags,
            scheduledFor: reminderDate.toISOString(),
            templateId: 'promo_reminder',
            promotionId: promotion.id
          });
        }
      }

      // Schedule ending soon post (1 day before end)
      const endingDate = new Date(endDate);
      endingDate.setDate(endingDate.getDate() - 1);
      
      if (endingDate > now) {
        const content = this.generatePromotionContent(promotion, 
          this.PROMOTION_TEMPLATES.find(t => t.type === 'promotion_ending')!);
        const hashtags = await this.generatePromotionHashtags(promotion, 
          this.PROMOTION_TEMPLATES.find(t => t.type === 'promotion_ending')!);

        await FacebookService.createPost({
          pageId,
          content,
          hashtags,
          scheduledFor: endingDate.toISOString(),
          templateId: 'promo_ending',
          promotionId: promotion.id
        });
      }
    } catch (error) {
      console.error('Error scheduling reminder posts:', error);
      throw error;
    }
  }

  /**
   * Process promotion updates
   */
  static async processPromotionUpdate(promotionId: string): Promise<void> {
    try {
      const promotion = await PromotionsService.getPromotion(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Update existing scheduled posts for this promotion
      const pages = await FacebookService.getPages();
      const activePages = pages.filter(page => page.status === 'active');

      for (const page of activePages) {
        const { data: posts } = await FacebookService.getPosts({
          pageId: page.id,
          status: 'scheduled'
        });

        const promotionPosts = posts?.filter(post => post.promotion_id === promotionId) || [];
        
        for (const post of promotionPosts) {
          // Update post content with new promotion data
          const template = this.PROMOTION_TEMPLATES.find(t => t.id === post.template_id);
          if (template) {
            const content = this.generatePromotionContent(promotion, template);
            const hashtags = await this.generatePromotionHashtags(promotion, template);

            await FacebookService.updatePage(post.id, {
              content,
              hashtags
            });
          }
        }
      }

      console.log(`Promotion posts updated for ${promotion.title}`);
    } catch (error) {
      console.error('Error processing promotion update:', error);
      throw error;
    }
  }

  /**
   * Process promotion expiration
   */
  static async processPromotionExpiration(promotionId: string): Promise<void> {
    try {
      // Cancel any scheduled posts for expired promotion
      const pages = await FacebookService.getPages();
      const activePages = pages.filter(page => page.status === 'active');

      for (const page of activePages) {
        const { data: posts } = await FacebookService.getPosts({
          pageId: page.id,
          status: 'scheduled'
        });

        const promotionPosts = posts?.filter(post => post.promotion_id === promotionId) || [];
        
        for (const post of promotionPosts) {
          await FacebookService.updatePage(post.id, {
            status: 'cancelled'
          });
        }
      }

      console.log(`Scheduled posts cancelled for expired promotion ${promotionId}`);
    } catch (error) {
      console.error('Error processing promotion expiration:', error);
      throw error;
    }
  }

  /**
   * Get promotion posting statistics
   */
  static async getPromotionPostingStats(promotionId: string): Promise<any> {
    try {
      const pages = await FacebookService.getPages();
      const activePages = pages.filter(page => page.status === 'active');

      let totalPosts = 0;
      let publishedPosts = 0;
      let scheduledPosts = 0;
      let totalReach = 0;
      let totalEngagement = 0;

      for (const page of activePages) {
        const { data: posts } = await FacebookService.getPosts({
          pageId: page.id
        });

        const promotionPosts = posts?.filter(post => post.promotion_id === promotionId) || [];
        totalPosts += promotionPosts.length;
        publishedPosts += promotionPosts.filter(p => p.status === 'published').length;
        scheduledPosts += promotionPosts.filter(p => p.status === 'scheduled').length;
        totalReach += promotionPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
        totalEngagement += promotionPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);
      }

      return {
        promotionId,
        totalPosts,
        publishedPosts,
        scheduledPosts,
        totalReach,
        totalEngagement,
        averageReach: publishedPosts > 0 ? totalReach / publishedPosts : 0,
        averageEngagement: publishedPosts > 0 ? totalEngagement / publishedPosts : 0
      };
    } catch (error) {
      console.error('Error getting promotion posting stats:', error);
      throw error;
    }
  }

  /**
   * Get all promotion posting statistics
   */
  static async getAllPromotionPostingStats(): Promise<any> {
    try {
      const promotions = await PromotionsService.getPromotions({ status: 'active' });
      const stats = [];

      for (const promotion of promotions) {
        const promotionStats = await this.getPromotionPostingStats(promotion.id);
        stats.push(promotionStats);
      }

      return stats;
    } catch (error) {
      console.error('Error getting all promotion posting stats:', error);
      throw error;
    }
  }
}

export default FacebookPromotionsIntegration;
