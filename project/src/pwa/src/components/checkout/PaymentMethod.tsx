import React, { useState } from 'react'
import { CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-react'

interface PaymentInfo {
  method: 'cash' | 'gcash' | 'paymaya'
  referenceNumber: string
  notes: string
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  isGuest: boolean
}

interface PaymentMethodProps {
  initialData: PaymentInfo
  onSubmit: (payment: PaymentInfo) => void
  customerInfo: CustomerInfo
  isProcessing: boolean
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  initialData,
  onSubmit,
  customerInfo,
  isProcessing
}) => {
  const [paymentData, setPaymentData] = useState<PaymentInfo>(initialData)
  const [errors, setErrors] = useState<Partial<PaymentInfo>>({})

  const paymentMethods = [
    {
      id: 'cash' as const,
      name: 'Cash on Pickup',
      description: 'Pay with cash when you pick up your order',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'gcash' as const,
      name: 'GCash',
      description: 'Pay using GCash mobile wallet',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'paymaya' as const,
      name: 'PayMaya',
      description: 'Pay using PayMaya mobile wallet',
      icon: Smartphone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  const handleMethodChange = (method: PaymentInfo['method']) => {
    setPaymentData(prev => ({ 
      ...prev, 
      method,
      referenceNumber: '' // Clear reference number when changing method
    }))
    
    // Clear errors
    setErrors({})
  }

  const handleChange = (field: keyof PaymentInfo, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentInfo> = {}

    if (paymentData.method === 'gcash' || paymentData.method === 'paymaya') {
      if (!paymentData.referenceNumber.trim()) {
        newErrors.referenceNumber = 'Reference number is required for digital payments'
      } else if (!/^\d{10,15}$/.test(paymentData.referenceNumber.replace(/\s/g, ''))) {
        newErrors.referenceNumber = 'Please enter a valid reference number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(paymentData)
    }
  }

  const selectedMethod = paymentMethods.find(method => method.id === paymentData.method)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Method
        </h2>
        <p className="text-gray-600">
          Choose your preferred payment method for this order.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = paymentData.method === method.id
            
            return (
              <label
                key={method.id}
                className={`block cursor-pointer ${
                  isSelected ? 'ring-2 ring-agrivet-green' : ''
                }`}
              >
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? `${method.bgColor} ${method.borderColor}` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => handleMethodChange(method.id)}
                      className="sr-only"
                    />
                    
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      <Icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {method.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {method.description}
                      </p>
                    </div>
                    
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-agrivet-green" />
                    )}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {/* Reference Number for Digital Payments */}
        {(paymentData.method === 'gcash' || paymentData.method === 'paymaya') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={paymentData.referenceNumber}
                onChange={(e) => handleChange('referenceNumber', e.target.value)}
                className={`input-field pl-10 ${errors.referenceNumber ? 'border-red-500' : ''}`}
                placeholder="Enter transaction reference number"
              />
            </div>
            {errors.referenceNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.referenceNumber}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter the reference number from your {selectedMethod?.name} transaction
            </p>
          </div>
        )}

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            value={paymentData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="input-field h-20 resize-none"
            placeholder="Any special instructions for your order..."
          />
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="text-gray-900">{customerInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="text-gray-900">{customerInfo.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900">{customerInfo.email}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing}
            className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentMethod
