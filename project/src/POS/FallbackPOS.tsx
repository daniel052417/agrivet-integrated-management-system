import React from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';

/**
 * Fallback POS component for when there are integration issues
 * This provides a simple interface that can be used as a backup
 */
const FallbackPOS: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <header className="bg-white shadow-lg border-b-2 border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AgriVet POS</h1>
                <p className="text-sm text-gray-500">Point of Sale System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                POS System Loading
              </h2>
              <p className="text-gray-600 mb-6">
                The POS system is being initialized. Please wait a moment...
              </p>
              
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              
              <div className="mt-8 text-sm text-gray-500">
                <p>If this message persists, please contact your system administrator.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FallbackPOS;



























