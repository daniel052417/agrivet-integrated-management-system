import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, Clock, CheckCircle, AlertCircle, Phone, Users, Truck, Mail, Building,
  CreditCard, Smartphone, Banknote, Timer
} from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { Branch } from '../types'
import { branchService } from '../services/branchService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import ClosedBranchModal from '../components/modals/ClosedBranchModal'
import { getNextOpeningTime, isBranchClosed } from '../utils/branchUtils'

// Sample data for testing the enhanced UI with actual JSONB operating_hours structure
const sampleBranches: Branch[] = [
  {
    id: '1',
    name: 'AgriVet Main Branch',
    code: 'MAIN',
    address: '123 Agricultural Road, Barangay Poblacion',
    city: 'San Jose',
    province: 'Nueva Ecija',
    postal_code: '3100',
    phone: '+63 44 123 4567',
    email: 'main@agrivet.com',
    manager_id: '1',
    is_active: true,
    operating_hours: {
      monday: { open: '07:00', close: '19:00' },
      tuesday: { open: '07:00', close: '19:00' },
      wednesday: { open: '07:00', close: '19:00' },
      thursday: { open: '07:00', close: '19:00' },
      friday: { open: '07:00', close: '19:00' },
      saturday: { open: '07:00', close: '19:00' },
      sunday: { closed: true }
    },
    created_at: '2024-01-01T00:00:00Z',
    branch_type: 'main'
  },
  {
    id: '2',
    name: 'AgriVet Cabanatuan',
    code: 'CAB',
    address: '456 Maharlika Highway, Barangay Sumacab',
    city: 'Cabanatuan',
    province: 'Nueva Ecija',
    postal_code: '3100',
    phone: '+63 44 234 5678',
    email: 'cabanatuan@agrivet.com',
    manager_id: '2',
    is_active: true,
    operating_hours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { closed: true }
    },
    created_at: '2024-01-01T00:00:00Z',
    branch_type: 'satellite'
  },
  {
    id: '3',
    name: 'AgriVet Gapan',
    code: 'GAP',
    address: '789 National Road, Barangay San Vicente',
    city: 'Gapan',
    province: 'Nueva Ecija',
    postal_code: '3105',
    phone: '+63 44 345 6789',
    email: 'gapan@agrivet.com',
    manager_id: '3',
    is_active: true,
    operating_hours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { closed: true }
    },
    created_at: '2024-01-01T00:00:00Z',
    branch_type: 'satellite'
  }
]

