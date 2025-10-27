import { supabase } from './supabase';
import { RewardsService } from './rewardsService';
import { NotificationsService } from './notificationsService';

export interface SalesRewardIntegration {
  transactionId: string;
  customerId: string;
  branchId: string;
  cashierId: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  rewards: Array<{
    rewardId: string;
    rewardName: string;
    rewardType: string;
    rewardValue: number;
    applied: boolean;
    discountAmount?: number;
  }>;
  finalAmount: number;
  pointsEarned: number;
  pointsUsed: number;
}

export interface PWARewardIntegration {
  customerId: string;
  availableRewards: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    value: number;
    condition: string;
    expiresAt?: string;
  }>;
  customerPoints: number;
  loyaltyLevel: string;
  nextLevelPoints: number;
  recentRewards: Array<{
    id: string;
    name: string;
    earnedAt: string;
    usedAt?: string;
    status: string;
  }>;
}

export class SalesRewardsIntegration {
  /**
   * Process rewards for a sales transaction
   */
  static async processTransactionRewards(transactionData: {
    transactionId: string;
    customerId: string;
    branchId: string;
    cashierId: string;
    totalAmount: number;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }): Promise<SalesRewardIntegration> {
    try {
      const { transactionId, customerId, branchId, cashierId, totalAmount, items } = transactionData;

      // Get available rewards for the customer
      const availableRewards = await RewardsService.getCustomerRewards(customerId);
      
      // Get all active rewards that could apply
      const { data: allRewards } = await RewardsService.getRewards({
        status: 'active',
        limit: 100
      });

      const applicableRewards = [];
      let pointsEarned = 0;
      let pointsUsed = 0;
      let totalDiscount = 0;

      // Check each reward for eligibility
      for (const reward of allRewards.data || []) {
        const isEligible = await RewardsService.checkEligibility(reward.id, customerId);
        
        if (isEligible) {
          let applied = false;
          let discountAmount = 0;

          // Apply reward based on type
          if (reward.type === 'points') {
            // Award points
            await RewardsService.awardReward(reward.id, customerId, {
              transactionId,
              branchId,
              cashierId,
              totalAmount
            });
            pointsEarned += reward.value;
            applied = true;
          } else if (reward.type === 'discount') {
            // Apply discount
            discountAmount = (totalAmount * reward.value) / 100;
            totalDiscount += discountAmount;
            applied = true;
          } else if (reward.type === 'access') {
            // Grant access (no monetary value)
            applied = true;
          }

          applicableRewards.push({
            rewardId: reward.id,
            rewardName: reward.name,
            rewardType: reward.type,
            rewardValue: reward.value,
            applied,
            discountAmount
          });
        }
      }

      // Calculate final amount
      const finalAmount = totalAmount - totalDiscount;

      // Update transaction with reward information
      await this.updateTransactionWithRewards(transactionId, {
        rewards: applicableRewards,
        pointsEarned,
        pointsUsed,
        totalDiscount,
        finalAmount
      });

      // Send notification about rewards earned
      await this.sendRewardNotification(customerId, {
        transactionId,
        pointsEarned,
        rewardsEarned: applicableRewards.filter(r => r.applied).length,
        totalDiscount
      });

      return {
        transactionId,
        customerId,
        branchId,
        cashierId,
        totalAmount,
        items,
        rewards: applicableRewards,
        finalAmount,
        pointsEarned,
        pointsUsed
      };
    } catch (error) {
      console.error('Error processing transaction rewards:', error);
      throw error;
    }
  }

