// Test Order Creation
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
  console.log('🧪 Testing Order Creation...')
  
  try {
    // Test 1: Check Supabase connection
    console.log('\n1️⃣ Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('branches')
      .select('id, name')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError)
      return
    }
    
    console.log('✅ Supabase connection successful')
    console.log('📋 Available branches:', connectionTest)
    
    // Test 2: Check orders table structure
    console.log('\n2️⃣ Checking orders table structure...')
    const { data: ordersStructure, error: structureError } = await supabase
      .from('orders')
      .select('*')
      .limit(0)
    
    if (structureError) {
      console.error('❌ Orders table access failed:', structureError)
      return
    }
    
    console.log('✅ Orders table accessible')
    
    // Test 3: Create a test order
    console.log('\n3️⃣ Creating test order...')
    
    const testOrderData = {
      order_number: `TEST-${Date.now()}`,
      customer_id: null,
      branch_id: connectionTest[0]?.id || 'test-branch-id',
      order_type: 'pickup',
      status: 'pending_confirmation',
      payment_status: 'pending',
      subtotal: 100.00,
      tax_amount: 12.00,
      discount_amount: 0,
      total_amount: 112.00,
      payment_method: 'cash',
      payment_reference: null,
      payment_notes: 'Test order',
      estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_guest_order: true,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+639123456789',
      special_instructions: 'Test order instructions',
      notes: 'Test order notes',
      delivery_method: null,
      delivery_address: null,
      delivery_contact_number: null,
      delivery_landmark: null,
      delivery_status: null,
      confirmed_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      delivery_latitude: null,
      delivery_longitude: null,
    }
    
    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ Test order creation failed:', orderError)
      console.error('📋 Error details:', JSON.stringify(orderError, null, 2))
      return
    }
    
    console.log('✅ Test order created successfully!')
    console.log('📋 Order ID:', testOrder.id)
    console.log('📋 Order Number:', testOrder.order_number)
    
    // Test 4: Clean up test order
    console.log('\n4️⃣ Cleaning up test order...')
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', testOrder.id)
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test order:', deleteError)
    } else {
      console.log('✅ Test order cleaned up')
    }
    
    console.log('\n🎉 All tests passed! Order creation should work.')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

testOrderCreation()
