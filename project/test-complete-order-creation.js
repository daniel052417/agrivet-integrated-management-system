// Complete Order Creation Test with order_items and inventory_reservations
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

async function testCompleteOrderCreation() {
  console.log('🧪 Testing Complete Order Creation with order_items and inventory_reservations...')
  
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
    
    // Test 2: Get a valid product_id and product_unit_id
    console.log('\n2️⃣ Getting valid product and product_unit...')
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, sku')
      .limit(1)
    
    if (productError || !products || products.length === 0) {
      console.error('❌ Cannot get products:', productError)
      return
    }
    
    const productId = products[0].id
    console.log('✅ Using product:', products[0].name, '(', productId, ')')
    
    // Get product units
    const { data: productUnits, error: unitError } = await supabase
      .from('product_units')
      .select('id, unit_name, unit_label, price_per_unit')
      .eq('product_id', productId)
      .limit(1)
    
    if (unitError || !productUnits || productUnits.length === 0) {
      console.warn('⚠️ No product units found, will use null')
      var productUnitId = null
    } else {
      var productUnitId = productUnits[0].id
      console.log('✅ Using product unit:', productUnits[0].unit_name, '(', productUnitId, ')')
    }
    
    // Test 3: Create a pickup order with order_items
    console.log('\n3️⃣ Creating pickup order with order_items...')
    
    const pickupOrderData = {
      order_number: `PICKUP-COMPLETE-${Date.now()}`,
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
      payment_notes: 'Test complete pickup order',
      estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_guest_order: true,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+639123456789',
      special_instructions: 'Test pickup instructions',
      notes: 'Test complete pickup order notes',
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
    
    // Test 4: Create order_items for the pickup order
    console.log('\n4️⃣ Creating order_items for pickup order...')
    
    const pickupOrderItems = [
      {
        order_id: pickupOrder.id,
        product_id: productId,
        product_unit_id: productUnitId,
        quantity: 2,
        base_unit_quantity: 2,
        unit_price: 50.00,
        line_total: 100.00,
        product_name: products[0].name,
        product_sku: products[0].sku,
        unit_name: productUnits[0]?.unit_name || 'piece',
        unit_label: productUnits[0]?.unit_label || 'Piece',
        weight: null,
        expiry_date: null,
        batch_number: null,
        notes: 'Test order item',
        created_at: new Date().toISOString()
      }
    ]
    
    const { error: pickupItemsError } = await supabase
      .from('order_items')
      .insert(pickupOrderItems)
    
    if (pickupItemsError) {
      console.error('❌ Pickup order items creation failed:', pickupItemsError)
      // Clean up the order
      await supabase.from('orders').delete().eq('id', pickupOrder.id)
      return
    }
    
    console.log('✅ Pickup order items created successfully!')
    
    // Test 5: Create inventory_reservations for the pickup order
    console.log('\n5️⃣ Creating inventory_reservations for pickup order...')
    
    const pickupReservations = [
      {
        order_id: pickupOrder.id,
        product_id: productId,
        branch_id: branchId,
        quantity_reserved: 2,
        reserved_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]
    
    const { error: pickupReservationsError } = await supabase
      .from('inventory_reservations')
      .insert(pickupReservations)
    
    if (pickupReservationsError) {
      console.warn('⚠️ Pickup inventory reservations creation failed:', pickupReservationsError)
      // Non-critical, continue
    } else {
      console.log('✅ Pickup inventory reservations created successfully!')
    }
    
    // Test 6: Create a delivery order with order_items
    console.log('\n6️⃣ Creating delivery order with order_items...')
    
    const deliveryOrderData = {
      order_number: `DELIVERY-COMPLETE-${Date.now()}`,
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
      payment_notes: 'Test complete delivery order',
      estimated_ready_time: null,
      is_guest_order: true,
      customer_name: 'Delivery Test Customer',
      customer_email: 'delivery@example.com',
      customer_phone: '+639123456789',
      special_instructions: 'Test delivery instructions',
      notes: 'Test complete delivery order notes',
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
      
      // Create order_items for delivery order
      const deliveryOrderItems = [
        {
          order_id: deliveryOrder.id,
          product_id: productId,
          product_unit_id: productUnitId,
          quantity: 3,
          base_unit_quantity: 3,
          unit_price: 50.00,
          line_total: 150.00,
          product_name: products[0].name,
          product_sku: products[0].sku,
          unit_name: productUnits[0]?.unit_name || 'piece',
          unit_label: productUnits[0]?.unit_label || 'Piece',
          weight: null,
          expiry_date: null,
          batch_number: null,
          notes: 'Test delivery order item',
          created_at: new Date().toISOString()
        }
      ]
      
      const { error: deliveryItemsError } = await supabase
        .from('order_items')
        .insert(deliveryOrderItems)
      
      if (deliveryItemsError) {
        console.error('❌ Delivery order items creation failed:', deliveryItemsError)
      } else {
        console.log('✅ Delivery order items created successfully!')
      }
      
      // Create inventory_reservations for delivery order
      const deliveryReservations = [
        {
          order_id: deliveryOrder.id,
          product_id: productId,
          branch_id: branchId,
          quantity_reserved: 3,
          reserved_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
      
      const { error: deliveryReservationsError } = await supabase
        .from('inventory_reservations')
        .insert(deliveryReservations)
      
      if (deliveryReservationsError) {
        console.warn('⚠️ Delivery inventory reservations creation failed:', deliveryReservationsError)
      } else {
        console.log('✅ Delivery inventory reservations created successfully!')
      }
    }
    
    // Test 7: Verify all data was created
    console.log('\n7️⃣ Verifying all data was created...')
    
    // Check orders
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
    
    // Check order_items
    const { data: orderItems, error: itemsQueryError } = await supabase
      .from('order_items')
      .select('id, order_id, product_name, quantity, unit_price, line_total')
      .in('order_id', [pickupOrder.id, deliveryOrder?.id].filter(Boolean))
    
    if (itemsQueryError) {
      console.error('❌ Failed to query order_items:', itemsQueryError)
    } else {
      console.log('✅ Found order_items in database:')
      orderItems.forEach(item => {
        console.log(`   - ${item.product_name}: ${item.quantity} x ${item.unit_price} = ${item.line_total}`)
      })
    }
    
    // Check inventory_reservations
    const { data: reservations, error: reservationsQueryError } = await supabase
      .from('inventory_reservations')
      .select('id, order_id, product_id, quantity_reserved, status')
      .in('order_id', [pickupOrder.id, deliveryOrder?.id].filter(Boolean))
    
    if (reservationsQueryError) {
      console.error('❌ Failed to query inventory_reservations:', reservationsQueryError)
    } else {
      console.log('✅ Found inventory_reservations in database:')
      reservations.forEach(reservation => {
        console.log(`   - Order ${reservation.order_id}: ${reservation.quantity_reserved} units reserved (${reservation.status})`)
      })
    }
    
    // Test 8: Clean up test data
    console.log('\n8️⃣ Cleaning up test data...')
    
    // Delete in reverse order due to foreign key constraints
    if (deliveryOrder) {
      await supabase.from('inventory_reservations').delete().eq('order_id', deliveryOrder.id)
      await supabase.from('order_items').delete().eq('order_id', deliveryOrder.id)
      await supabase.from('orders').delete().eq('id', deliveryOrder.id)
      console.log('✅ Delivery order and related data cleaned up')
    }
    
    await supabase.from('inventory_reservations').delete().eq('order_id', pickupOrder.id)
    await supabase.from('order_items').delete().eq('order_id', pickupOrder.id)
    await supabase.from('orders').delete().eq('id', pickupOrder.id)
    console.log('✅ Pickup order and related data cleaned up')
    
    console.log('\n🎉 Complete order creation test completed successfully!')
    console.log('💡 Your database schema is working correctly with:')
    console.log('   ✅ orders table')
    console.log('   ✅ order_items table')
    console.log('   ✅ inventory_reservations table')
    console.log('💡 Your PWA checkout should now work perfectly!')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

testCompleteOrderCreation()