  /**
   * Update transaction with reward information
   */
  private static async updateTransactionWithRewards(transactionId: string, rewardData: {
    rewards: any[];
    pointsEarned: number;
    pointsUsed: number;
    totalDiscount: number;
    finalAmount: number;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('pos_transactions')
        .update({
          metadata: {
            rewards: rewardData.rewards,
            points_earned: rewardData.pointsEarned,
            points_used: rewardData.pointsUsed,
            total_discount: rewardData.totalDiscount,
            final_amount: rewardData.finalAmount
          }
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Error updating transaction with rewards:', error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateTransactionWithRewards:', error);
      throw error;
    }
  }

  /**
   * Send notification about rewards earned
   */
  private static async sendRewardNotification(customerId: string, rewardData: {
    transactionId: string;
    pointsEarned: number;
    rewardsEarned: number;
    totalDiscount: number;
  }): Promise<void> {
    try {
      if (rewardData.pointsEarned > 0 || rewardData.rewardsEarned > 0) {
        await NotificationsService.createNotification({
          title: 'Rewards Earned!',
          message: `You earned ${rewardData.pointsEarned} points and ${rewardData.rewardsEarned} rewards from your recent purchase.`,
          type: 'reward',
          channel: 'email',
          target_type: 'specific_customers',
          target_value: customerId,
          priority: 'medium',
          metadata: {
            transactionId: rewardData.transactionId,
            pointsEarned: rewardData.pointsEarned,
            rewardsEarned: rewardData.rewardsEarned,
            totalDiscount: rewardData.totalDiscount
          }
        });
      }
    } catch (error) {
      console.error('Error sending reward notification:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Use customer rewards in a transaction
   */
  static async useCustomerRewards(transactionId: string, customerId: string, rewardsToUse: Array<{
    rewardId: string;
    pointsToUse?: number;
  }>): Promise<{
    rewardsUsed: any[];
    totalDiscount: number;
    pointsUsed: number;
  }> {
    try {
      const rewardsUsed = [];
      let totalDiscount = 0;
      let pointsUsed = 0;

      for (const rewardUsage of rewardsToUse) {
        const reward = await RewardsService.getReward(rewardUsage.rewardId);
        
        if (reward.type === 'points' && rewardUsage.pointsToUse) {
          // Use points
          pointsUsed += rewardUsage.pointsToUse;
          // Convert points to discount (1 point = 1 peso)
          totalDiscount += rewardUsage.pointsToUse;
        } else if (reward.type === 'discount') {
          // Use discount reward
          await RewardsService.useReward(reward.id, customerId, transactionId);
          // Calculate discount amount based on transaction total
          const { data: transaction } = await supabase
            .from('pos_transactions')
            .select('total_amount')
            .eq('id', transactionId)
            .single();
          
          if (transaction) {
            const discountAmount = (transaction.total_amount * reward.value) / 100;
            totalDiscount += discountAmount;
          }
        }

        rewardsUsed.push({
          rewardId: reward.id,
          rewardName: reward.name,
          rewardType: reward.type,
          value: reward.type === 'points' ? rewardUsage.pointsToUse : reward.value,
          discountAmount: reward.type === 'discount' ? totalDiscount : rewardUsage.pointsToUse
        });
      }

      return {
        rewardsUsed,
        totalDiscount,
        pointsUsed
      };
    } catch (error) {
      console.error('Error using customer rewards:', error);
      throw error;
    }
  }

  /**
   * Get customer loyalty information
   */
  static async getCustomerLoyaltyInfo(customerId: string): Promise<{
    totalPoints: number;
    loyaltyLevel: string;
    nextLevelPoints: number;
    availableRewards: number;
    recentTransactions: number;
  }> {
    try {
      // Get customer rewards
      const customerRewards = await RewardsService.getCustomerRewards(customerId);
      
      // Calculate total points
      const totalPoints = customerRewards
        .filter(r => r.reward_type === 'points' && r.status === 'earned')
        .reduce((sum, r) => sum + r.reward_value, 0);

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('pos_transactions')
        .select('id, total_amount, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      const recentTransactions = transactions?.length || 0;

      // Calculate loyalty level based on total points
      let loyaltyLevel = 'Bronze';
      let nextLevelPoints = 100;

      if (totalPoints >= 1000) {
        loyaltyLevel = 'Gold';
        nextLevelPoints = 0;
      } else if (totalPoints >= 500) {
        loyaltyLevel = 'Silver';
        nextLevelPoints = 1000;
      } else {
        nextLevelPoints = 500;
      }

      return {
        totalPoints,
        loyaltyLevel,
        nextLevelPoints,
        availableRewards: customerRewards.length,
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting customer loyalty info:', error);
      throw error;
    }
  }

  /**
   * Get rewards analytics for sales
   */
  static async getRewardsAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
  } = {}): Promise<{
    totalRewardsGiven: number;
    totalPointsEarned: number;
    totalDiscountGiven: number;
    topRewards: Array<{
      rewardId: string;
      rewardName: string;
      usageCount: number;
    }>;
    rewardsByBranch: Array<{
      branchId: string;
      branchName: string;
      rewardsGiven: number;
      pointsEarned: number;
    }>;
  }> {
    try {
      const { startDate, endDate, branchId } = filters;

      // Get reward usage data
      let query = supabase
        .from('customer_rewards')
        .select(`
          *,
          rewards(name, type, value),
          pos_transactions(branch_id, total_amount)
        `);

      if (startDate) {
        query = query.gte('earned_at', startDate);
      }
      if (endDate) {
        query = query.lte('earned_at', endDate);
      }

      const { data: rewardData, error } = await query;

      if (error) {
        console.error('Error fetching rewards analytics:', error);
        throw new Error(`Failed to fetch rewards analytics: ${error.message}`);
      }

      const totalRewardsGiven = rewardData?.length || 0;
      const totalPointsEarned = rewardData
        ?.filter(r => r.rewards?.type === 'points')
        .reduce((sum, r) => sum + (r.rewards?.value || 0), 0) || 0;

      const totalDiscountGiven = rewardData
        ?.filter(r => r.rewards?.type === 'discount')
        .reduce((sum, r) => {
          const transaction = r.pos_transactions;
          if (transaction) {
            return sum + ((transaction.total_amount * (r.rewards?.value || 0)) / 100);
          }
          return sum;
        }, 0) || 0;

      // Get top rewards
      const rewardUsage = rewardData?.reduce((acc, r) => {
        const rewardId = r.reward_id;
        if (!acc[rewardId]) {
          acc[rewardId] = {
            rewardId,
            rewardName: r.rewards?.name || 'Unknown',
            usageCount: 0
          };
        }
        acc[rewardId].usageCount++;
        return acc;
      }, {} as { [key: string]: any }) || {};

      const topRewards = Object.values(rewardUsage)
        .sort((a: any, b: any) => b.usageCount - a.usageCount)
        .slice(0, 10);

      // Get rewards by branch
      const branchRewards = rewardData?.reduce((acc, r) => {
        const branchId = r.pos_transactions?.branch_id;
        if (branchId) {
          if (!acc[branchId]) {
            acc[branchId] = {
              branchId,
              branchName: `Branch ${branchId}`,
              rewardsGiven: 0,
              pointsEarned: 0
            };
          }
          acc[branchId].rewardsGiven++;
          if (r.rewards?.type === 'points') {
            acc[branchId].pointsEarned += r.rewards.value || 0;
          }
        }
        return acc;
      }, {} as { [key: string]: any }) || {};

      const rewardsByBranch = Object.values(branchRewards);

      return {
        totalRewardsGiven,
        totalPointsEarned,
        totalDiscountGiven,
        topRewards,
        rewardsByBranch
      };
    } catch (error) {
      console.error('Error in getRewardsAnalytics:', error);
      throw error;
    }
  }
}

export default SalesRewardsIntegration;
