/**
 * Test script to verify delivery data integration with Supabase database
 * This script tests both pickup and delivery order creation
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Test data
const testCart = {
  items: [
    {
      product: {
        product_id: 'test-product-1',
        name: 'Test Product 1',
        sku: 'TEST-001'
      },
      product_unit: {
        id: 'test-unit-1',
        unit_name: 'kg',
        unit_label: 'Kilogram',
        price_per_unit: 100.00
      },
      quantity: 2,
      base_unit_quantity: 2,
      unitPrice: 100.00,
      lineTotal: 200.00,
      weight: 2.0,
      notes: 'Test order item'
    }
  ],
  itemCount: 1,
  subtotal: 200.00,
  tax: 24.00,
  total: 224.00
}

const testBranchId = 'test-branch-id'
const testCustomerInfo = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+63 912 345 6789'
}

async function testPickupOrder() {
  console.log('🧪 Testing PICKUP order creation...')
  
  try {
    const orderData = {
      order_number: `TEST-PICKUP-${Date.now()}`,
      customer_id: null,
      branch_id: testBranchId,
      order_type: 'pickup',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: testCart.subtotal,
      tax_amount: testCart.tax,
      discount_amount: 0,
      total_amount: testCart.total,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test pickup order',
      estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_guest_order: true,
      customer_name: `${testCustomerInfo.firstName} ${testCustomerInfo.lastName}`,
      customer_email: testCustomerInfo.email,
      customer_phone: testCustomerInfo.phone,
      special_instructions: 'Test pickup order',
      notes: 'Test pickup order',
      // Delivery fields should be null for pickup
      delivery_method: null,
      delivery_address: null,
      delivery_contact_number: null,
      delivery_landmark: null,
      delivery_status: null,
      confirmed_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`)
    }

    console.log('✅ Pickup order created successfully:', {
      id: order.id,
      order_number: order.order_number,
      order_type: order.order_type,
      delivery_method: order.delivery_method,
      delivery_status: order.delivery_status,
      estimated_ready_time: order.estimated_ready_time
    })

    return order.id

  } catch (error) {
    console.error('❌ Pickup order test failed:', error.message)
    throw error
  }
}

async function testDeliveryOrder() {
  console.log('🧪 Testing DELIVERY order creation...')
  
  try {
    const orderData = {
      order_number: `TEST-DELIVERY-${Date.now()}`,
      customer_id: null,
      branch_id: testBranchId,
      order_type: 'delivery',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: testCart.subtotal,
      tax_amount: testCart.tax,
      discount_amount: 0,
      total_amount: testCart.total,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test delivery order',
      estimated_ready_time: null, // No ready time for delivery orders
      is_guest_order: true,
      customer_name: `${testCustomerInfo.firstName} ${testCustomerInfo.lastName}`,
      customer_email: testCustomerInfo.email,
      customer_phone: testCustomerInfo.phone,
      special_instructions: 'Test delivery order',
      notes: 'Test delivery order',
      // Delivery fields populated
      delivery_method: 'maxim',
      delivery_address: '123 Test Street, Barangay Test, Test City',
      delivery_contact_number: '+63 912 345 6789',
      delivery_landmark: 'Near SM Mall, beside 7-Eleven',
      delivery_status: 'pending',
      confirmed_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`)
    }

    console.log('✅ Delivery order created successfully:', {
      id: order.id,
      order_number: order.order_number,
      order_type: order.order_type,
      delivery_method: order.delivery_method,
      delivery_status: order.delivery_status,
      delivery_address: order.delivery_address,
      delivery_contact_number: order.delivery_contact_number,
      delivery_landmark: order.delivery_landmark,
      estimated_ready_time: order.estimated_ready_time
    })

    return order.id

  } catch (error) {
    console.error('❌ Delivery order test failed:', error.message)
    throw error
  }
}

async function testOrderRetrieval(orderId) {
  console.log('🧪 Testing order retrieval...')
  
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        branch:branches(*),
        order_items:order_items(
          *,
          product:products(*),
          product_unit:product_units(*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      throw new Error(`Order retrieval failed: ${error.message}`)
    }

    console.log('✅ Order retrieved successfully:', {
      id: order.id,
      order_number: order.order_number,
      order_type: order.order_type,
      delivery_method: order.delivery_method,
      delivery_status: order.delivery_status,
      delivery_address: order.delivery_address,
      delivery_contact_number: order.delivery_contact_number,
      delivery_landmark: order.delivery_landmark,
      estimated_ready_time: order.estimated_ready_time,
      item_count: order.order_items?.length || 0
    })

    return order

  } catch (error) {
    console.error('❌ Order retrieval test failed:', error.message)
    throw error
  }
}

async function testDatabaseSchema() {
  console.log('🧪 Testing database schema...')
  
  try {
    // Check if delivery columns exist
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'orders')
      .like('column_name', 'delivery_%')

    if (error) {
      throw new Error(`Schema check failed: ${error.message}`)
    }

    const expectedColumns = [
      'delivery_method',
      'delivery_status', 
      'delivery_address',
      'delivery_contact_number',
      'delivery_landmark',
      'delivery_fee',
      'delivery_tracking_number'
    ]

    const foundColumns = columns.map(col => col.column_name)
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col))

    if (missingColumns.length > 0) {
      throw new Error(`Missing delivery columns: ${missingColumns.join(', ')}`)
    }

    console.log('✅ Database schema is correct:', {
      found_columns: foundColumns,
      expected_columns: expectedColumns
    })

  } catch (error) {
    console.error('❌ Database schema test failed:', error.message)
    throw error
  }
}

async function cleanupTestOrders() {
  console.log('🧹 Cleaning up test orders...')
  
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .like('order_number', 'TEST-%')

    if (error) {
      console.warn('⚠️ Cleanup warning:', error.message)
    } else {
      console.log('✅ Test orders cleaned up')
    }

  } catch (error) {
    console.warn('⚠️ Cleanup failed:', error.message)
  }
}

async function runTests() {
  console.log('🚀 Starting delivery database integration tests...\n')

  try {
    // Test 1: Check database schema
    await testDatabaseSchema()
    console.log('')

    // Test 2: Create pickup order
    const pickupOrderId = await testPickupOrder()
    console.log('')

    // Test 3: Create delivery order
    const deliveryOrderId = await testDeliveryOrder()
    console.log('')

    // Test 4: Retrieve pickup order
    await testOrderRetrieval(pickupOrderId)
    console.log('')

    // Test 5: Retrieve delivery order
    await testOrderRetrieval(deliveryOrderId)
    console.log('')

    console.log('🎉 All tests passed! Delivery data integration is working correctly.')

  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
    process.exit(1)
  } finally {
    // Cleanup
    await cleanupTestOrders()
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
}

module.exports = {
  testPickupOrder,
  testDeliveryOrder,
  testOrderRetrieval,
  testDatabaseSchema,
  cleanupTestOrders,
  runTests
}




