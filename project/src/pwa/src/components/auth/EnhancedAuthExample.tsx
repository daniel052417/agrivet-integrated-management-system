// ============================================================================
// ENHANCED AUTHENTICATION EXAMPLE COMPONENT
// ============================================================================
// Example component showing how to use the enhanced authentication system

import React, { useState } from 'react'
import { useEnhancedAuth } from '../../hooks/useEnhancedAuth'

// ============================================================================
// TYPES
// ============================================================================

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  first_name: string
  last_name: string
  phone: string
  address: string
  city: string
  province: string
  date_of_birth: string
  customer_type: 'individual' | 'business'
}

interface LoginFormData {
  email: string
  password: string
}

interface GuestUpgradeFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  date_of_birth: string
  customer_type: 'individual' | 'business'
}

// ============================================================================
// ENHANCED AUTHENTICATION EXAMPLE COMPONENT
// ============================================================================

const EnhancedAuthExample: React.FC = () => {
  // Authentication hook
  const {
    user,
    isLoading,
    isAuthenticated,
    isGuest,
    register,
    login,
    logout,
    createGuest,
    upgradeGuest,
    refreshUser
  } = useEnhancedAuth()

  // Form states
  const [showRegister, setShowRegister] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showGuestUpgrade, setShowGuestUpgrade] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form data
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    date_of_birth: '',
    customer_type: 'individual'
  })

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  })

  const [guestUpgradeData, setGuestUpgradeData] = useState<GuestUpgradeFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    date_of_birth: '',
    customer_type: 'individual'
  })

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!registerData.email || !registerData.first_name || !registerData.last_name) {
      setError('Please fill in all required fields')
      return
    }

    const result = await register({
      email: registerData.email,
      password: registerData.password,
      first_name: registerData.first_name,
      last_name: registerData.last_name,
      phone: registerData.phone || undefined,
      address: registerData.address || undefined,
      city: registerData.city || undefined,
      province: registerData.province || undefined,
      date_of_birth: registerData.date_of_birth || undefined,
      customer_type: registerData.customer_type
    })

    if (result.success) {
      setSuccess('Registration successful! Welcome to our platform.')
      setShowRegister(false)
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        date_of_birth: '',
        customer_type: 'individual'
      })
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields')
      return
    }

    const result = await login(loginData)

    if (result.success) {
      setSuccess('Login successful! Welcome back.')
      setShowLogin(false)
      setLoginData({ email: '', password: '' })
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleLogout = async () => {
    setError(null)
    setSuccess(null)
    await logout()
    setSuccess('Logged out successfully')
  }

  const handleCreateGuest = async () => {
    setError(null)
    setSuccess(null)

    const result = await createGuest()

    if (result.success) {
      setSuccess('Guest account created! You can browse and upgrade later.')
    } else {
      setError(result.error || 'Failed to create guest account')
    }
  }

  const handleGuestUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!guestUpgradeData.email || !guestUpgradeData.first_name || !guestUpgradeData.last_name) {
      setError('Please fill in all required fields')
      return
    }

    const result = await upgradeGuest(guestUpgradeData)

    if (result.success) {
      setSuccess('Account upgraded successfully! You now have full access.')
      setShowGuestUpgrade(false)
      setGuestUpgradeData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        date_of_birth: '',
        customer_type: 'individual'
      })
    } else {
      setError(result.error || 'Failed to upgrade account')
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Enhanced Authentication Demo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete authentication system with guest support
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* User Status */}
        {isAuthenticated && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Profile</h3>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Customer Code:</strong> {user?.customer_code}</p>
              <p><strong>Customer Number:</strong> {user?.customer_number}</p>
              <p><strong>Account Type:</strong> {isGuest ? 'Guest' : 'Full Account'}</p>
              <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
            </div>
            
            <div className="mt-4 flex space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
              
              {isGuest && (
                <button
                  onClick={() => setShowGuestUpgrade(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Upgrade Account
                </button>
              )}
              
              <button
                onClick={refreshUser}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Authentication Forms */}
        {!isAuthenticated && (
          <div className="mt-6 space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Login
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Register
              </button>
              <button
                onClick={handleCreateGuest}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        {showLogin && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Login</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration Form */}
        {showRegister && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Register</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    value={registerData.first_name}
                    onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    value={registerData.last_name}
                    onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Province</label>
                  <input
                    type="text"
                    value={registerData.province}
                    onChange={(e) => setRegisterData({ ...registerData, province: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  value={registerData.date_of_birth}
                  onChange={(e) => setRegisterData({ ...registerData, date_of_birth: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                <select
                  value={registerData.customer_type}
                  onChange={(e) => setRegisterData({ ...registerData, customer_type: e.target.value as 'individual' | 'business' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Guest Upgrade Form */}
        {showGuestUpgrade && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upgrade Guest Account</h3>
            <form onSubmit={handleGuestUpgrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    value={guestUpgradeData.first_name}
                    onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, first_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    value={guestUpgradeData.last_name}
                    onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, last_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={guestUpgradeData.email}
                  onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={guestUpgradeData.phone}
                  onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={guestUpgradeData.address}
                  onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, address: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={guestUpgradeData.city}
                    onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, city: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Province</label>
                  <input
                    type="text"
                    value={guestUpgradeData.province}
                    onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, province: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  value={guestUpgradeData.date_of_birth}
                  onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, date_of_birth: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                <select
                  value={guestUpgradeData.customer_type}
                  onChange={(e) => setGuestUpgradeData({ ...guestUpgradeData, customer_type: e.target.value as 'individual' | 'business' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Upgrade Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuestUpgrade(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedAuthExample









