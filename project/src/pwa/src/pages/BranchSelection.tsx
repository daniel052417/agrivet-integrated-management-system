import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, CheckCircle, AlertCircle, Phone, Star, Users, Truck } from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { Branch } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

// Sample branch data for demonstration
const sampleBranches: Branch[] = [
  {
    id: '1',
    name: 'AgriVet Main Branch',
    code: 'MAIN',
    address: '123 Agricultural Road, Barangay Poblacion',
    city: 'San Jose',
    state: 'Nueva Ecija',
    zip_code: '3100',
    phone: '+63 44 123 4567',
    email: 'main@agrivet.com',
    manager_id: '1',
    is_active: true,
    operating_hours: {
      open: '07:00',
      close: '19:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    branch_type: 'main'
  },
  {
    id: '2',
    name: 'AgriVet Cabanatuan',
    code: 'CAB',
    address: '456 Maharlika Highway, Barangay Sumacab',
    city: 'Cabanatuan',
    state: 'Nueva Ecija',
    zip_code: '3100',
    phone: '+63 44 234 5678',
    email: 'cabanatuan@agrivet.com',
    manager_id: '2',
    is_active: true,
    operating_hours: {
      open: '08:00',
      close: '18:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    branch_type: 'satellite'
  },
  {
    id: '3',
    name: 'AgriVet Gapan',
    code: 'GAP',
    address: '789 National Road, Barangay San Vicente',
    city: 'Gapan',
    state: 'Nueva Ecija',
    zip_code: '3105',
    phone: '+63 44 345 6789',
    email: 'gapan@agrivet.com',
    manager_id: '3',
    is_active: true,
    operating_hours: {
      open: '08:00',
      close: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    branch_type: 'satellite'
  }
]

const BranchSelection: React.FC = () => {
  const navigate = useNavigate()
  const { 
    availableBranches, 
    branchAvailability, 
    selectBranch, 
    refreshBranches, 
    isBranchOpen 
  } = useBranch()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use sample data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBranches(sampleBranches)
      
      // In real app, this would be:
      // await refreshBranches()
    } catch (err) {
      setError('Failed to load branches. Please try again.')
      console.error('Error loading branches:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBranchSelect = (branch: Branch) => {
    selectBranch(branch)
    navigate('/auth-selection')
  }

  const getBranchStatus = (branchId: string) => {
    // Simulate different branch statuses
    const statuses = {
      '1': { isOpen: true, waitTime: '5-10 min' },
      '2': { isOpen: true, waitTime: '10-15 min' },
      '3': { isOpen: false, waitTime: 'Closed' }
    }
    
    const status = statuses[branchId as keyof typeof statuses] || { isOpen: true, waitTime: '5-10 min' }
    
    return {
      isOpen: status.isOpen,
      statusText: status.isOpen ? 'Open' : 'Closed',
      statusColor: status.isOpen ? 'text-green-600' : 'text-red-600',
      bgColor: status.isOpen ? 'bg-green-50' : 'bg-red-50',
      borderColor: status.isOpen ? 'border-green-200' : 'border-red-200',
      statusIcon: status.isOpen ? CheckCircle : AlertCircle,
      waitTime: status.waitTime
    }
  }

  const getBranchFeatures = (branch: Branch) => {
    const features = []
    if (branch.branch_type === 'main') features.push('Full Service')
    if (branch.phone) features.push('Phone Orders')
    features.push('Pickup Available')
    return features
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-agrivet-green rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <LoadingSpinner message="Loading branches..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <ErrorMessage message={error} />
          <button 
            onClick={loadBranches}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-agrivet-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to AgriVet
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Your trusted partner for agricultural supplies and veterinary products. 
              Select your preferred branch to start shopping.
            </p>
          </div>
        </div>
      </div>

      {/* Branch List */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Choose Your Branch
          </h2>
          <p className="text-gray-600 text-center">
            All branches offer the same quality products and services
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const status = getBranchStatus(branch.id)
            const StatusIcon = status.statusIcon
            const features = getBranchFeatures(branch)

            return (
              <div
                key={branch.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                onClick={() => handleBranchSelect(branch)}
              >
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-agrivet-green transition-colors">
                        {branch.name}
                      </h3>
                      {branch.branch_type === 'main' && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                          Main
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-start text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{branch.address}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">
                        {branch.operating_hours?.open || '8:00 AM'} - {branch.operating_hours?.close || '6:00 PM'}
                      </span>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a 
                          href={`tel:${branch.phone}`}
                          className="text-sm hover:text-agrivet-green transition-colors"
                        >
                          {branch.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-full ${status.bgColor} ${status.borderColor} border-2`}>
                    <StatusIcon className={`w-6 h-6 ${status.statusColor}`} />
                  </div>
                </div>

                {/* Status and Wait Time */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${status.statusColor}`}>
                      {status.statusText}
                    </span>
                    <span className="text-sm text-gray-500">
                      {status.waitTime}
                    </span>
                  </div>
                  
                  {status.isOpen && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-3/4 animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-agrivet-green text-white py-3 px-4 rounded-xl font-semibold hover:bg-agrivet-green/90 transition-colors duration-200 flex items-center justify-center space-x-2 group-hover:shadow-lg">
                  <span>Select Branch</span>
                  <Truck className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        {branches.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Branches Available
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We're currently setting up our branches. Please check back later or contact us for assistance.
            </p>
            <button 
              onClick={loadBranches}
              className="btn-primary"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help Choosing?
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+639123456789" className="text-agrivet-green hover:underline font-medium">
                  +63 912 345 6789
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Live Chat Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BranchSelection
