const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Facebook Graph API base URL
const FACEBOOK_GRAPH_API = 'https://graph.facebook.com/v18.0';

// GET /api/facebook/pages - Get all Facebook pages
router.get('/pages', async (req, res) => {
  try {
    const { data: pages, error } = await supabase
      .from('facebook_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Facebook pages:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch Facebook pages',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error in GET /api/facebook/pages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/facebook/pages - Connect a new Facebook page
router.post('/pages', async (req, res) => {
  try {
    const { pageId, pageName, accessToken, permissions } = req.body;

    // Validate required fields
    if (!pageId || !pageName || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pageId, pageName, accessToken'
      });
    }

    // Verify the access token with Facebook
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API}/${pageId}`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token'
        }
      });

      if (response.data.error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Facebook access token or page ID',
          error: response.data.error.message
        });
      }
    } catch (error) {
      console.error('Error verifying Facebook token:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to verify Facebook access token',
        error: error.message
      });
    }

    // Create or update the page record
    const { data: page, error } = await supabase
      .from('facebook_pages')
      .upsert({
        page_id: pageId,
        page_name: pageName,
        access_token: accessToken,
        permissions: permissions || [],
        status: 'active',
        last_sync: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        created_by: req.user?.id
      }, {
        onConflict: 'page_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Facebook page:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create Facebook page',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: page,
      message: 'Facebook page connected successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/facebook/pages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/facebook/pages/:id - Get a specific Facebook page
router.get('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ 
        success: false, 
        message: 'Facebook page not found',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Error in GET /api/facebook/pages/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/facebook/pages/:id - Update a Facebook page
router.put('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: page, error } = await supabase
      .from('facebook_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Facebook page:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update Facebook page',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: page,
      message: 'Facebook page updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/facebook/pages/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/facebook/pages/:id - Disconnect a Facebook page
router.delete('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('facebook_pages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting Facebook page:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete Facebook page',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Facebook page disconnected successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/facebook/pages/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/facebook/pages/:id/test - Test Facebook page connection
router.post('/pages/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: page, error: pageError } = await supabase
      .from('facebook_pages')
      .select('page_id, access_token')
      .eq('id', id)
      .single();

    if (pageError) {
      return res.status(404).json({
        success: false,
        message: 'Facebook page not found'
      });
    }

    // Test the connection by fetching page info
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API}/${page.page_id}`, {
        params: {
          access_token: page.access_token,
          fields: 'id,name,fan_count'
        }
      });

      res.json({
        success: true,
        data: {
          connected: true,
          pageInfo: response.data,
          lastTested: new Date().toISOString()
        },
        message: 'Facebook page connection test successful'
      });
    } catch (error) {
      console.error('Error testing Facebook connection:', error);
      res.json({
        success: false,
        data: {
          connected: false,
          error: error.response?.data?.error?.message || error.message,
          lastTested: new Date().toISOString()
        },
        message: 'Facebook page connection test failed'
      });
    }
  } catch (error) {
    console.error('Error in POST /api/facebook/pages/:id/test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/facebook/posts - Get Facebook posts
router.get('/posts', async (req, res) => {
  try {
    const { 
      pageId, 
      page = 1, 
      limit = 10, 
      status, 
      type,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

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
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching Facebook posts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch Facebook posts',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/facebook/posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/facebook/posts - Create a new Facebook post
router.post('/posts', async (req, res) => {
  try {
    const {
      pageId,
      content,
      mediaUrls = [],
      hashtags = [],
      scheduledFor,
      templateId,
      promotionId
    } = req.body;

    // Validate required fields
    if (!pageId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pageId, content'
      });
    }

    // Get page access token
    const { data: page, error: pageError } = await supabase
      .from('facebook_pages')
      .select('page_id, access_token')
      .eq('id', pageId)
      .single();

    if (pageError) {
      return res.status(404).json({
        success: false,
        message: 'Facebook page not found'
      });
    }

    // Create post record
    const { data: post, error: postError } = await supabase
      .from('facebook_posts')
      .insert({
        page_id: pageId,
        content,
        media_urls: mediaUrls,
        hashtags,
        scheduled_for: scheduledFor,
        template_id: templateId,
        promotion_id: promotionId,
        status: scheduledFor ? 'scheduled' : 'draft',
        created_by: req.user?.id
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating Facebook post:', postError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create Facebook post',
        error: postError.message 
      });
    }

    // If not scheduled, publish immediately
    if (!scheduledFor) {
      try {
        const response = await axios.post(`${FACEBOOK_GRAPH_API}/${page.page_id}/feed`, {
          message: content,
          access_token: page.access_token
        });

        // Update post with Facebook post ID
        await supabase
          .from('facebook_posts')
          .update({
            facebook_post_id: response.data.id,
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', post.id);

        res.status(201).json({
          success: true,
          data: { ...post, facebook_post_id: response.data.id, status: 'published' },
          message: 'Facebook post published successfully'
        });
      } catch (error) {
        console.error('Error publishing to Facebook:', error);
        
        // Update post status to failed
        await supabase
          .from('facebook_posts')
          .update({ status: 'failed' })
          .eq('id', post.id);

        res.status(500).json({
          success: false,
          message: 'Failed to publish to Facebook',
          error: error.response?.data?.error?.message || error.message
        });
      }
    } else {
      res.status(201).json({
        success: true,
        data: post,
        message: 'Facebook post scheduled successfully'
      });
    }
  } catch (error) {
    console.error('Error in POST /api/facebook/posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/facebook/posts/:id/publish - Publish a scheduled post
router.post('/posts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: post, error: postError } = await supabase
      .from('facebook_posts')
      .select(`
        *,
        facebook_pages(page_id, access_token)
      `)
      .eq('id', id)
      .single();

    if (postError) {
      return res.status(404).json({
        success: false,
        message: 'Facebook post not found'
      });
    }

    if (post.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Post is not scheduled for publishing'
      });
    }

    // Publish to Facebook
    try {
      const response = await axios.post(`${FACEBOOK_GRAPH_API}/${post.facebook_pages.page_id}/feed`, {
        message: post.content,
        access_token: post.facebook_pages.access_token
      });

      // Update post status
      const { error: updateError } = await supabase
        .from('facebook_posts')
        .update({
          facebook_post_id: response.data.id,
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating post status:', updateError);
      }

      res.json({
        success: true,
        data: { ...post, facebook_post_id: response.data.id, status: 'published' },
        message: 'Facebook post published successfully'
      });
    } catch (error) {
      console.error('Error publishing to Facebook:', error);
      
      // Update post status to failed
      await supabase
        .from('facebook_posts')
        .update({ status: 'failed' })
        .eq('id', id);

      res.status(500).json({
        success: false,
        message: 'Failed to publish to Facebook',
        error: error.response?.data?.error?.message || error.message
      });
    }
  } catch (error) {
    console.error('Error in POST /api/facebook/posts/:id/publish:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/facebook/analytics/:pageId - Get Facebook page analytics
router.get('/analytics/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { startDate, endDate } = req.query;

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
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch Facebook analytics',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: analytics[0] || {
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
      }
    });
  } catch (error) {
    console.error('Error in GET /api/facebook/analytics/:pageId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/facebook/templates - Get Facebook templates
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
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Error fetching Facebook templates:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch Facebook templates',
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
    console.error('Error in GET /api/facebook/templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/facebook/templates - Create a Facebook template
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      content,
      type,
      category,
      status = 'active',
      variables,
      hashtags,
      callToAction,
      mediaRequired = false
    } = req.body;

    // Validate required fields
    if (!name || !content || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, content, type, category'
      });
    }

    const { data: template, error } = await supabase
      .from('facebook_templates')
      .insert({
        name,
        content,
        type,
        category,
        status,
        variables,
        hashtags,
        call_to_action: callToAction,
        media_required: mediaRequired,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Facebook template:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create Facebook template',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: template,
      message: 'Facebook template created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/facebook/templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/facebook/templates/:id - Update a Facebook template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: template, error } = await supabase
      .from('facebook_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Facebook template:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update Facebook template',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Facebook template updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/facebook/templates/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/facebook/templates/:id - Delete a Facebook template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('facebook_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting Facebook template:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete Facebook template',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Facebook template deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/facebook/templates/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
