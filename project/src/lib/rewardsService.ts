import { supabase } from './supabase';

export interface Reward {
  id: string;
  name: string;
  description?: string;
  type: 'points' | 'discount' | 'access' | 'gift' | 'voucher';
  value: number;
  condition_type: 'first_purchase' | 'loyalty_level' | 'referral' | 'birthday' | 'vip_member' | 'custom';
  condition_value?: string;
  status: 'active' | 'inactive' | 'expired' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  end_date?: string;
  max_usage?: number;
  current_usage: number;
  icon?: string;
  color?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RewardCondition {
  id: string;
  reward_id: string;
  condition_type: string;
  condition_value: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  created_at: string;
}

export interface CustomerReward {
  id: string;
  customer_id: string;
  reward_id: string;
  earned_at: string;
  used_at?: string;
  status: 'earned' | 'used' | 'expired' | 'cancelled';
  transaction_id?: string;
  metadata?: any;
  created_at: string;
}

export interface RewardStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  byType: { [key: string]: number };
  byPriority: { [key: string]: number };
  totalUsage: number;
  maxUsage: number;
}

export interface RewardFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class RewardsService {
  /**
   * Get all rewards with filtering and pagination
   */
  static async getRewards(filters: RewardFilters = {}): Promise<{ data: Reward[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        priority,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let query = supabase
        .from('rewards')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: rewards, error, count } = await query;

      if (error) {
        console.error('Error fetching rewards:', error);
        throw new Error(`Failed to fetch rewards: ${error.message}`);
      }

      return {
        data: rewards || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getRewards:', error);
      throw error;
    }
  }

