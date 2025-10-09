import { supabase } from './supabase';

/**
 * Scheduled Jobs Service
 * Handles automated tasks for the marketing module
 */
export class ScheduledJobsService {
  /**
   * Update expired promotions status
   * This should be called daily via a cron job or scheduled task
   */
  static async updateExpiredPromotions(): Promise<{
    success: boolean;
    updatedCount: number;
    message: string;
  }> {
    try {
      console.log('Starting expired promotions update job...');
      
      const { data: updatedCount, error } = await supabase
        .rpc('update_expired_promotions');

      if (error) {
        console.error('Error updating expired promotions:', error);
        return {
          success: false,
          updatedCount: 0,
          message: `Failed to update expired promotions: ${error.message}`
        };
      }

      console.log(`Successfully updated ${updatedCount} expired promotions`);
      
      return {
        success: true,
        updatedCount: updatedCount || 0,
        message: `Successfully updated ${updatedCount || 0} expired promotions`
      };
    } catch (error) {
      console.error('Error in updateExpiredPromotions:', error);
      return {
        success: false,
        updatedCount: 0,
        message: `Error updating expired promotions: ${error.message}`
      };
    }
  }

  /**
   * Update promotion statuses based on current date
   * This ensures promotions are marked as active/upcoming/expired correctly
   */
  static async updatePromotionStatuses(): Promise<{
    success: boolean;
    updatedCount: number;
    message: string;
  }> {
    try {
      console.log('Starting promotion status update job...');
      
      const now = new Date().toISOString().split('T')[0];
      
      // Update expired promotions
      const { data: expiredData, error: expiredError } = await supabase
        .from('promotions')
        .update({ status: 'expired' })
        .lt('end_date', now)
        .neq('status', 'expired')
        .select('id');

      if (expiredError) {
        console.error('Error updating expired promotions:', expiredError);
        return {
          success: false,
          updatedCount: 0,
          message: `Failed to update expired promotions: ${expiredError.message}`
        };
      }

      // Update active promotions
      const { data: activeData, error: activeError } = await supabase
        .from('promotions')
        .update({ status: 'active' })
        .lte('start_date', now)
        .gte('end_date', now)
        .neq('status', 'active')
        .select('id');

      if (activeError) {
        console.error('Error updating active promotions:', activeError);
        return {
          success: false,
          updatedCount: 0,
          message: `Failed to update active promotions: ${activeError.message}`
        };
      }

      const totalUpdated = (expiredData?.length || 0) + (activeData?.length || 0);
      
      console.log(`Successfully updated ${totalUpdated} promotion statuses`);
      
      return {
        success: true,
        updatedCount: totalUpdated,
        message: `Successfully updated ${totalUpdated} promotion statuses`
      };
    } catch (error) {
      console.error('Error in updatePromotionStatuses:', error);
      return {
        success: false,
        updatedCount: 0,
        message: `Error updating promotion statuses: ${error.message}`
      };
    }
  }

  /**
   * Clean up old expired promotions (optional)
   * This removes promotions that have been expired for more than 30 days
   */
  static async cleanupOldPromotions(daysOld: number = 30): Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }> {
    try {
      console.log(`Starting cleanup of promotions expired more than ${daysOld} days ago...`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];
      
      const { data: deletedData, error } = await supabase
        .from('promotions')
        .delete()
        .lt('end_date', cutoffDateString)
        .eq('status', 'expired')
        .select('id');

      if (error) {
        console.error('Error cleaning up old promotions:', error);
        return {
          success: false,
          deletedCount: 0,
          message: `Failed to cleanup old promotions: ${error.message}`
        };
      }

      const deletedCount = deletedData?.length || 0;
      console.log(`Successfully deleted ${deletedCount} old promotions`);
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} old promotions`
      };
    } catch (error) {
      console.error('Error in cleanupOldPromotions:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error cleaning up old promotions: ${error.message}`
      };
    }
  }

  /**
   * Generate promotion analytics report
   * This creates a daily summary of promotion performance
   */
  static async generatePromotionReport(): Promise<{
    success: boolean;
    report: any;
    message: string;
  }> {
    try {
      console.log('Generating promotion analytics report...');
      
      const { data: stats, error } = await supabase
        .rpc('get_promotion_stats');

      if (error) {
        console.error('Error generating promotion report:', error);
        return {
          success: false,
          report: null,
          message: `Failed to generate promotion report: ${error.message}`
        };
      }

      const report = {
        generatedAt: new Date().toISOString(),
        statistics: stats?.[0] || {},
        summary: {
          totalPromotions: stats?.[0]?.total_promotions || 0,
          activePromotions: stats?.[0]?.active_promotions || 0,
          totalUsage: stats?.[0]?.total_uses || 0
        }
      };

      console.log('Successfully generated promotion report');
      
      return {
        success: true,
        report,
        message: 'Successfully generated promotion report'
      };
    } catch (error) {
      console.error('Error in generatePromotionReport:', error);
      return {
        success: false,
        report: null,
        message: `Error generating promotion report: ${error.message}`
      };
    }
  }

  /**
   * Run all scheduled jobs
   * This is the main function to call for daily maintenance
   */
  static async runDailyJobs(): Promise<{
    success: boolean;
    results: Array<{
      job: string;
      success: boolean;
      message: string;
    }>;
  }> {
    try {
      console.log('Starting daily scheduled jobs...');
      
      const results = [];
      
      // Update promotion statuses
      const statusUpdate = await this.updatePromotionStatuses();
      results.push({
        job: 'updatePromotionStatuses',
        success: statusUpdate.success,
        message: statusUpdate.message
      });
      
      // Update expired promotions
      const expiredUpdate = await this.updateExpiredPromotions();
      results.push({
        job: 'updateExpiredPromotions',
        success: expiredUpdate.success,
        message: expiredUpdate.message
      });
      
      // Generate daily report
      const report = await this.generatePromotionReport();
      results.push({
        job: 'generatePromotionReport',
        success: report.success,
        message: report.message
      });
      
      const allSuccessful = results.every(result => result.success);
      
      console.log('Daily scheduled jobs completed');
      
      return {
        success: allSuccessful,
        results
      };
    } catch (error) {
      console.error('Error in runDailyJobs:', error);
      return {
        success: false,
        results: [{
          job: 'runDailyJobs',
          success: false,
          message: `Error running daily jobs: ${error.message}`
        }]
      };
    }
  }

  /**
   * Run weekly maintenance jobs
   */
  static async runWeeklyJobs(): Promise<{
    success: boolean;
    results: Array<{
      job: string;
      success: boolean;
      message: string;
    }>;
  }> {
    try {
      console.log('Starting weekly scheduled jobs...');
      
      const results = [];
      
      // Clean up old promotions
      const cleanup = await this.cleanupOldPromotions(30);
      results.push({
        job: 'cleanupOldPromotions',
        success: cleanup.success,
        message: cleanup.message
      });
      
      const allSuccessful = results.every(result => result.success);
      
      console.log('Weekly scheduled jobs completed');
      
      return {
        success: allSuccessful,
        results
      };
    } catch (error) {
      console.error('Error in runWeeklyJobs:', error);
      return {
        success: false,
        results: [{
          job: 'runWeeklyJobs',
          success: false,
          message: `Error running weekly jobs: ${error.message}`
        }]
      };
    }
  }
}

export default ScheduledJobsService;
