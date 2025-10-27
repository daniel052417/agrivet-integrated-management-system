import { supabase } from './supabase';
import { RewardsService } from './rewardsService';
import { NotificationsService } from './notificationsService';

export interface PWAReward {
  id: string;
  name: string;
  description: string;
  type: 'points' | 'discount' | 'access' | 'gift' | 'voucher';
  value: number;
  condition: string;
  expiresAt?: string;
  icon?: string;
  color?: string;
  isEligible: boolean;
  requirements?: string;
}

export interface PWACustomerProfile {
  customerId: string;
  totalPoints: number;
  loyaltyLevel: string;
  nextLevelPoints: number;
  availableRewards: PWAReward[];
  recentRewards: Array<{
    id: string;
    name: string;
    earnedAt: string;
    usedAt?: string;
    status: string;
  }>;
  loyaltyProgress: {
    currentLevel: string;
    nextLevel: string;
    progressPercentage: number;
    pointsNeeded: number;
  };
}

export interface PWANotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  expiresAt?: string;
  isRead: boolean;
}

export class PWARewardsIntegration {
  /**
   * Get customer profile with rewards information
   */
  static async getCustomerProfile(customerId: string): Promise<PWACustomerProfile> {
    try {
      // Get customer rewards
      const customerRewards = await RewardsService.getCustomerRewards(customerId);
      
      // Get all available rewards
      const { data: allRewards } = await RewardsService.getRewards({
        status: 'active',
        limit: 100
      });

      // Calculate total points
      const totalPoints = customerRewards
        .filter(r => r.reward_type === 'points' && r.status === 'earned')
        .reduce((sum, r) => sum + r.reward_value, 0);

      // Calculate loyalty level
      const loyaltyInfo = this.calculateLoyaltyLevel(totalPoints);

      // Get available rewards for customer
      const availableRewards: PWAReward[] = [];
      
      for (const reward of allRewards.data || []) {
        const isEligible = await RewardsService.checkEligibility(reward.id, customerId);
        
        availableRewards.push({
          id: reward.id,
          name: reward.name,
          description: reward.description || '',
          type: reward.type,
          value: reward.value,
          condition: reward.condition_type,
          expiresAt: reward.end_date,
          icon: reward.icon,
          color: reward.color,
          isEligible,
          requirements: this.getRewardRequirements(reward)
        });
      }

      // Get recent rewards
      const recentRewards = customerRewards
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          name: r.reward_id, // This would need to be joined with rewards table
          earnedAt: r.earned_at,
          usedAt: r.used_at,
          status: r.status
        }));

      return {
        customerId,
        totalPoints,
        loyaltyLevel: loyaltyInfo.level,
        nextLevelPoints: loyaltyInfo.nextLevelPoints,
        availableRewards,
        recentRewards,
        loyaltyProgress: {
          currentLevel: loyaltyInfo.level,
          nextLevel: loyaltyInfo.nextLevel,
          progressPercentage: loyaltyInfo.progressPercentage,
          pointsNeeded: loyaltyInfo.pointsNeeded
        }
      };
    } catch (error) {
      console.error('Error getting customer profile:', error);
      throw error;
    }
  }

  /**
   * Calculate loyalty level based on points
   */
  private static calculateLoyaltyLevel(totalPoints: number): {
    level: string;
    nextLevel: string;
    nextLevelPoints: number;
    progressPercentage: number;
    pointsNeeded: number;
  } {
    if (totalPoints >= 1000) {
      return {
        level: 'Gold',
        nextLevel: 'Platinum',
        nextLevelPoints: 2000,
        progressPercentage: Math.min(100, ((totalPoints - 1000) / 1000) * 100),
        pointsNeeded: Math.max(0, 2000 - totalPoints)
      };
    } else if (totalPoints >= 500) {
      return {
        level: 'Silver',
        nextLevel: 'Gold',
        nextLevelPoints: 1000,
        progressPercentage: ((totalPoints - 500) / 500) * 100,
        pointsNeeded: 1000 - totalPoints
      };
    } else {
      return {
        level: 'Bronze',
        nextLevel: 'Silver',
        nextLevelPoints: 500,
        progressPercentage: (totalPoints / 500) * 100,
        pointsNeeded: 500 - totalPoints
      };
    }
  }

  /**
   * Get reward requirements description
   */
  private static getRewardRequirements(reward: any): string {
    switch (reward.condition_type) {
      case 'first_purchase':
        return 'First purchase required';
      case 'loyalty_level':
        return `Loyalty level: ${reward.condition_value}`;
      case 'referral':
        return 'Refer a friend';
      case 'birthday':
        return 'Birthday month';
      case 'vip_member':
        return 'VIP membership required';
      default:
        return 'Check eligibility';
    }
  }

  /**
   * Get available rewards for PWA display
   */
  static async getAvailableRewards(customerId: string, filters: {
    type?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<{
    rewards: PWAReward[];
    totalCount: number;
  }> {
    try {
      const { type, category, limit = 20 } = filters;

      let query = supabase
        .from('rewards')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      if (type) {
        query = query.eq('type', type);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: rewards, error, count } = await query;

      if (error) {
        console.error('Error fetching available rewards:', error);
        throw new Error(`Failed to fetch available rewards: ${error.message}`);
      }

      const availableRewards: PWAReward[] = [];

      for (const reward of rewards || []) {
        const isEligible = await RewardsService.checkEligibility(reward.id, customerId);
        
        availableRewards.push({
          id: reward.id,
          name: reward.name,
          description: reward.description || '',
          type: reward.type,
          value: reward.value,
          condition: reward.condition_type,
          expiresAt: reward.end_date,
          icon: reward.icon,
          color: reward.color,
          isEligible,
          requirements: this.getRewardRequirements(reward)
        });
      }

      return {
        rewards: availableRewards,
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error in getAvailableRewards:', error);
      throw error;
    }
  }

  /**
   * Claim a reward
   */
  static async claimReward(customerId: string, rewardId: string): Promise<{
    success: boolean;
    message: string;
    reward?: any;
  }> {
    try {
      // Check eligibility
      const isEligible = await RewardsService.checkEligibility(rewardId, customerId);
      
      if (!isEligible) {
        return {
          success: false,
          message: 'You are not eligible for this reward'
        };
      }

      // Award the reward
      const reward = await RewardsService.awardReward(rewardId, customerId, {
        claimedAt: new Date().toISOString(),
        source: 'pwa'
      });

      // Send notification
      await this.sendRewardClaimedNotification(customerId, reward);

      return {
        success: true,
        message: 'Reward claimed successfully!',
        reward
      };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return {
        success: false,
        message: 'Failed to claim reward. Please try again.'
      };
    }
  }

  /**
   * Send notification when reward is claimed
   */
  private static async sendRewardClaimedNotification(customerId: string, reward: any): Promise<void> {
    try {
      await NotificationsService.createNotification({
        title: 'Reward Claimed!',
        message: `You have successfully claimed: ${reward.name}`,
        type: 'reward',
        channel: 'in_app',
        target_type: 'specific_customers',
        target_value: customerId,
        priority: 'medium',
        metadata: {
          rewardId: reward.id,
          rewardName: reward.name,
          claimedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending reward claimed notification:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get customer notifications
   */
  static async getCustomerNotifications(customerId: string, filters: {
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{
    notifications: PWANotification[];
    totalCount: number;
    unreadCount: number;
  }> {
    try {
      const { limit = 20, unreadOnly = false } = filters;

      let query = supabase
        .from('notifications')
        .select(`
          *,
          notification_deliveries!inner(
            status,
            opened_at,
            clicked_at
          )
        `, { count: 'exact' })
        .eq('target_type', 'specific_customers')
        .eq('target_value', customerId)
        .eq('status', 'sent');

      if (unreadOnly) {
        query = query.is('notification_deliveries.opened_at', null);
      }

      query = query.order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: notifications, error, count } = await query;

      if (error) {
        console.error('Error fetching customer notifications:', error);
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      const pwaNotifications: PWANotification[] = (notifications || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority,
        actionUrl: n.metadata?.actionUrl,
        expiresAt: n.metadata?.expiresAt,
        isRead: n.notification_deliveries?.[0]?.opened_at !== null
      }));

      const unreadCount = pwaNotifications.filter(n => !n.isRead).length;

      return {
        notifications: pwaNotifications,
        totalCount: count || 0,
        unreadCount
      };
    } catch (error) {
      console.error('Error in getCustomerNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string, customerId: string): Promise<void> {
    try {
      // Update delivery status
      const { data: delivery } = await supabase
        .from('notification_deliveries')
        .select('id')
        .eq('notification_id', notificationId)
        .eq('customer_id', customerId)
        .single();

      if (delivery) {
        await NotificationsService.updateDeliveryStatus(delivery.id, 'opened');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get loyalty program information
   */
  static async getLoyaltyProgramInfo(): Promise<{
    levels: Array<{
      name: string;
      minPoints: number;
      benefits: string[];
      color: string;
    }>;
    currentLevel: string;
    nextLevel: string;
    progressPercentage: number;
  }> {
    try {
      const levels = [
        {
          name: 'Bronze',
          minPoints: 0,
          benefits: ['Basic rewards', 'Email notifications'],
          color: '#CD7F32'
        },
        {
          name: 'Silver',
          minPoints: 500,
          benefits: ['Enhanced rewards', 'Priority support', 'Birthday specials'],
          color: '#C0C0C0'
        },
        {
          name: 'Gold',
          minPoints: 1000,
          benefits: ['Premium rewards', 'VIP access', 'Exclusive offers', 'Personal manager'],
          color: '#FFD700'
        },
        {
          name: 'Platinum',
          minPoints: 2000,
          benefits: ['Ultimate rewards', 'Concierge service', 'Custom offers', 'Early access'],
          color: '#E5E4E2'
        }
      ];

      return {
        levels,
        currentLevel: 'Bronze', // This would be calculated based on customer points
        nextLevel: 'Silver',
        progressPercentage: 0 // This would be calculated based on customer points
      };
    } catch (error) {
      console.error('Error getting loyalty program info:', error);
      throw error;
    }
  }

  /**
   * Get reward history for customer
   */
  static async getRewardHistory(customerId: string, filters: {
    limit?: number;
    type?: string;
    status?: string;
  } = {}): Promise<{
    history: Array<{
      id: string;
      rewardName: string;
      rewardType: string;
      value: number;
      earnedAt: string;
      usedAt?: string;
      status: string;
      transactionId?: string;
    }>;
    totalCount: number;
  }> {
    try {
      const { limit = 50, type, status } = filters;

      let query = supabase
        .from('customer_rewards')
        .select(`
          *,
          rewards(name, type, value)
        `, { count: 'exact' })
        .eq('customer_id', customerId);

      if (type) {
        query = query.eq('rewards.type', type);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('earned_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: history, error, count } = await query;

      if (error) {
        console.error('Error fetching reward history:', error);
        throw new Error(`Failed to fetch reward history: ${error.message}`);
      }

      const rewardHistory = (history || []).map(h => ({
        id: h.id,
        rewardName: h.rewards?.name || 'Unknown Reward',
        rewardType: h.rewards?.type || 'unknown',
        value: h.rewards?.value || 0,
        earnedAt: h.earned_at,
        usedAt: h.used_at,
        status: h.status,
        transactionId: h.transaction_id
      }));

      return {
        history: rewardHistory,
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error in getRewardHistory:', error);
      throw error;
    }
  }

  /**
   * Send push notification to PWA
   */
  static async sendPushNotification(customerId: string, notification: {
    title: string;
    message: string;
    type: string;
    data?: any;
  }): Promise<void> {
    try {
      await NotificationsService.createNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        channel: 'push',
        target_type: 'specific_customers',
        target_value: customerId,
        priority: 'medium',
        metadata: {
          ...notification.data,
          pushNotification: true
        }
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }
}

export default PWARewardsIntegration;
