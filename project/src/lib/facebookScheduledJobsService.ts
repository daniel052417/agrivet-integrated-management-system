import { FacebookPromotionsIntegration } from './facebookPromotionsIntegration';
import { FacebookAutoPostingService } from './facebookAutoPostingService';
import { FacebookService } from './facebookService';
import { PromotionsService } from './promotionsService';

export interface ScheduledJobConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  time: string;
  timezone: string;
  maxRetries: number;
  retryDelay: number;
}

export interface JobExecutionResult {
  jobName: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  errors: string[];
  metadata?: any;
}

export class FacebookScheduledJobsService {
  private static readonly DEFAULT_CONFIG: ScheduledJobConfig = {
    enabled: true,
    frequency: 'hourly',
    time: '00:00',
    timezone: 'UTC',
    maxRetries: 3,
    retryDelay: 300000 // 5 minutes
  };

  private static jobHistory: JobExecutionResult[] = [];
  private static isRunning = false;

  /**
   * Initialize scheduled jobs
   */
  static async initializeScheduledJobs(config: ScheduledJobConfig = this.DEFAULT_CONFIG): Promise<void> {
    try {
      console.log('Initializing Facebook scheduled jobs...');

      // Set up interval based on frequency
      const intervalMs = this.getIntervalMs(config.frequency);
      
      if (config.enabled) {
        setInterval(async () => {
          if (!this.isRunning) {
            await this.runAllJobs();
          }
        }, intervalMs);

        console.log(`Facebook scheduled jobs initialized with ${config.frequency} frequency`);
      }
    } catch (error) {
      console.error('Error initializing scheduled jobs:', error);
      throw error;
    }
  }

  /**
   * Get interval in milliseconds based on frequency
   */
  private static getIntervalMs(frequency: string): number {
    switch (frequency) {
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return 60 * 60 * 1000; // Default to hourly
    }
  }

