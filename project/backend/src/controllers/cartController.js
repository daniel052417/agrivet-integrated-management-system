const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

/**
 * Create or update PWA session with cart data
 */
const createOrUpdateSession = async (req, res) => {
  try {
    const {
      session_id,
      customer_id,
      is_guest,
      cart_data,
      branch_id,
      dismissed_banners,
      modal_shown,
      device_info,
      user_agent,
      ip_address
    } = req.body

    // Validate required fields
    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      })
    }

    // Call the database function
    const { data, error } = await supabase.rpc('create_or_update_pwa_session', {
      p_session_id: session_id,
      p_branch_id: branch_id || null,
      p_customer_id: customer_id || null,
      p_is_guest: is_guest !== undefined ? is_guest : true,
      p_cart_data: cart_data || null,
      p_dismissed_banners: dismissed_banners || null,
      p_modal_shown: modal_shown || null,
      p_device_info: device_info || null,
      p_user_agent: user_agent || null,
      p_ip_address: ip_address || null
    })

    if (error) {
      console.error('Error creating/updating session:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create/update session'
      })
    }

    res.json(data)
  } catch (error) {
    console.error('Error in createOrUpdateSession:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Get PWA session data
 */
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      })
    }

    // Call the database function
    const { data, error } = await supabase.rpc('get_pwa_session', {
      p_session_id: sessionId
    })

    if (error) {
      console.error('Error getting session:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to get session'
      })
    }

    res.json(data)
  } catch (error) {
    console.error('Error in getSession:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Migrate guest cart to authenticated user
 */
const migrateGuestCart = async (req, res) => {
  try {
    const { session_id, customer_id } = req.body

    if (!session_id || !customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and Customer ID are required'
      })
    }

    // Get the guest session data
    const { data: sessionData, error: sessionError } = await supabase.rpc('get_pwa_session', {
      p_session_id: session_id
    })

    if (sessionError || !sessionData.success) {
      return res.status(404).json({
        success: false,
        error: 'Guest session not found'
      })
    }

    const cartData = sessionData.session.cart_data

    // Update the session to be associated with the authenticated customer
    const { data: updateData, error: updateError } = await supabase.rpc('create_or_update_pwa_session', {
      p_session_id: session_id,
      p_customer_id: customer_id,
      p_is_guest: false,
      p_cart_data: cartData
    })

    if (updateError) {
      console.error('Error migrating guest cart:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to migrate guest cart'
      })
    }

    res.json({
      success: true,
      cart: cartData,
      message: 'Guest cart migrated successfully'
    })
  } catch (error) {
    console.error('Error in migrateGuestCart:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_pwa_sessions')

    if (error) {
      console.error('Error cleaning up sessions:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired sessions'
      })
    }

    res.json(data)
  } catch (error) {
    console.error('Error in cleanupExpiredSessions:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Get cart data for a specific session
 */
const getCart = async (req, res) => {
  try {
    const { sessionId } = req.params

    const { data, error } = await supabase.rpc('get_pwa_session', {
      p_session_id: sessionId
    })

    if (error) {
      console.error('Error getting cart:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to get cart data'
      })
    }

    if (!data.success) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      })
    }

    res.json({
      success: true,
      cart: data.session.cart_data || {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0
      }
    })
  } catch (error) {
    console.error('Error in getCart:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Update cart data for a specific session
 */
const updateCart = async (req, res) => {
  try {
    const { sessionId } = req.params
    const { cart_data, customer_id, is_guest } = req.body

    if (!cart_data) {
      return res.status(400).json({
        success: false,
        error: 'Cart data is required'
      })
    }

    const { data, error } = await supabase.rpc('create_or_update_pwa_session', {
      p_session_id: sessionId,
      p_customer_id: customer_id || null,
      p_is_guest: is_guest !== undefined ? is_guest : true,
      p_cart_data: cart_data
    })

    if (error) {
      console.error('Error updating cart:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update cart'
      })
    }

    res.json({
      success: true,
      cart: cart_data,
      message: 'Cart updated successfully'
    })
  } catch (error) {
    console.error('Error in updateCart:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

module.exports = {
  createOrUpdateSession,
  getSession,
  migrateGuestCart,
  cleanupExpiredSessions,
  getCart,
  updateCart
}
