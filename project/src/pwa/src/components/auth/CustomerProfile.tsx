import React, { useState } from 'react'
import { useCustomerAuth } from '../../hooks/useCustomerAuth'

// ============================================================================
// CUSTOMER PROFILE COMPONENT
// ============================================================================

export const CustomerProfile: React.FC = () => {
  const { customer, updateProfile, signOut, isLoading, error, clearError } = useCustomerAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    province: customer?.province || '',
    postal_code: customer?.postal_code || '',
    date_of_birth: customer?.date_of_birth || '',
    customer_type: customer?.customer_type || 'individual'
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Update form data when customer data changes
  React.useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        province: customer.province || '',
        postal_code: customer.postal_code || '',
        date_of_birth: customer.date_of_birth || '',
        customer_type: customer.customer_type || 'individual'
      })
    }
  }, [customer])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear general error
    if (error) {
      clearError()
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.first_name) {
      errors.first_name = 'First name is required'
    }

    if (!formData.last_name) {
      errors.last_name = 'Last name is required'
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    const result = await updateProfile(formData)
    
    if (result.success) {
      setIsEditing(false)
      console.log('✅ Profile updated successfully')
    } else {
      console.error('❌ Profile update failed:', result.error)
    }
  }

  const handleCancel = () => {
    // Reset form data to original customer data
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        province: customer.province || '',
        postal_code: customer.postal_code || '',
        date_of_birth: customer.date_of_birth || '',
        customer_type: customer.customer_type || 'individual'
      })
    }
    setIsEditing(false)
    setValidationErrors({})
    clearError()
  }

  const handleSignOut = async () => {
    const result = await signOut()
    
    if (result.success) {
      console.log('✅ Signed out successfully')
    } else {
      console.error('❌ Sign out failed:', result.error)
    }
  }

  if (!customer) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={customer.email}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
          />
        </div>

        {/* Customer Type (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Type</label>
          <input
            type="text"
            value={customer.customer_type}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
          />
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? `focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.first_name ? 'border-red-500' : 'border-gray-300'}`
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
          {validationErrors.first_name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? `focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.last_name ? 'border-red-500' : 'border-gray-300'}`
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
          {validationErrors.last_name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? `focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300'
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300'
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300'
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Province</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300'
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Postal Code</label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              isEditing 
                ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300'
                : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}
          />
        </div>
      </div>

      {/* Account Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-gray-800">${customer.total_spent.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Loyalty Points</p>
            <p className="text-2xl font-bold text-gray-800">{customer.loyalty_points}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="text-2xl font-bold text-gray-800">
              {new Date(customer.registration_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}









