import React, { useState } from 'react';
import { PromotionsManagementService } from '../../lib/promotionsManagementService';

const StorageDebug: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStorageConnection = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Starting storage connection test...');

      // Test 1: Check if we can access storage
      addResult('1. Testing storage access...');
      
      // Test 2: Try to upload a test file
      addResult('2. Creating test file...');
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      addResult('3. Attempting to upload test file...');
      const { data, error } = await PromotionsManagementService.uploadPromotionImage(
        testFile, 
        'test-promotion-id'
      );

      if (error) {
        addResult(`❌ Upload failed: ${error.message || JSON.stringify(error)}`);
      } else {
        addResult(`✅ Upload successful: ${data}`);
      }

      addResult('🎉 Storage test completed!');

    } catch (err) {
      addResult(`❌ Unexpected error: ${err}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Debug Tool</h3>
      
      <button
        onClick={testStorageConnection}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? 'Testing...' : 'Test Storage Connection'}
      </button>

      {testResults.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
          <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageDebug;