  /**
   * Get a specific reward by ID
   */
  static async getReward(id: string): Promise<Reward> {
    try {
      const { data: reward, error } = await supabase
        .from('rewards')
        .select(`
          *,
          reward_conditions(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching reward:', error);
        throw new Error(`Failed to fetch reward: ${error.message}`);
      }

      return reward;
    } catch (error) {
      console.error('Error in getReward:', error);
      throw error;
    }
  }

  /**
   * Create a new reward
   */
  static async createReward(rewardData: Partial<Reward>): Promise<Reward> {
    try {
      const { data: reward, error } = await supabase
        .from('rewards')
        .insert(rewardData)
        .select()
        .single();

      if (error) {
        console.error('Error creating reward:', error);
        throw new Error(`Failed to create reward: ${error.message}`);
      }

      return reward;
    } catch (error) {
      console.error('Error in createReward:', error);
      throw error;
    }
  }

  /**
   * Update a reward
   */
  static async updateReward(id: string, updateData: Partial<Reward>): Promise<Reward> {
    try {
      const { data: reward, error } = await supabase
        .from('rewards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating reward:', error);
        throw new Error(`Failed to update reward: ${error.message}`);
      }

      return reward;
    } catch (error) {
      console.error('Error in updateReward:', error);
      throw error;
    }
  }

  /**
   * Delete a reward
   */
  static async deleteReward(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting reward:', error);
        throw new Error(`Failed to delete reward: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteReward:', error);
      throw error;
    }
  }

  /**
   * Get rewards statistics
   */
  static async getRewardStats(): Promise<RewardStats> {
    try {
      const { data: stats, error } = await supabase
        .from('rewards')
        .select('status, type, priority, current_usage, max_usage');

      if (error) {
        console.error('Error fetching reward stats:', error);
        throw new Error(`Failed to fetch reward statistics: ${error.message}`);
      }

      const overview = {
        total: stats?.length || 0,
        active: stats?.filter(r => r.status === 'active').length || 0,
        inactive: stats?.filter(r => r.status === 'inactive').length || 0,
        expired: stats?.filter(r => r.status === 'expired').length || 0,
        byType: stats?.reduce((acc, reward) => {
          acc[reward.type] = (acc[reward.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        byPriority: stats?.reduce((acc, reward) => {
          acc[reward.priority] = (acc[reward.priority] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        totalUsage: stats?.reduce((sum, reward) => sum + (reward.current_usage || 0), 0) || 0,
        maxUsage: stats?.reduce((sum, reward) => sum + (reward.max_usage || 0), 0) || 0
      };

      return overview;
    } catch (error) {
      console.error('Error in getRewardStats:', error);
      throw error;
    }
  }

  /**
   * Get active rewards for a customer
   */
  static async getCustomerRewards(customerId: string): Promise<any[]> {
    try {
      const { data: rewards, error } = await supabase
        .rpc('get_active_rewards_for_customer', { customer_uuid: customerId });

      if (error) {
        console.error('Error fetching customer rewards:', error);
        throw new Error(`Failed to fetch customer rewards: ${error.message}`);
      }

      return rewards || [];
    } catch (error) {
      console.error('Error in getCustomerRewards:', error);
      throw error;
    }
  }

  /**
   * Use a reward for a customer
   */
  static async useReward(rewardId: string, customerId: string, transactionId?: string, metadata?: any): Promise<CustomerReward> {
    try {
      // Check if customer has this reward
      const { data: customerReward, error: checkError } = await supabase
        .from('customer_rewards')
        .select('*')
        .eq('customer_id', customerId)
        .eq('reward_id', rewardId)
        .eq('status', 'earned')
        .single();

      if (checkError || !customerReward) {
        throw new Error('Customer does not have this reward');
      }

      // Update customer reward status
      const { data: updatedReward, error: updateError } = await supabase
        .from('customer_rewards')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          transaction_id: transactionId,
          metadata: metadata
        })
        .eq('id', customerReward.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error using reward:', updateError);
        throw new Error(`Failed to use reward: ${updateError.message}`);
      }

      return updatedReward;
    } catch (error) {
      console.error('Error in useReward:', error);
      throw error;
    }
  }

  /**
   * Award a reward to a customer
   */
  static async awardReward(rewardId: string, customerId: string, metadata?: any): Promise<CustomerReward> {
    try {
      const { data: customerReward, error } = await supabase
        .from('customer_rewards')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          status: 'earned',
          metadata: metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Error awarding reward:', error);
        throw new Error(`Failed to award reward: ${error.message}`);
      }

      return customerReward;
    } catch (error) {
      console.error('Error in awardReward:', error);
      throw error;
    }
  }

  /**
   * Check if a customer is eligible for a reward
   */
  static async checkEligibility(rewardId: string, customerId: string): Promise<boolean> {
    try {
      const reward = await this.getReward(rewardId);
      
      // Check if reward is active
      if (reward.status !== 'active') {
        return false;
      }

      // Check date range
      const now = new Date();
      if (reward.start_date && new Date(reward.start_date) > now) {
        return false;
      }
      if (reward.end_date && new Date(reward.end_date) < now) {
        return false;
      }

      // Check usage limits
      if (reward.max_usage && reward.current_usage >= reward.max_usage) {
        return false;
      }

      // Check if customer already has this reward
      const { data: existingReward } = await supabase
        .from('customer_rewards')
        .select('id')
        .eq('customer_id', customerId)
        .eq('reward_id', rewardId)
        .eq('status', 'earned')
        .single();

      if (existingReward) {
        return false;
      }

      // Additional eligibility checks based on condition_type
      // This would be implemented based on your business logic
      
      return true;
    } catch (error) {
      console.error('Error in checkEligibility:', error);
      return false;
    }
  }

  /**
   * Expire old rewards
   */
  static async expireOldRewards(): Promise<number> {
    try {
      const { data: expiredCount, error } = await supabase
        .rpc('expire_old_rewards');

      if (error) {
        console.error('Error expiring rewards:', error);
        throw new Error(`Failed to expire rewards: ${error.message}`);
      }

      return expiredCount || 0;
    } catch (error) {
      console.error('Error in expireOldRewards:', error);
      throw error;
    }
  }

  /**
   * Get reward conditions
   */
  static async getRewardConditions(rewardId: string): Promise<RewardCondition[]> {
    try {
      const { data: conditions, error } = await supabase
        .from('reward_conditions')
        .select('*')
        .eq('reward_id', rewardId);

      if (error) {
        console.error('Error fetching reward conditions:', error);
        throw new Error(`Failed to fetch reward conditions: ${error.message}`);
      }

      return conditions || [];
    } catch (error) {
      console.error('Error in getRewardConditions:', error);
      throw error;
    }
  }

  /**
   * Create reward conditions
   */
  static async createRewardConditions(rewardId: string, conditions: Partial<RewardCondition>[]): Promise<RewardCondition[]> {
    try {
      const conditionData = conditions.map(condition => ({
        reward_id: rewardId,
        condition_type: condition.condition_type,
        condition_value: condition.condition_value,
        operator: condition.operator || 'equals'
      }));

      const { data: createdConditions, error } = await supabase
        .from('reward_conditions')
        .insert(conditionData)
        .select();

      if (error) {
        console.error('Error creating reward conditions:', error);
        throw new Error(`Failed to create reward conditions: ${error.message}`);
      }

      return createdConditions || [];
    } catch (error) {
      console.error('Error in createRewardConditions:', error);
      throw error;
    }
  }
}

export default RewardsService;
