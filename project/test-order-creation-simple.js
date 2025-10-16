// Simple Order Creation Test
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

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation with existing orders table...')
  
  try {
    // Test 1: Check if orders table is accessible
    console.log('\n1️⃣ Checking orders table access...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Cannot access orders table:', tableError)
      return
    }
    
    console.log('✅ Orders table is accessible')
    
    // Test 2: Check if branches table exists (needed for foreign key)
    console.log('\n2️⃣ Checking branches table...')
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .limit(1)
    
    if (branchError) {
      console.error('❌ Cannot access branches table:', branchError)
      return
    }
    
    console.log('✅ Branches table accessible, found:', branches.length, 'branches')
    const testBranchId = branches[0]?.id || 'test-branch-id'
    
    // Test 3: Create a test order
    console.log('\n3️⃣ Creating test order...')
    
    const testOrderData = {
      order_number: `TEST-${Date.now()}`,
      customer_id: null, // Guest order
      branch_id: testBranchId,
      order_type: 'pickup',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: 100.00,
      tax_amount: 12.00,
      discount_amount: 0,
      total_amount: 112.00,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test order from script',
      estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_guest_order: true,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+639123456789',
      special_instructions: 'Test order instructions',
      notes: 'Test order notes',
      delivery_method: null,
      delivery_status: 'pending',
      delivery_address: null,
      delivery_contact_number: null,
      delivery_landmark: null,
      delivery_fee: null,
      delivery_tracking_number: null,
      delivery_latitude: null,
      delivery_longitude: null
    }
    
    console.log('📋 Order data to insert:', JSON.stringify(testOrderData, null, 2))
    
    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError)
      console.error('📋 Error details:', JSON.stringify(orderError, null, 2))
      
      // Check if it's a foreign key constraint error
      if (orderError.code === '23503') {
        console.log('\n🔍 This appears to be a foreign key constraint error.')
        console.log('💡 The branch_id might not exist in the branches table.')
        console.log('💡 Try using a valid branch_id from your branches table.')
      }
      
      return
    }
    
    console.log('✅ Test order created successfully!')
    console.log('📋 Order ID:', testOrder.id)
    console.log('📋 Order Number:', testOrder.order_number)
    console.log('📋 Branch ID:', testOrder.branch_id)
    
    // Test 4: Test delivery order creation
    console.log('\n4️⃣ Testing delivery order creation...')
    
    const deliveryOrderData = {
      order_number: `DELIVERY-TEST-${Date.now()}`,
      customer_id: null,
      branch_id: testBranchId,
      order_type: 'delivery',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: 150.00,
      tax_amount: 18.00,
      discount_amount: 0,
      total_amount: 168.00,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test delivery order',
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
      delivery_fee: null, // Will be set by staff later
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
      console.error('📋 Error details:', JSON.stringify(deliveryError, null, 2))
    } else {
      console.log('✅ Delivery order created successfully!')
      console.log('📋 Order ID:', deliveryOrder.id)
      console.log('📋 Order Number:', deliveryOrder.order_number)
      console.log('📋 Delivery Address:', deliveryOrder.delivery_address)
    }
    
    // Test 5: Clean up test orders
    console.log('\n5️⃣ Cleaning up test orders...')
    
    const { error: deleteError1 } = await supabase
      .from('orders')
      .delete()
      .eq('id', testOrder.id)
    
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
    
    console.log('\n🎉 Order creation test completed successfully!')
    console.log('💡 Your orders table is working correctly.')
    console.log('💡 The issue in your PWA might be:')
    console.log('   - Invalid branch_id being passed')
    console.log('   - Missing environment variables')
    console.log('   - Authentication issues')
    console.log('   - Network connectivity problems')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

testOrderCreation()
