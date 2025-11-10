import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, MapPin, Phone, Mail, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ProfileCompletionProps {
  userId?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  onComplete?: () => void
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = (props) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { markProfileComplete, user } = useAuth()
  
  // Get data from props, location state, or OAuth temp storage
  const locationState = location.state as any
  const oauthTemp = localStorage.getItem('oauth_temp_user')
  const oauthData = oauthTemp ? JSON.parse(oauthTemp) : null
  
  const initialData = {
    userId: props.userId || locationState?.userId || oauthData?.userId || user?.id || '',
    email: props.email || locationState?.email || oauthData?.email || user?.email || '',
    firstName: props.firstName || locationState?.firstName || oauthData?.firstName || user?.first_name || '',
    lastName: props.lastName || locationState?.lastName || oauthData?.lastName || user?.last_name || '',
    phone: props.phone || locationState?.phone || oauthData?.phone || user?.phone || '',
    fromOAuth: locationState?.fromOAuth || false
  }
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: initialData.firstName,
    lastName: initialData.lastName,
    phone: initialData.phone,
    address: '',
    city: '',
    province: '',
    postalCode: '',
    customerType: 'individual'
  })

  useEffect(() => {
    // Clear OAuth temp data once we've loaded it
    if (oauthTemp) {
      localStorage.removeItem('oauth_temp_user')
    }
    
    // Check if we have a valid user ID
    if (!initialData.userId) {
      console.error('❌ ProfileCompletion: No user ID found')
      setError('Authentication error. Please try logging in again.')
      setTimeout(() => navigate('/auth-selection'), 3000)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      console.log('📝 Profile Completion: Submitting customer data...')
      console.log('User ID:', initialData.userId)
      console.log('Email:', initialData.email)
      
      // First, check if customer already exists (shouldn't happen, but safety check)
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', initialData.userId)
        .maybeSingle()
      
      if (existingCustomer) {
        console.log('⚠️ Customer already exists, updating instead...')
        
        // Update existing customer
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode,
            customer_type: formData.customerType,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', initialData.userId)
        
        if (updateError) {
          throw updateError
        }
        
        console.log('✅ Customer profile updated successfully')
      } else {
        // Create new customer using Edge Function
        console.log('🆕 Creating new customer record...')
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: initialData.userId,
            email: initialData.email,
            user_metadata: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              full_name: `${formData.firstName} ${formData.lastName}`
            },
            raw_user_meta_data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone
            },
            address: formData.address,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode,
            customer_type: formData.customerType,
            source: 'profile-completion'
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to create customer profile')
        }

        console.log('✅ Profile Completion: Customer created successfully')
      }
      
      // Store user info in localStorage
      const customerData = {
        id: initialData.userId,
        email: initialData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        user_type: 'customer' as const,
        is_active: true,
        email_verified: true, // OAuth users are pre-verified
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('auth_user', JSON.stringify(customerData))
      localStorage.setItem('agrivet_user_cache', JSON.stringify(customerData))
      
      // Show success message
      setSuccess(true)
      
      // Call completion callbacks
      if (props.onComplete) {
        props.onComplete()
      }
      markProfileComplete()
      
      // Navigate to catalog after short delay
      setTimeout(() => {
        navigate('/catalog')
      }, 2000)
      
    } catch (error) {
      console.error('❌ Profile Completion: Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete profile')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Completed!
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to Tiongson Agrivet, {formData.firstName}!
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to catalog...
          </p>
          <div className="mt-4">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            {initialData.fromOAuth 
              ? "We just need a few more details to set up your account"
              : "Please provide your details to continue"}
          </p>
          {initialData.fromOAuth && (
            <div className="mt-3 inline-flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span>Signed in with Google</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Type Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customerType: 'individual' }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.customerType === 'individual'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">Individual</span>
              </button>
              {/* <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customerType: 'business' }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.customerType === 'business'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">Business</span>
              </button> */}
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="First name"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Fields (conditionally shown) */}
          {/* {formData.customerType === 'business' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    placeholder="Your business name"
                    required={formData.customerType === 'business'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  placeholder="Business tax ID"
                />
              </div>
            </div>
          )} */}

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={initialData.email}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                disabled
              />
            </div>
            {initialData.fromOAuth && (
              <p className="text-xs text-gray-500 mt-1">Email verified via Google</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+63 912 345 6789"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Street address, building, etc."
                required
              />
            </div>
          </div>

          {/* City, Province, Postal Code */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="City"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Province"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="1234"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Profile...</span>
              </div>
            ) : (
              'Complete Profile & Continue Shopping'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileCompletion