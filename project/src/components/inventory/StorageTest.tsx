import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const StorageTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStorage = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Starting storage test...');
      
      // 1. List buckets
      addResult('📋 Listing all buckets...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addResult(`❌ Error listing buckets: ${bucketsError.message}`);
        return;
      }
      
      addResult(`✅ Found ${buckets?.length || 0} buckets`);
      buckets?.forEach(bucket => {
        addResult(`  - ${bucket.id} (public: ${bucket.public})`);
      });
      
      // 2. Check for product-images bucket
      const productImagesBucket = buckets?.find(bucket => bucket.id === 'product-images');
      if (!productImagesBucket) {
        addResult('❌ product-images bucket not found!');
        addResult('💡 Please create the bucket in your Supabase dashboard');
        return;
      }
      
      addResult(`✅ product-images bucket found (public: ${productImagesBucket.public})`);
      
      // 3. Test file upload
      addResult('📤 Testing file upload...');
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`test-${Date.now()}.txt`, testFile);
      
      if (uploadError) {
        addResult(`❌ Upload failed: ${uploadError.message}`);
        return;
      }
      
      addResult(`✅ Upload successful: ${uploadData.path}`);
      
      // 4. Test file listing
      addResult('📁 Testing file listing...');
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list();
      
      if (filesError) {
        addResult(`❌ File listing failed: ${filesError.message}`);
      } else {
        addResult(`✅ Found ${files?.length || 0} files in bucket`);
      }
      
      // 5. Clean up test file
      addResult('🧹 Cleaning up test file...');
      await supabase.storage
        .from('product-images')
        .remove([uploadData.path]);
      addResult('✅ Test file cleaned up');
      
      addResult('🎉 Storage test completed successfully!');
      
    } catch (error: any) {
      addResult(`❌ Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Storage Test</h2>
      
      <button
        onClick={testStorage}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Storage Access'}
      </button>
      
      <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">Click "Test Storage Access" to run diagnostics</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageTest;
