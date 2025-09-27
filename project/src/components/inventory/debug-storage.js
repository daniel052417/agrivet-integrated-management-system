// Debug Storage Script
// Run this in your browser console to debug Supabase storage

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugStorage() {
  console.log('🔍 Debugging Supabase Storage...');
  
  try {
    // 1. List all buckets
    console.log('\n1. Listing all buckets:');
    const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:', buckets);
    
    // 2. Check if product-images bucket exists
    const productImagesBucket = buckets?.find(bucket => bucket.id === 'product-images');
    console.log('\n2. Product-images bucket:', productImagesBucket);
    
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found!');
      console.log('Available bucket IDs:', buckets?.map(b => b.id));
      return;
    }
    
    // 3. Check bucket details
    console.log('\n3. Bucket details:');
    console.log('- ID:', productImagesBucket.id);
    console.log('- Name:', productImagesBucket.name);
    console.log('- Public:', productImagesBucket.public);
    console.log('- File size limit:', productImagesBucket.file_size_limit);
    console.log('- Allowed MIME types:', productImagesBucket.allowed_mime_types);
    
    // 4. Try to list files in the bucket
    console.log('\n4. Listing files in product-images bucket:');
    const { data: files, error: filesError } = await supabaseClient.storage
      .from('product-images')
      .list();
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log('✅ Files in bucket:', files);
    }
    
    // 5. Test upload permissions
    console.log('\n5. Testing upload permissions...');
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('product-images')
      .upload('test-file.txt', testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful:', uploadData);
      
      // Clean up test file
      await supabaseClient.storage
        .from('product-images')
        .remove(['test-file.txt']);
      console.log('🧹 Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug function
debugStorage();