  /**
   * Run all scheduled jobs
   */
  static async runAllJobs(): Promise<JobExecutionResult[]> {
    if (this.isRunning) {
      console.log('Jobs already running, skipping...');
      return [];
    }

    this.isRunning = true;
    const results: JobExecutionResult[] = [];

    try {
      console.log('Starting Facebook scheduled jobs...');

      // Job 1: Process new promotions
      const newPromotionsResult = await this.runJob('process_new_promotions', this.processNewPromotions);
      results.push(newPromotionsResult);

      // Job 2: Process promotion reminders
      const remindersResult = await this.runJob('process_promotion_reminders', this.processPromotionReminders);
      results.push(remindersResult);

      // Job 3: Process promotion updates
      const updatesResult = await this.runJob('process_promotion_updates', this.processPromotionUpdates);
      results.push(updatesResult);

      // Job 4: Process expired promotions
      const expiredResult = await this.runJob('process_expired_promotions', this.processExpiredPromotions);
      results.push(expiredResult);

      // Job 5: Process scheduled posts
      const postsResult = await this.runJob('process_scheduled_posts', this.processScheduledPosts);
      results.push(postsResult);

      // Job 6: Update post analytics
      const analyticsResult = await this.runJob('update_post_analytics', this.updatePostAnalytics);
      results.push(analyticsResult);

      // Job 7: Cleanup old data
      const cleanupResult = await this.runJob('cleanup_old_data', this.cleanupOldData);
      results.push(cleanupResult);

      console.log('All Facebook scheduled jobs completed');
    } catch (error) {
      console.error('Error running scheduled jobs:', error);
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Run a specific job with error handling and retry logic
   */
  private static async runJob(
    jobName: string,
    jobFunction: () => Promise<any>,
    retryCount: number = 0
  ): Promise<JobExecutionResult> {
    const startTime = new Date();
    const result: JobExecutionResult = {
      jobName,
      success: false,
      startTime,
      endTime: startTime,
      duration: 0,
      recordsProcessed: 0,
      errors: []
    };

    try {
      console.log(`Running job: ${jobName}`);
      const jobResult = await jobFunction();
      
      result.success = true;
      result.recordsProcessed = jobResult?.recordsProcessed || 0;
      result.metadata = jobResult?.metadata;
      
      console.log(`Job ${jobName} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      
      console.error(`Job ${jobName} failed:`, errorMessage);
      
      // Retry logic
      if (retryCount < this.DEFAULT_CONFIG.maxRetries) {
        console.log(`Retrying job ${jobName} in ${this.DEFAULT_CONFIG.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.DEFAULT_CONFIG.retryDelay));
        return this.runJob(jobName, jobFunction, retryCount + 1);
      }
    } finally {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      this.jobHistory.push(result);
    }

    return result;
  }

  /**
   * Process new promotions for Facebook posting
   */
  private static async processNewPromotions(): Promise<any> {
    try {
      // Get promotions that started today and haven't been posted yet
      const today = new Date().toISOString().split('T')[0];
      const promotions = await PromotionsService.getPromotions({
        status: 'active',
        startDate: today
      });

      let recordsProcessed = 0;

      for (const promotion of promotions) {
        try {
          await FacebookPromotionsIntegration.processNewPromotion(promotion.id);
          recordsProcessed++;
        } catch (error) {
          console.error(`Error processing promotion ${promotion.id}:`, error);
        }
      }

      return { recordsProcessed, metadata: { date: today } };
    } catch (error) {
      console.error('Error in processNewPromotions:', error);
      throw error;
    }
  }

  /**
   * Process promotion reminders
   */
  private static async processPromotionReminders(): Promise<any> {
    try {
      // Get active promotions that need reminders
      const promotions = await PromotionsService.getPromotions({
        status: 'active'
      });

      let recordsProcessed = 0;

      for (const promotion of promotions) {
        try {
          await FacebookPromotionsIntegration.schedulePromotionReminders(promotion.id);
          recordsProcessed++;
        } catch (error) {
          console.error(`Error scheduling reminders for promotion ${promotion.id}:`, error);
        }
      }

      return { recordsProcessed };
    } catch (error) {
      console.error('Error in processPromotionReminders:', error);
      throw error;
    }
  }

  /**
   * Process promotion updates
   */
  private static async processPromotionUpdates(): Promise<any> {
    try {
      // Get promotions that were updated recently
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const promotions = await PromotionsService.getPromotions({
        status: 'active',
        updatedAfter: yesterday.toISOString()
      });

      let recordsProcessed = 0;

      for (const promotion of promotions) {
        try {
          await FacebookPromotionsIntegration.processPromotionUpdate(promotion.id);
          recordsProcessed++;
        } catch (error) {
          console.error(`Error updating promotion ${promotion.id}:`, error);
        }
      }

      return { recordsProcessed };
    } catch (error) {
      console.error('Error in processPromotionUpdates:', error);
      throw error;
    }
  }

  /**
   * Process expired promotions
   */
  private static async processExpiredPromotions(): Promise<any> {
    try {
      // Get promotions that expired today
      const today = new Date().toISOString().split('T')[0];
      const promotions = await PromotionsService.getPromotions({
        status: 'expired',
        endDate: today
      });

      let recordsProcessed = 0;

      for (const promotion of promotions) {
        try {
          await FacebookPromotionsIntegration.processPromotionExpiration(promotion.id);
          recordsProcessed++;
        } catch (error) {
          console.error(`Error processing expired promotion ${promotion.id}:`, error);
        }
      }

      return { recordsProcessed, metadata: { date: today } };
    } catch (error) {
      console.error('Error in processExpiredPromotions:', error);
      throw error;
    }
  }

  /**
   * Process scheduled posts
   */
  private static async processScheduledPosts(): Promise<any> {
    try {
      await FacebookAutoPostingService.processScheduledPosts();
      return { recordsProcessed: 1 };
    } catch (error) {
      console.error('Error in processScheduledPosts:', error);
      throw error;
    }
  }

  /**
   * Update post analytics
   */
  private static async updatePostAnalytics(): Promise<any> {
    try {
      const pages = await FacebookService.getPages();
      const activePages = pages.filter(page => page.status === 'active');

      let recordsProcessed = 0;

      for (const page of activePages) {
        try {
          const { data: posts } = await FacebookService.getPosts({
            pageId: page.id,
            status: 'published'
          });

          for (const post of posts || []) {
            if (post.facebook_post_id) {
              try {
                // Fetch analytics from Facebook API
                const insights = await FacebookService.getPostInsights(page.id, post.facebook_post_id);
                
                if (insights.success) {
                  await FacebookService.updatePage(post.id, {
                    reach: insights.data.reach || 0,
                    engagement: insights.data.engagement || 0,
                    likes: insights.data.likes || 0,
                    comments: insights.data.comments || 0,
                    shares: insights.data.shares || 0,
                    clicks: insights.data.clicks || 0
                  });
                  recordsProcessed++;
                }
              } catch (error) {
                console.error(`Error updating analytics for post ${post.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error updating analytics for page ${page.id}:`, error);
        }
      }

      return { recordsProcessed };
    } catch (error) {
      console.error('Error in updatePostAnalytics:', error);
      throw error;
    }
  }

  /**
   * Cleanup old data
   */
  private static async cleanupOldData(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let recordsProcessed = 0;

      // Cleanup old job history
      this.jobHistory = this.jobHistory.filter(job => 
        job.startTime > thirtyDaysAgo
      );

      // Cleanup old failed posts
      const pages = await FacebookService.getPages();
      for (const page of pages) {
        const { data: posts } = await FacebookService.getPosts({
          pageId: page.id,
          status: 'failed'
        });

        for (const post of posts || []) {
          if (new Date(post.created_at) < thirtyDaysAgo) {
            try {
              await FacebookService.deletePost(post.id);
              recordsProcessed++;
            } catch (error) {
              console.error(`Error cleaning up post ${post.id}:`, error);
            }
          }
        }
      }

      return { recordsProcessed, metadata: { cleanupDate: thirtyDaysAgo } };
    } catch (error) {
      console.error('Error in cleanupOldData:', error);
      throw error;
    }
  }

  /**
   * Get job execution history
   */
  static getJobHistory(limit: number = 50): JobExecutionResult[] {
    return this.jobHistory
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get job statistics
   */
  static getJobStatistics(): any {
    const history = this.jobHistory;
    const totalJobs = history.length;
    const successfulJobs = history.filter(job => job.success).length;
    const failedJobs = totalJobs - successfulJobs;
    const totalRecordsProcessed = history.reduce((sum, job) => sum + job.recordsProcessed, 0);
    const averageDuration = history.length > 0 
      ? history.reduce((sum, job) => sum + job.duration, 0) / history.length 
      : 0;

    return {
      totalJobs,
      successfulJobs,
      failedJobs,
      successRate: totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0,
      totalRecordsProcessed,
      averageDuration,
      isRunning: this.isRunning
    };
  }

  /**
   * Stop all scheduled jobs
   */
  static stopScheduledJobs(): void {
    this.isRunning = false;
    console.log('Facebook scheduled jobs stopped');
  }

  /**
   * Run a specific job manually
   */
  static async runJobManually(jobName: string): Promise<JobExecutionResult> {
    const jobFunctions: { [key: string]: () => Promise<any> } = {
      'process_new_promotions': this.processNewPromotions,
      'process_promotion_reminders': this.processPromotionReminders,
      'process_promotion_updates': this.processPromotionUpdates,
      'process_expired_promotions': this.processExpiredPromotions,
      'process_scheduled_posts': this.processScheduledPosts,
      'update_post_analytics': this.updatePostAnalytics,
      'cleanup_old_data': this.cleanupOldData
    };

    const jobFunction = jobFunctions[jobName];
    if (!jobFunction) {
      throw new Error(`Job not found: ${jobName}`);
    }

    return this.runJob(jobName, jobFunction);
  }
}

export default FacebookScheduledJobsService;
