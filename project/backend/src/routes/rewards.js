const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/rewards - Get all rewards with filtering and pagination
router.get('/', async (req, res) => {
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
    } = req.query;

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
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: rewards, error, count } = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch rewards',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: rewards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/rewards:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/rewards/:id - Get a specific reward
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ 
        success: false, 
        message: 'Reward not found',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: reward
    });
  } catch (error) {
    console.error('Error in GET /api/rewards/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/rewards - Create a new reward
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      condition_type,
      condition_value,
      status = 'active',
      priority = 'medium',
      start_date,
      end_date,
      max_usage,
      icon,
      color,
      conditions = []
    } = req.body;

    // Validate required fields
    if (!name || !type || !value || !condition_type || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, value, condition_type, start_date'
      });
    }

    // Create reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        name,
        description,
        type,
        value,
        condition_type,
        condition_value,
        status,
        priority,
        start_date,
        end_date,
        max_usage,
        icon,
        color,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (rewardError) {
      console.error('Error creating reward:', rewardError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create reward',
        error: rewardError.message 
      });
    }

    // Create reward conditions if provided
    if (conditions && conditions.length > 0) {
      const conditionData = conditions.map(condition => ({
        reward_id: reward.id,
        condition_type: condition.type,
        condition_value: condition.value,
        operator: condition.operator || 'equals'
      }));

      const { error: conditionsError } = await supabase
        .from('reward_conditions')
        .insert(conditionData);

      if (conditionsError) {
        console.error('Error creating reward conditions:', conditionsError);
        // Don't fail the request, just log the error
      }
    }

    res.status(201).json({
      success: true,
      data: reward,
      message: 'Reward created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/rewards:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/rewards/:id - Update a reward
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove conditions from update data as they're handled separately
    const { conditions, ...rewardData } = updateData;

    const { data: reward, error } = await supabase
      .from('rewards')
      .update(rewardData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update reward',
        error: error.message 
      });
    }

    // Update conditions if provided
    if (conditions) {
      // Delete existing conditions
      await supabase
        .from('reward_conditions')
        .delete()
        .eq('reward_id', id);

      // Insert new conditions
      if (conditions.length > 0) {
        const conditionData = conditions.map(condition => ({
          reward_id: id,
          condition_type: condition.type,
          condition_value: condition.value,
          operator: condition.operator || 'equals'
        }));

        await supabase
          .from('reward_conditions')
          .insert(conditionData);
      }
    }

    res.json({
      success: true,
      data: reward,
      message: 'Reward updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/rewards/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/rewards/:id - Delete a reward
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reward:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete reward',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/rewards/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/rewards/stats/overview - Get rewards statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('rewards')
      .select('status, type, priority, current_usage, max_usage');

    if (error) {
      console.error('Error fetching rewards stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch rewards statistics',
        error: error.message 
      });
    }

    const overview = {
      total: stats.length,
      active: stats.filter(r => r.status === 'active').length,
      inactive: stats.filter(r => r.status === 'inactive').length,
      expired: stats.filter(r => r.status === 'expired').length,
      byType: stats.reduce((acc, reward) => {
        acc[reward.type] = (acc[reward.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: stats.reduce((acc, reward) => {
        acc[reward.priority] = (acc[reward.priority] || 0) + 1;
        return acc;
      }, {}),
      totalUsage: stats.reduce((sum, reward) => sum + (reward.current_usage || 0), 0),
      maxUsage: stats.reduce((sum, reward) => sum + (reward.max_usage || 0), 0)
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error in GET /api/rewards/stats/overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/rewards/customer/:customerId - Get rewards for a specific customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: rewards, error } = await supabase
      .rpc('get_active_rewards_for_customer', { customer_uuid: customerId });

    if (error) {
      console.error('Error fetching customer rewards:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch customer rewards',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Error in GET /api/rewards/customer/:customerId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/rewards/:id/use - Use a reward for a customer
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, transactionId, metadata } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    // Check if customer has this reward
    const { data: customerReward, error: checkError } = await supabase
      .from('customer_rewards')
      .select('*')
      .eq('customer_id', customerId)
      .eq('reward_id', id)
      .eq('status', 'earned')
      .single();

    if (checkError || !customerReward) {
      return res.status(404).json({
        success: false,
        message: 'Customer does not have this reward'
      });
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
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to use reward',
        error: updateError.message 
      });
    }

    res.json({
      success: true,
      data: updatedReward,
      message: 'Reward used successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/rewards/:id/use:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/rewards/expire - Expire old rewards (admin only)
router.post('/expire', async (req, res) => {
  try {
    const { data: expiredCount, error } = await supabase
      .rpc('expire_old_rewards');

    if (error) {
      console.error('Error expiring rewards:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to expire rewards',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: { expired_count: expiredCount },
      message: `${expiredCount} rewards expired successfully`
    });
  } catch (error) {
    console.error('Error in POST /api/rewards/expire:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
