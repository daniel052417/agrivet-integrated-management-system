// Test Orders Table Creation
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

async function testOrdersTableCreation() {
  console.log('🧪 Testing Orders Table Creation...')
  
  try {
    // Test 1: Check if orders table exists
    console.log('\n1️⃣ Checking if orders table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('orders')
      .select('*')
      .limit(0)
    
    if (tableError) {
      console.log('❌ Orders table does not exist:', tableError.message)
      
      // Test 2: Try to create orders table manually
      console.log('\n2️⃣ Attempting to create orders table...')
      
      // First, let's check what tables exist
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names')
        .catch(() => {
          // Fallback: try a simple query to see what's available
          return supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public')
        })
      
      console.log('📋 Available tables:', tables)
      
      // Create orders table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number VARCHAR(50) UNIQUE NOT NULL,
          customer_id UUID,
          branch_id UUID NOT NULL,
          order_type VARCHAR(20) DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery')),
          status VARCHAR(50) DEFAULT 'pending_confirmation',
          payment_status VARCHAR(50) DEFAULT 'pending',
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          payment_method VARCHAR(50) NOT NULL,
          payment_reference VARCHAR(100),
          payment_notes TEXT,
          estimated_ready_time TIMESTAMP WITH TIME ZONE,
          is_guest_order BOOLEAN DEFAULT false,
          customer_name TEXT,
          customer_email TEXT,
          customer_phone TEXT,
          special_instructions TEXT,
          notes TEXT,
          confirmed_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          delivery_method VARCHAR(20) DEFAULT NULL,
          delivery_status VARCHAR(20) DEFAULT 'pending',
          delivery_address TEXT DEFAULT NULL,
          delivery_contact_number VARCHAR(20) DEFAULT NULL,
          delivery_landmark TEXT DEFAULT NULL,
          delivery_fee DECIMAL(10,2) DEFAULT NULL,
          delivery_tracking_number VARCHAR(100) DEFAULT NULL,
          delivery_latitude DECIMAL(10,8) DEFAULT NULL,
          delivery_longitude DECIMAL(11,8) DEFAULT NULL
        );
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (createError) {
        console.error('❌ Failed to create orders table:', createError)
        return
      }
      
      console.log('✅ Orders table created successfully!')
    } else {
      console.log('✅ Orders table already exists')
    }
    
    // Test 3: Try to insert a test order
    console.log('\n3️⃣ Testing order insertion...')
    
    const testOrderData = {
      order_number: `TEST-${Date.now()}`,
      customer_id: null,
      branch_id: 'test-branch-id', // This might fail if branch doesn't exist
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
      delivery_status: 'pending',
      delivery_address: null,
      delivery_contact_number: null,
      delivery_landmark: null,
      delivery_fee: null,
      delivery_tracking_number: null,
      delivery_latitude: null,
      delivery_longitude: null
    }
    
    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ Test order insertion failed:', orderError)
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
    
    console.log('\n🎉 Orders table test completed successfully!')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

testOrdersTableCreation()




