const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/notifications - Get all notifications with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      channel, 
      priority,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notifications',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/notifications/:id - Get a specific notification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: notification, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_templates(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching notification:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      channel,
      target_type,
      target_value,
      scheduled_at,
      priority = 'medium',
      template_id,
      campaign_id,
      metadata
    } = req.body;

    // Validate required fields
    if (!title || !message || !type || !channel || !target_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, message, type, channel, target_type'
      });
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        channel,
        target_type,
        target_value,
        scheduled_at,
        priority,
        template_id,
        campaign_id,
        metadata,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create notification',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/notifications/:id - Update a notification
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update notification',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/notifications/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete notification',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/notifications/:id/send - Send a notification
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;

    // Update notification status to sent
    const { data: notification, error: updateError } = await supabase
      .from('notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating notification status:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification',
        error: updateError.message 
      });
    }

    // Here you would implement the actual sending logic
    // For now, we'll just simulate it
    console.log(`Sending notification ${id} via ${notification.channel}`);

    res.json({
      success: true,
      data: notification,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/:id/send:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/notifications/:id/stats - Get notification statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: stats, error } = await supabase
      .rpc('get_notification_stats', { notification_uuid: id });

    if (error) {
      console.error('Error fetching notification stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notification statistics',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: stats[0] || {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        open_rate: 0,
        click_rate: 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/:id/stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/notifications/stats/overview - Get notifications overview statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('notifications')
      .select('status, type, channel, priority, sent_at');

    if (error) {
      console.error('Error fetching notifications stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notifications statistics',
        error: error.message 
      });
    }

    const overview = {
      total: stats.length,
      sent: stats.filter(n => n.status === 'sent').length,
      scheduled: stats.filter(n => n.status === 'scheduled').length,
      failed: stats.filter(n => n.status === 'failed').length,
      byType: stats.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {}),
      byChannel: stats.reduce((acc, notification) => {
        acc[notification.channel] = (acc[notification.channel] || 0) + 1;
        return acc;
      }, {}),
      byPriority: stats.reduce((acc, notification) => {
        acc[notification.priority] = (acc[notification.priority] || 0) + 1;
        return acc;
      }, {}),
      sentToday: stats.filter(n => 
        n.sent_at && new Date(n.sent_at).toDateString() === new Date().toDateString()
      ).length
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/stats/overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/notifications/templates - Get notification templates
router.get('/templates', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      category, 
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabase
      .from('notification_templates')
      .select('*', { count: 'exact' });

    // Apply filters
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
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch templates',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/notifications/templates - Create a notification template
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      subject,
      content,
      type,
      category,
      status = 'active',
      variables,
      created_by
    } = req.body;

    // Validate required fields
    if (!name || !content || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, content, type, category'
      });
    }

    const { data: template, error } = await supabase
      .from('notification_templates')
      .insert({
        name,
        subject,
        content,
        type,
        category,
        status,
        variables,
        created_by: created_by || req.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create template',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/notifications/templates/:id - Update a notification template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: template, error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update template',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/notifications/templates/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/notifications/templates/:id - Delete a notification template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete template',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/templates/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
