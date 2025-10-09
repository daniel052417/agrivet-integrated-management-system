const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/promotions - List all promotions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    let query = supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: promotions, error, count } = await query;

    if (error) {
      console.error('Error fetching promotions:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch promotions',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: promotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/promotions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/promotions/:id - Get specific promotion
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching promotion:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Promotion not found',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: promotion
    });
  } catch (error) {
    console.error('Error in GET /api/promotions/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/promotions - Create new promotion
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      discount_type,
      discount_value,
      products = [],
      categories = [],
      show_on_pwa = true,
      show_on_facebook = false,
      max_uses = null,
      created_by
    } = req.body;

    // Validate required fields
    if (!title || !description || !start_date || !end_date || !discount_type || !discount_value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, start_date, end_date, discount_type, discount_value'
      });
    }

    // Validate discount type
    if (!['flat', 'percent'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount_type. Must be "flat" or "percent"'
      });
    }

    // Validate discount value
    if (discount_value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be greater than 0'
      });
    }

    // Validate date range
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate max_uses
    if (max_uses !== null && max_uses <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Max uses must be greater than 0 or null'
      });
    }

    const promotionData = {
      title,
      description,
      start_date,
      end_date,
      discount_type,
      discount_value: parseFloat(discount_value),
      products: JSON.stringify(products),
      categories: JSON.stringify(categories),
      show_on_pwa,
      show_on_facebook,
      max_uses: max_uses ? parseInt(max_uses) : null,
      total_uses: 0,
      created_by
    };

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert([promotionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create promotion',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/promotions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/promotions/:id - Update promotion
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      start_date,
      end_date,
      discount_type,
      discount_value,
      products,
      categories,
      show_on_pwa,
      show_on_facebook,
      max_uses
    } = req.body;

    // Validate discount type if provided
    if (discount_type && !['flat', 'percent'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount_type. Must be "flat" or "percent"'
      });
    }

    // Validate discount value if provided
    if (discount_value !== undefined && discount_value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be greater than 0'
      });
    }

    // Validate date range if both dates provided
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate max_uses if provided
    if (max_uses !== undefined && max_uses !== null && max_uses <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Max uses must be greater than 0 or null'
      });
    }

    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (discount_type !== undefined) updateData.discount_type = discount_type;
    if (discount_value !== undefined) updateData.discount_value = parseFloat(discount_value);
    if (products !== undefined) updateData.products = JSON.stringify(products);
    if (categories !== undefined) updateData.categories = JSON.stringify(categories);
    if (show_on_pwa !== undefined) updateData.show_on_pwa = show_on_pwa;
    if (show_on_facebook !== undefined) updateData.show_on_facebook = show_on_facebook;
    if (max_uses !== undefined) updateData.max_uses = max_uses ? parseInt(max_uses) : null;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update promotion',
        error: error.message 
      });
    }

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.json({
      success: true,
      data: promotion,
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/promotions/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/promotions/:id - Delete promotion
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting promotion:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete promotion',
        error: error.message 
      });
    }

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/promotions/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/promotions/stats - Get promotion statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_promotion_stats');

    if (error) {
      console.error('Error fetching promotion stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch promotion statistics',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: stats[0] || {
        total_promotions: 0,
        active_promotions: 0,
        upcoming_promotions: 0,
        expired_promotions: 0,
        total_uses: 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/promotions/stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/promotions/pwa/active - Get active promotions for PWA
router.get('/pwa/active', async (req, res) => {
  try {
    const { data: promotions, error } = await supabase
      .rpc('get_active_promotions_for_pwa');

    if (error) {
      console.error('Error fetching active promotions for PWA:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch active promotions',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error in GET /api/promotions/pwa/active:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/promotions/:id/use - Increment usage count
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    // Get current promotion
    const { data: promotion, error: fetchError } = await supabase
      .from('promotions')
      .select('total_uses, max_uses')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching promotion:', fetchError);
      return res.status(404).json({ 
        success: false, 
        message: 'Promotion not found',
        error: fetchError.message 
      });
    }

    // Check if promotion has reached max uses
    if (promotion.max_uses && (promotion.total_uses + quantity) > promotion.max_uses) {
      return res.status(400).json({
        success: false,
        message: 'Promotion has reached maximum usage limit'
      });
    }

    // Update usage count
    const { data: updatedPromotion, error: updateError } = await supabase
      .from('promotions')
      .update({ 
        total_uses: promotion.total_uses + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating promotion usage:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update promotion usage',
        error: updateError.message 
      });
    }

    res.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion usage updated successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/promotions/:id/use:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/promotions/update-expired - Update expired promotions (for scheduled job)
router.post('/update-expired', async (req, res) => {
  try {
    const { data: updatedCount, error } = await supabase
      .rpc('update_expired_promotions');

    if (error) {
      console.error('Error updating expired promotions:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update expired promotions',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: { updated_count: updatedCount },
      message: 'Expired promotions updated successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/promotions/update-expired:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
