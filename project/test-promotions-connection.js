// Test script to verify PromotionsManagement connection to Supabase
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-key') {
  console.log('❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPromotionsConnection() {
  console.log('🧪 Testing PromotionsManagement Supabase connection...\n');

  try {
    // Test 1: Check if promotions table exists
    console.log('1. Testing promotions table access...');
    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('count')
      .limit(1);

    if (promotionsError) {
      console.log('❌ Error accessing promotions table:', promotionsError.message);
      return;
    }
    console.log('✅ Promotions table accessible');

    // Test 2: Test creating a promotion
    console.log('\n2. Testing promotion creation...');
    const testPromotion = {
      title: 'Test Promotion',
      description: 'This is a test promotion',
      promotion_type: 'new_item',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      show_on_pwa: true,
      share_to_facebook: false
    };

    const { data: createdPromotion, error: createError } = await supabase
      .from('promotions')
      .insert(testPromotion)
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating promotion:', createError.message);
      return;
    }
    console.log('✅ Promotion created successfully:', createdPromotion.id);

    // Test 3: Test reading promotions
    console.log('\n3. Testing promotion retrieval...');
    const { data: allPromotions, error: readError } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (readError) {
      console.log('❌ Error reading promotions:', readError.message);
      return;
    }
    console.log(`✅ Retrieved ${allPromotions.length} promotions`);

    // Test 4: Test updating promotion
    console.log('\n4. Testing promotion update...');
    const { data: updatedPromotion, error: updateError } = await supabase
      .from('promotions')
      .update({ 
        title: 'Updated Test Promotion',
        updated_at: new Date().toISOString()
      })
      .eq('id', createdPromotion.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating promotion:', updateError.message);
      return;
    }
    console.log('✅ Promotion updated successfully');

    // Test 5: Test deleting promotion
    console.log('\n5. Testing promotion deletion...');
    const { error: deleteError } = await supabase
      .from('promotions')
      .delete()
      .eq('id', createdPromotion.id);

    if (deleteError) {
      console.log('❌ Error deleting promotion:', deleteError.message);
      return;
    }
    console.log('✅ Promotion deleted successfully');

    // Test 6: Test database functions
    console.log('\n6. Testing database functions...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_promotion_stats');

    if (statsError) {
      console.log('❌ Error calling get_promotion_stats:', statsError.message);
    } else {
      console.log('✅ Database functions working:', stats);
    }

    console.log('\n🎉 All tests passed! PromotionsManagement is ready to use.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPromotionsConnection();