const BranchSelection: React.FC = () => {
  const navigate = useNavigate()
  const { 
    selectBranch,
    refreshBranches
  } = useBranch()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [showClosedModal, setShowClosedModal] = useState(false)
  const [selectedClosedBranch, setSelectedClosedBranch] = useState<Branch | null>(null)

  useEffect(() => {
    console.log('🚀 BranchSelection: Component mounted, useEffect triggered')
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      console.log('🔄 BranchSelection: Starting to load branches...')
      setIsLoading(true)
      setError(null)
      
      // Use real Supabase data - get branches directly from service
      console.log('🔄 BranchSelection: Calling branchService.getBranches()...')
      const branches = await branchService.getBranches()
      console.log('📊 BranchSelection: Branches received from service:', branches)
      console.log('📊 BranchSelection: Number of branches:', branches.length)
      
      // Also refresh context for other components
      console.log('🔄 BranchSelection: Calling refreshBranches()...')
      await refreshBranches()
      
      // Use the branches from service directly
      if (branches.length > 0) {
        console.log('✅ BranchSelection: Using real database data')
        setBranches(branches)
      } else {
        console.log('📊 BranchSelection: No real data, using sample data')
        setBranches(sampleBranches)
      }
      
      console.log('✅ BranchSelection: Branches loaded successfully')
    } catch (err) {
      console.error('❌ BranchSelection: Error loading branches:', err)
      console.log('📊 BranchSelection: Falling back to sample data')
      setBranches(sampleBranches)
      setError('Using sample data. Real data will be available when connected to Supabase.')
    } finally {
      console.log('🏁 BranchSelection: Loading process completed')
      setIsLoading(false)
    }
  }

  const handleBranchSelect = (branch: Branch) => {
    console.log('🎯 BranchSelection: Branch selected:', branch)
    console.log('🎯 BranchSelection: Branch details:', {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      branch_type: branch.branch_type,
      is_active: branch.is_active
    })
    
    // Check if branch is closed
    if (isBranchClosed(branch)) {
      console.log('🚫 BranchSelection: Branch is closed, showing modal')
      setSelectedClosedBranch(branch)
      setShowClosedModal(true)
      return
    }
    
    selectBranch(branch)
    navigate('/auth-selection')
  }

  const handleSetReminder = () => {
    console.log('⏰ BranchSelection: Set reminder clicked')
    // TODO: Implement reminder functionality
    setShowClosedModal(false)
  }

  const handleFindAnotherBranch = () => {
    console.log('🔍 BranchSelection: Find another branch clicked')
    setShowClosedModal(false)
    // Scroll to top to show all branches
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBrowseAnyway = () => {
    console.log('🛒 BranchSelection: Browse anyway clicked')
    if (selectedClosedBranch) {
      selectBranch(selectedClosedBranch)
      navigate('/auth-selection')
    }
    setShowClosedModal(false)
  }

  const handleCloseModal = () => {
    setShowClosedModal(false)
    setSelectedClosedBranch(null)
  }

  const getSmartBranchStatus = (branch: Branch) => {
    console.log('🕐 BranchSelection: Checking smart status for branch:', branch.name)
    
    // Use real-time status from database if available
    if (branch.real_time_status) {
      console.log('🕐 BranchSelection: Using database real-time status:', branch.real_time_status)
      
      // Map database status to UI status
      if (branch.real_time_status.includes('Open')) {
        return {
          status: 'open',
          statusText: 'Open Now',
          statusIcon: CheckCircle,
          statusColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      } else if (branch.real_time_status.includes('Closing Soon')) {
        return {
          status: 'closing-soon',
          statusText: branch.real_time_status,
          statusIcon: Timer,
          statusColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      } else if (branch.real_time_status.includes('Opening in')) {
        return {
          status: 'opening-soon',
          statusText: branch.real_time_status,
          statusIcon: Clock,
          statusColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      } else if (branch.real_time_status.includes('Closed Today')) {
        return {
          status: 'closed',
          statusText: 'Closed Today',
          statusIcon: AlertCircle,
          statusColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      } else {
        return {
          status: 'closed',
          statusText: 'Closed',
          statusIcon: AlertCircle,
          statusColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      }
    }
    
    // Fallback to client-side logic if no database status
    if (!branch.operating_hours) {
      return {
        status: 'unknown',
        statusText: 'Hours Unknown',
        statusIcon: AlertCircle,
        statusColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    }

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    // Get today's day name
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[currentDay]
    
    // Find today's operating hours from JSONB
    const todayHours = branch.operating_hours[todayName as keyof typeof branch.operating_hours]
    
    // Check if the day is closed
    if (!todayHours || 'closed' in todayHours) {
      return {
        status: 'closed',
        statusText: 'Closed Today',
        statusIcon: AlertCircle,
        statusColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }

    const openTime = todayHours.open
    const closeTime = todayHours.close
    
    if (!openTime || !closeTime) {
      return {
        status: 'unknown',
        statusText: 'Hours Unknown',
        statusIcon: AlertCircle,
        statusColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    }
    
    // Check if currently open
    if (currentTime >= openTime && currentTime <= closeTime) {
      // Check if closing soon (within 30 minutes)
      const closeTimeMinutes = timeToMinutes(closeTime)
      const currentTimeMinutes = timeToMinutes(currentTime)
      const timeUntilClose = closeTimeMinutes - currentTimeMinutes
      
      if (timeUntilClose <= 30 && timeUntilClose > 0) {
        return {
          status: 'closing-soon',
          statusText: `Closing Soon (${timeUntilClose} mins)`,
          statusIcon: Timer,
          statusColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      }
      
      return {
        status: 'open',
        statusText: 'Open Now',
        statusIcon: CheckCircle,
        statusColor: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else {
      // Check if opening soon (within 2 hours)
      const openTimeMinutes = timeToMinutes(openTime)
      const currentTimeMinutes = timeToMinutes(currentTime)
      const timeUntilOpen = openTimeMinutes - currentTimeMinutes
      
      if (timeUntilOpen <= 120 && timeUntilOpen > 0) {
        const hours = Math.floor(timeUntilOpen / 60)
        const minutes = timeUntilOpen % 60
        const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        
        return {
          status: 'opening-soon',
          statusText: `Opening in ${timeText}`,
          statusIcon: Clock,
          statusColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      }
      
      return {
        status: 'closed',
        statusText: 'Closed',
        statusIcon: AlertCircle,
        statusColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }
  }

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }


  const getPaymentOptions = (branch: Branch) => {
    // Use payment options from database if available
    if (branch.payment_options && branch.payment_options.length > 0) {
      return branch.payment_options.map(option => {
        const optionMap: { [key: string]: { icon: any, color: string, bgColor: string } } = {
          'GCash': { icon: Smartphone, color: 'text-blue-600', bgColor: 'bg-blue-50' },
          'PayMaya': { icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-50' },
          'Cash at Pickup': { icon: Banknote, color: 'text-green-600', bgColor: 'bg-green-50' }
        }
        
        const mapped = optionMap[option] || { icon: CreditCard, color: 'text-gray-600', bgColor: 'bg-gray-50' }
        
        return {
          icon: mapped.icon,
          text: option,
          color: mapped.color,
          bgColor: mapped.bgColor
        }
      })
    }
    
    // Fallback to default payment options
    return [
      {
        icon: Smartphone,
        text: 'GCash',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        icon: CreditCard,
        text: 'PayMaya',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        icon: Banknote,
        text: 'Cash at Pickup',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    ]
  }

  const getBranchTypeBadge = (branchType: string) => {
    switch (branchType) {
      case 'main':
        return {
          text: 'Main Branch',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'satellite':
        return {
          text: 'Branch Office',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      default:
        return {
          text: branchType.charAt(0).toUpperCase() + branchType.slice(1),
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const formatOperatingHours = (branch: Branch) => {
    if (!branch.operating_hours) {
      return 'Hours not available'
    }
    
    // Group hours by time ranges from JSONB structure
    const timeGroups: { [key: string]: string[] } = {}
    
    Object.entries(branch.operating_hours).forEach(([day, hours]) => {
      if (hours && !('closed' in hours) && 'open' in hours && 'close' in hours) {
        const timeKey = `${hours.open}-${hours.close}`
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = []
        }
        timeGroups[timeKey].push(day.charAt(0).toUpperCase() + day.slice(1))
      }
    })
    
    // Format the hours display
    const timeRanges = Object.keys(timeGroups)
    if (timeRanges.length === 0) {
      return 'Hours not available'
    }
    
    // If all days have the same hours, show simplified format
    if (timeRanges.length === 1) {
      const timeRange = timeRanges[0]
      const days = timeGroups[timeRange]
      const [open, close] = timeRange.split('-')
      
      return {
        days: days,
        hours: `${open} - ${close}`,
        fullText: `${days.join(', ')}: ${open} - ${close}`,
        isSimplified: true
      }
    }
    
    // Multiple time ranges - show detailed format
    const detailedHours = timeRanges.map(timeRange => {
      const days = timeGroups[timeRange]
      const [open, close] = timeRange.split('-')
      return `${days.join(', ')}: ${open} - ${close}`
    })
    
    return {
      days: Object.values(timeGroups).flat(),
      hours: timeRanges[0].split('-').join(' - '),
      fullText: detailedHours.join(' | '),
      isSimplified: false,
      detailedHours: detailedHours
    }
  }


  if (isLoading) {
    console.log('⏳ BranchSelection: Rendering loading state')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading branches..." size="lg" />
      </div>
    )
  }

  if (error) {
    console.log('❌ BranchSelection: Rendering error state:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ErrorMessage message={error} />
          <button
            onClick={loadBranches}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Your Branch
            </h1>
            <p className="text-gray-600 text-lg">
              Select the AgriVet branch where you'd like to pick up your order
            </p>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Available Branches
          </h2>
          <p className="text-gray-600 text-center">
            All branches offer the same quality products and services
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {branches
            .filter(() => {
              // Optional: Filter out closed branches
              // Uncomment the next line if you want to hide closed branches
              // return isBranchOpen(branch.id)
              return true // Show all active branches regardless of current status
            })
            .map((branch) => {
            console.log('🎨 BranchSelection: Rendering branch card for:', branch.name)
            const status = getSmartBranchStatus(branch)
            const StatusIcon = status.statusIcon
            const paymentOptions = getPaymentOptions(branch)
            const branchTypeBadge = getBranchTypeBadge(branch.branch_type)
            const operatingHours = formatOperatingHours(branch)
            console.log('🎨 BranchSelection: Branch status:', status)

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
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${branchTypeBadge.color}`}>
                        {branchTypeBadge.text}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      <Building className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">{branch.code}</span>
                    </div>
                    
                    <div className="flex items-start text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm leading-relaxed">
                        <p>{branch.address}</p>
                        <p>{branch.city}, {branch.province}</p>
                        {branch.postal_code && (
                          <p className="text-xs text-gray-500">{branch.postal_code}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-gray-600 mb-3">
                      <div className="flex items-center mb-1">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium">Operating Hours</span>
                      </div>
                      <div className="ml-6">
                        <div className="text-sm">
                          {typeof operatingHours === 'string' ? (
                            <span className="text-gray-500">{operatingHours}</span>
                          ) : operatingHours.isSimplified ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {operatingHours.hours}
                              </div>
                              <div className="text-xs text-gray-500">
                                {operatingHours.days.join(', ')}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              {operatingHours.detailedHours?.map((hours, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  {hours}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center text-gray-600 mb-3">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a 
                          href={`tel:${branch.phone}`}
                          className="text-sm hover:text-agrivet-green transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {branch.phone}
                        </a>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center text-gray-600 mb-4">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a 
                          href={`mailto:${branch.email}`}
                          className="text-sm hover:text-agrivet-green transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {branch.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Smart Status Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${status.bgColor} ${status.borderColor} border`}>
                  <StatusIcon className={`w-4 h-4 mr-2 ${status.statusColor}`} />
                  <span className={status.statusColor}>{status.statusText}</span>
                </div>

                {/* Payment Options */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {paymentOptions.map((option, index) => {
                      const OptionIcon = option.icon
                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${option.bgColor}`}
                        >
                          <OptionIcon className={`w-3 h-3 ${option.color}`} />
                          <span className={option.color}>{option.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Select Button */}
                <div className="pt-4 border-t border-gray-100">
                  <button className="w-full btn-primary text-sm py-2">
                    Select This Branch
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {branches.length === 0 && (() => {
          console.log('📭 BranchSelection: Rendering empty state - no branches found')
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Branches Available</h3>
              <p className="text-gray-600 mb-4">
                We're currently setting up branches in your area. Please check back later.
              </p>
              <button
                onClick={loadBranches}
                className="btn-outline"
              >
                Refresh
              </button>
            </div>
          )
        })()}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Why Choose AgriVet?
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Quality Products</h4>
                <p className="text-sm text-gray-600 text-center">
                  Premium agricultural supplies and veterinary products
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Convenient Pickup</h4>
                <p className="text-sm text-gray-600 text-center">
                  Order online and pick up at your preferred branch
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Expert Support</h4>
                <p className="text-sm text-gray-600 text-center">
                  Knowledgeable staff to help with your agricultural needs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Closed Branch Modal */}
      {selectedClosedBranch && (
        <ClosedBranchModal
          isOpen={showClosedModal}
          onClose={handleCloseModal}
          branchName={selectedClosedBranch.name}
          nextOpeningTime={getNextOpeningTime(selectedClosedBranch)}
          onSetReminder={handleSetReminder}
          onFindAnotherBranch={handleFindAnotherBranch}
          onBrowseAnyway={handleBrowseAnyway}
        />
      )}
    </div>
  )
}

export default BranchSelection