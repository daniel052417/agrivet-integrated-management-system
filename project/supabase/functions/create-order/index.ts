import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateOrderRequest {
  cart: {
    items: Array<{
      product: {
        product_id: string
        name: string
        sku: string
      }
      product_unit?: {
        id: string
        unit_name: string
        unit_label: string
        price_per_unit: number
      }
      quantity: number
      base_unit_quantity: number
      unitPrice: number
      lineTotal: number
      weight?: number
      expiryDate?: string
      batchNumber?: string
      notes?: string
    }>
    itemCount: number
    subtotal: number
    tax: number
    total: number
  }
  customerId?: string
  branchId: string
  paymentMethod: string
  notes?: string
  customerInfo?: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  // Delivery fields
  orderType?: 'pickup' | 'delivery'
  deliveryMethod?: 'maxim' | 'other'
  deliveryAddress?: string
  deliveryContactNumber?: string
  deliveryLandmark?: string
  deliveryStatus?: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed'
}

interface CreateOrderResponse {
  success: boolean
  order?: any
  orderId?: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the request body
    const requestData: CreateOrderRequest = await req.json()

    const {
      cart,
      customerId,
      branchId,
      paymentMethod,
      notes,
      customerInfo,
      orderType = 'pickup',
      deliveryMethod,
      deliveryAddress,
      deliveryContactNumber,
      deliveryLandmark,
      deliveryStatus
    } = requestData

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Get current user ID from Supabase auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    const currentUserId = user?.id || null

    console.log('Current user ID:', currentUserId)
    console.log('Customer email:', customerInfo?.email)

    // Get or use existing customer_id from customers table
    let finalCustomerId = customerId

    // If user is authenticated but no customerId provided, look up their customer record
    if (currentUserId && !finalCustomerId) {
      console.log('Looking up customer for user_id:', currentUserId)
      
      const { data: existingCustomer, error: customerError } = await supabaseClient
        .from('customers')
        .select('id, user_id, email')
        .eq('user_id', currentUserId)
        .single()
      
      console.log('Customer lookup result:', { existingCustomer, customerError })
      
      if (existingCustomer && !customerError) {
        finalCustomerId = existingCustomer.id
        console.log('Found existing customer:', finalCustomerId)
      } else {
        console.warn('No customer record found for user_id:', currentUserId, 'Error:', customerError)
        finalCustomerId = undefined
      }
    } else if (customerId) {
      console.log('Using provided customerId:', customerId)
    }
    
    console.log('Final customer_id for order:', finalCustomerId)

    // Prepare order data
    const orderData = {
      order_number: orderNumber,
      customer_id: finalCustomerId || null,
      branch_id: branchId,
      order_type: orderType,
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: cart.subtotal,
      tax_amount: cart.tax,
      discount_amount: 0,
      total_amount: cart.total,
      payment_method: paymentMethod,
      payment_reference: null,
      payment_notes: notes || null,
      estimated_ready_time: orderType === 'pickup' ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
      is_guest_order: !finalCustomerId,
      customer_name: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : null,
      customer_email: customerInfo?.email || null,
      customer_phone: customerInfo?.phone || null,
      special_instructions: notes || null,
      notes: notes || null,
      // Delivery fields
      delivery_method: deliveryMethod || null,
      delivery_address: deliveryAddress || null,
      delivery_contact_number: deliveryContactNumber || null,
      delivery_landmark: deliveryLandmark || null,
      delivery_status: deliveryStatus || null,
      confirmed_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert order into database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    console.log('Order created successfully:', order.id, 'with customer_id:', order.customer_id)

    // Create order items
    const orderItems = cart.items.map(item => ({
      order_id: order.id,
      product_id: item.product.product_id,
      product_unit_id: item.product_unit?.id || null,
      quantity: item.quantity,
      base_unit_quantity: item.base_unit_quantity,
      unit_price: item.product_unit?.price_per_unit || item.unitPrice,
      line_total: item.lineTotal,
      product_name: item.product.name,
      product_sku: item.product.sku,
      unit_name: item.product_unit?.unit_name || 'piece',
      unit_label: item.product_unit?.unit_label || 'Piece',
      weight: item.weight || null,
      expiry_date: item.expiryDate || null,
      batch_number: item.batchNumber || null,
      notes: item.notes || null,
      created_at: new Date().toISOString()
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback order if items fail
      await supabaseClient.from('orders').delete().eq('id', order.id)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    // Create soft inventory reservations (optional - for display purposes only)
    try {
      const reservations = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product.product_id,
        branch_id: branchId,
        quantity_reserved: item.base_unit_quantity || item.quantity,
        reserved_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      }))

      await supabaseClient
        .from('inventory_reservations')
        .insert(reservations)
    } catch (error) {
      console.warn('Could not create soft reservations:', error)
      // Non-critical, continue
    }

    const response: CreateOrderResponse = {
      success: true,
      order,
      orderId: order.id
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating order:', error)
    
    const response: CreateOrderResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
