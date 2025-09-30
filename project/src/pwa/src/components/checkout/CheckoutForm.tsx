import React, { useState } from 'react'
import { User, Mail, Phone, MapPin, Building, Hash } from 'lucide-react'
import { Branch } from '../../types'

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  isGuest: boolean
}

interface CheckoutFormProps {
  initialData: CustomerInfo
  onSubmit: (data: CustomerInfo) => void
  branch: Branch
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  initialData,
  onSubmit,
  branch
}) => {
  const [formData, setFormData] = useState<CustomerInfo>(initialData)
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({})

  const handleChange = (field: keyof CustomerInfo, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Customer Information
        </h2>
        <p className="text-gray-600">
          Please provide your details for order processing and pickup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`input-field pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+63 912 345 6789"
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Address Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`input-field pl-10 h-20 resize-none ${errors.address ? 'border-red-500' : ''}`}
              placeholder="Enter your complete address"
            />
          </div>
          {errors.address && (
            <p className="text-red-600 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`input-field pl-10 ${errors.city ? 'border-red-500' : ''}`}
                placeholder="Enter your city"
              />
            </div>
            {errors.city && (
              <p className="text-red-600 text-sm mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className={`input-field pl-10 ${errors.postalCode ? 'border-red-500' : ''}`}
                placeholder="1234"
              />
            </div>
            {errors.postalCode && (
              <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>
            )}
          </div>
        </div>

        {/* Pickup Location Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Pickup Location</h3>
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{branch.branch_name}</p>
              <p className="text-sm text-gray-600">{branch.address}</p>
              {branch.phone && (
                <p className="text-sm text-gray-600">{branch.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary px-8"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  )
}

export default CheckoutForm
