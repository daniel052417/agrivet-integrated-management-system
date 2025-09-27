import React from 'react';
import POSWrapper from './POSWrapper';

/**
 * Test component to verify the React Router fix
 * This component can be used to test the POS system without the Router context
 */
const TestPOSFix: React.FC = () => {
  // Mock user data for testing
  const mockUser = {
    id: '1',
    email: 'cashier@test.com',
    first_name: 'John',
    last_name: 'Cashier',
    phone: '+63 912 345 6789',
    branch_id: 'branch-1',
    is_active: true,
    last_login: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    status: 'online' as const,
    current_session_id: 'session-1',
    timezone: 'Asia/Manila',
    preferred_language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role_id: 'role-1',
    role_name: 'cashier',
    role_display_name: 'Cashier',
    role_description: 'Point of Sale Cashier',
    role_is_active: true,
    role_is_system_role: true,
    sidebar_config: {
      sections: ['overview', 'sales-pos', 'sales-records', 'sales-dashboard', 'daily-sales', 'product-sales', 'sales-value']
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    // This would normally redirect to login page
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">POS System Test</h2>
          <p className="text-sm text-gray-600">
            This component tests the POS system without React Router dependencies.
            If you see the POS interface below, the fix is working correctly.
          </p>
        </div>
        
        <POSWrapper user={mockUser} onLogout={handleLogout} />
      </div>
    </div>
  );
};

export default TestPOSFix;


