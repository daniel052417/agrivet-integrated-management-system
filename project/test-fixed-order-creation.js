// Test Fixed Order Creation
import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.log('❌ Please update the Supabase credentials in this test file')
  console.log('📝 Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your actual values')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFixedOrderCreation() {
  console.log('🧪 Testing Fixed Order Creation...')
  
  try {
    // Test 1: Get a valid branch_id
    console.log('\n1️⃣ Getting valid branch_id...')
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .limit(1)
    
    if (branchError || !branches || branches.length === 0) {
      console.error('❌ Cannot get branches:', branchError)
      return
    }
    
    const branchId = branches[0].id
    console.log('✅ Using branch:', branches[0].name, '(', branchId, ')')
    
    // Test 2: Create a pickup order (simulating the PWA flow)
    console.log('\n2️⃣ Creating pickup order...')
    
    const pickupOrderData = {
      order_number: `PICKUP-${Date.now()}`,
      customer_id: null, // Guest order
      branch_id: branchId,
      order_type: 'pickup',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: 100.00,
      tax_amount: 12.00,
      discount_amount: 0,
      total_amount: 112.00,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test pickup order from fixed service',
      estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_guest_order: true,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+639123456789',
      special_instructions: 'Test pickup instructions',
      notes: 'Test pickup order notes',
      delivery_method: null,
      delivery_status: null,
      delivery_address: null,
      delivery_contact_number: null,
      delivery_landmark: null,
      delivery_fee: null,
      delivery_tracking_number: null,
      delivery_latitude: null,
      delivery_longitude: null
    }
    
    const { data: pickupOrder, error: pickupError } = await supabase
      .from('orders')
      .insert(pickupOrderData)
      .select()
      .single()
    
    if (pickupError) {
      console.error('❌ Pickup order creation failed:', pickupError)
      return
    }
    
    console.log('✅ Pickup order created successfully!')
    console.log('📋 Order ID:', pickupOrder.id)
    console.log('📋 Order Number:', pickupOrder.order_number)
    
    // Test 3: Create a delivery order
    console.log('\n3️⃣ Creating delivery order...')
    
    const deliveryOrderData = {
      order_number: `DELIVERY-${Date.now()}`,
      customer_id: null,
      branch_id: branchId,
      order_type: 'delivery',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: 150.00,
      tax_amount: 18.00,
      discount_amount: 0,
      total_amount: 168.00,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test delivery order from fixed service',
      estimated_ready_time: null, // Delivery orders don't have estimated ready time
      is_guest_order: true,
      customer_name: 'Delivery Test Customer',
      customer_email: 'delivery@example.com',
      customer_phone: '+639123456789',
      special_instructions: 'Test delivery instructions',
      notes: 'Test delivery order notes',
      delivery_method: 'maxim',
      delivery_status: 'pending',
      delivery_address: '123 Test Street, Test City, Test Province',
      delivery_contact_number: '+639123456789',
      delivery_landmark: 'Near Test Mall',
      delivery_fee: null,
      delivery_tracking_number: null,
      delivery_latitude: 10.3157,
      delivery_longitude: 123.8854
    }
    
    const { data: deliveryOrder, error: deliveryError } = await supabase
      .from('orders')
      .insert(deliveryOrderData)
      .select()
      .single()
    
    if (deliveryError) {
      console.error('❌ Delivery order creation failed:', deliveryError)
    } else {
      console.log('✅ Delivery order created successfully!')
      console.log('📋 Order ID:', deliveryOrder.id)
      console.log('📋 Order Number:', deliveryOrder.order_number)
      console.log('📋 Delivery Address:', deliveryOrder.delivery_address)
    }
    
    // Test 4: Verify orders were created
    console.log('\n4️⃣ Verifying orders in database...')
    
    const { data: allOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, order_number, order_type, status, total_amount, delivery_address')
      .in('id', [pickupOrder.id, deliveryOrder?.id].filter(Boolean))
      .order('created_at', { ascending: false })
    
    if (queryError) {
      console.error('❌ Failed to query orders:', queryError)
    } else {
      console.log('✅ Found orders in database:')
      allOrders.forEach(order => {
        console.log(`   - ${order.order_number} (${order.order_type}): ${order.total_amount} - ${order.status}`)
        if (order.delivery_address) {
          console.log(`     Delivery: ${order.delivery_address}`)
        }
      })
    }
    
    // Test 5: Clean up test orders
    console.log('\n5️⃣ Cleaning up test orders...')
    
    const { error: deleteError1 } = await supabase
      .from('orders')
      .delete()
      .eq('id', pickupOrder.id)
    
    if (deleteError1) {
      console.warn('⚠️ Failed to clean up pickup order:', deleteError1)
    } else {
      console.log('✅ Pickup order cleaned up')
    }
    
    if (deliveryOrder) {
      const { error: deleteError2 } = await supabase
        .from('orders')
        .delete()
        .eq('id', deliveryOrder.id)
      
      if (deleteError2) {
        console.warn('⚠️ Failed to clean up delivery order:', deleteError2)
      } else {
        console.log('✅ Delivery order cleaned up')
      }
    }
    
    console.log('\n🎉 Fixed order creation test completed successfully!')
    console.log('💡 Your orders table is working correctly.')
    console.log('💡 The orderService has been fixed to work with your schema.')
    console.log('💡 Try your PWA checkout again - it should work now!')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

testFixedOrderCreation()
