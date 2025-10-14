import React, { useState } from 'react'
import { useCustomerAuth } from '../hooks/useCustomerAuth'
import { CustomerSignUp } from '../components/auth/CustomerSignUp'
import { CustomerSignIn } from '../components/auth/CustomerSignIn'
import { CustomerProfile } from '../components/auth/CustomerProfile'

// ============================================================================
// CUSTOMER AUTH EXAMPLE PAGE
// ============================================================================

export const CustomerAuthExample: React.FC = () => {
  const { customer, isAuthenticated, isLoading } = useCustomerAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show profile if authenticated
  if (isAuthenticated && customer) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <CustomerProfile />
        </div>
      </div>
    )
  }

  // Show auth forms if not authenticated
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {authMode === 'signin' ? (
          <CustomerSignIn
            onSuccess={() => {
              console.log('✅ Sign in successful')
            }}
            onSwitchToSignUp={() => setAuthMode('signup')}
          />
        ) : (
          <CustomerSignUp
            onSuccess={() => {
              console.log('✅ Sign up successful')
              setAuthMode('signin')
            }}
            onSwitchToSignIn={() => setAuthMode('signin')}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// USAGE EXAMPLE COMPONENT
// ============================================================================

export const CustomerAuthUsageExample: React.FC = () => {
  const { 
    customer, 
    isAuthenticated, 
    isLoading, 
    signUp, 
    signIn, 
    signInWithGoogle, 
    signOut, 
    updateProfile 
  } = useCustomerAuth()

  const handleSignUp = async () => {
    const result = await signUp({
      email: 'customer@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      customer_type: 'individual'
    })
    
    if (result.success) {
      console.log('✅ Customer signed up:', result.customer)
    } else {
      console.error('❌ Sign up failed:', result.error)
    }
  }

  const handleSignIn = async () => {
    const result = await signIn({
      email: 'customer@example.com',
      password: 'password123'
    })
    
    if (result.success) {
      console.log('✅ Customer signed in:', result.customer)
    } else {
      console.error('❌ Sign in failed:', result.error)
    }
  }

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle()
    
    if (result.success) {
      console.log('✅ Google sign in initiated')
    } else {
      console.error('❌ Google sign in failed:', result.error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!customer) return

    const result = await updateProfile({
      phone: '+0987654321',
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON'
    })
    
    if (result.success) {
      console.log('✅ Profile updated:', result.customer)
    } else {
      console.error('❌ Profile update failed:', result.error)
    }
  }

  const handleSignOut = async () => {
    const result = await signOut()
    
    if (result.success) {
      console.log('✅ Signed out successfully')
    } else {
      console.error('❌ Sign out failed:', result.error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Customer Authentication Example</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current State</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Customer:</strong> {customer ? `${customer.first_name} ${customer.last_name} (${customer.email})` : 'None'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleSignUp}
              disabled={isLoading || isAuthenticated}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Sign Up (Email/Password)
            </button>
            
            <button
              onClick={handleSignIn}
              disabled={isLoading || isAuthenticated}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Sign In (Email/Password)
            </button>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading || isAuthenticated}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Sign In with Google
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleUpdateProfile}
              disabled={isLoading || !isAuthenticated}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Update Profile
            </button>
            
            <button
              onClick={handleSignOut}
              disabled={isLoading || !isAuthenticated}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {customer && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Data</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(customer, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}











