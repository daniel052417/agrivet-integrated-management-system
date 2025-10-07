import React from 'react';
import { simplifiedAuth } from '../lib/simplifiedAuth';

/**
 * Test component to verify POS integration
 * This can be used to test the POS system without going through the full login flow
 */
const TestPOSIntegration: React.FC = () => {
  const testCashierLogin = async () => {
    try {
      // This would normally be done through the login page
      const user = await simplifiedAuth.signInWithPassword(
        'cashier@test.com', // Replace with actual test email
        'testpassword'       // Replace with actual test password
      );
      
      console.log('Test login successful:', user);
      
      // The user should now be redirected to POS system
      // This happens automatically through the main App.tsx routing
      
    } catch (error) {
      console.error('Test login failed:', error);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">POS Integration Test</h2>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            This component tests the POS system integration with your existing auth system.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Test Steps:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Create a test cashier user in your database</li>
              <li>2. Click the test button below</li>
              <li>3. Verify you're redirected to the POS system</li>
              <li>4. Check that user data displays correctly</li>
            </ol>
          </div>
          
          <button
            onClick={testCashierLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Test Cashier Login
          </button>
          
          <div className="text-sm text-gray-500">
            <p><strong>Note:</strong> Make sure you have a test user with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Email: cashier@test.com (or update the email above)</li>
              <li>Role: 'cashier'</li>
              <li>Active status: true</li>
              <li>First name and last name set</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPOSIntegration;


















