import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, Clock, CheckCircle, AlertCircle, Phone, Users, Truck, Mail, Building,
  CreditCard, Smartphone, Banknote, Timer, ArrowLeft
} from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { useAuth } from '../contexts/AuthContext'
import { Branch } from '../types'
import { branchService } from '../services/branchService'
import { supabase } from '../services/supabase'
import ErrorMessage from '../components/common/ErrorMessage'
import ClosedBranchModal from '../components/modals/ClosedBranchModal'
import { getNextOpeningTime, isBranchClosed } from '../utils/branchUtils'

const BranchSelection: React.FC = () => {
  const navigate = useNavigate()
  const { 
    selectBranch,
    refreshBranches
  } = useBranch()
  const { user, isAuthenticated } = useAuth()
  
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
      
      console.log('🔄 BranchSelection: Calling branchService.getBranches()...')
      const branches = await branchService.getBranches()
      console.log('📊 BranchSelection: Branches received from service:', branches)
      console.log('📊 BranchSelection: Number of branches:', branches.length)
      
      console.log('🔄 BranchSelection: Calling refreshBranches()...')
      await refreshBranches()
      
      if (branches.length > 0) {
        console.log('✅ BranchSelection: Using real database data')
        setBranches(branches)
      } else {
        console.log('⚠️ BranchSelection: No branches available')
        setBranches([])
        setError('No branches available. Please contact support.')
      }
      
      console.log('✅ BranchSelection: Branches loaded successfully')
    } catch (err) {
      console.error('❌ BranchSelection: Error loading branches:', err)
      setBranches([])
      setError('Failed to load branches. Please try again.')
    } finally {
      console.log('🏁 BranchSelection: Loading process completed')
      setIsLoading(false)
    }
  }

  const handleBranchSelect = async (branch: Branch) => {
    console.log('🎯 BranchSelection: Branch selected:', branch)
    
    if (isBranchClosed(branch)) {
      console.log('🚫 BranchSelection: Branch is closed, showing modal')
      setSelectedClosedBranch(branch)
      setShowClosedModal(true)
      return
    }
    
    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('customers')
          .update({
            preferred_branch_id: branch.id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('Error saving preferred branch:', error)
        } else {
          console.log('✅ Preferred branch saved for user')
        }
      } catch (error) {
        console.error('Error updating preferred branch:', error)
      }
    }
    
    selectBranch(branch)
    navigate('/auth-selection')
  }

  const handleSetReminder = () => {
    console.log('⏰ BranchSelection: Set reminder clicked')
    setShowClosedModal(false)
  }

  const handleFindAnotherBranch = () => {
    console.log('🔍 BranchSelection: Find another branch clicked')
    setShowClosedModal(false)
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

  const handleBackToHome = () => {
    window.location.href = 'http://localhost:3000'
  }

  const getSmartBranchStatus = (branch: Branch) => {
    console.log('🕐 BranchSelection: Checking smart status for branch:', branch.name)
    
    if (branch.real_time_status) {
      console.log('🕐 BranchSelection: Using database real-time status:', branch.real_time_status)
      
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
    const currentDay = now.getDay()
    const currentTime = now.toLocaleTimeString('en-PH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[currentDay]
    
    const todayHours = branch.operating_hours[todayName as keyof typeof branch.operating_hours]
    
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
    
    if (currentTime >= openTime && currentTime <= closeTime) {
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

  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const getPaymentOptions = (branch: Branch) => {
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
    
    const timeRanges = Object.keys(timeGroups)
    if (timeRanges.length === 0) {
      return 'Hours not available'
    }
    
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading branches...</p>
          <p className="text-gray-500 text-sm mt-2">Finding the best location for you</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
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
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 ${showClosedModal ? 'overflow-hidden' : ''}`}>
      {/* Enhanced Header with Branding */}
      <div className={`bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-10 ${showClosedModal ? 'pointer-events-none' : ''}`}>
        <div className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            {/* Back Button */}
            <button
              onClick={handleBackToHome}
              className="flex items-center space-x-1.5 md:space-x-2 text-gray-600 hover:text-green-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm md:text-base">Back to Home</span>
            </button>

            {/* Logo/Brand */}
            {/* <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌾</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Tiongson <span className="text-green-600">AgriVet</span>
                </h1>
                <p className="text-xs text-gray-500">Your Agricultural Partner</p>
              </div>
            </div> */}

            {/* User Info (if authenticated) */}
            {isAuthenticated && user && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-50 rounded-lg">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-xs md:text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">
                  {user.email?.split('@')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Title Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1.5 md:mb-2">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Branch</span>
            </h2>
            <p className="text-gray-600 text-base md:text-lg px-2">
              Select the AgriVet branch where you'd like to pick up your order
            </p>
          </div>
        </div>
      </div>

      {/* Main Content with Decorative Background */}
      <div className="relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Branches Grid */}
        <div className="relative max-w-6xl mx-auto px-3 py-6 md:px-4 md:py-12">
          {/* Section Header */}
          <div className="mb-4 md:mb-8 text-center">
            <div className="inline-flex items-center space-x-1.5 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-3 md:mb-4">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              <span className="text-xs md:text-sm font-semibold text-gray-700">
                {branches.length} Branches Available
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-2">
              Our Locations in Talisay City
            </h3>
            <p className="text-gray-600 text-sm md:text-base px-2">
              All branches offer the same quality products and expert service
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => {
              const status = getSmartBranchStatus(branch)
              const StatusIcon = status.statusIcon
              const paymentOptions = getPaymentOptions(branch)
              const branchTypeBadge = getBranchTypeBadge(branch.branch_type)
              const operatingHours = formatOperatingHours(branch)

              return (
                <div
                  key={branch.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border-2 border-white/50 p-4 md:p-6 hover:shadow-2xl md:hover:scale-105 hover:border-green-300 transition-all duration-300 cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                  onClick={() => handleBranchSelect(branch)}
                >
                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 md:group-hover:scale-150 transition-transform duration-500"></div>

                  {/* Branch Header */}
                  <div className="relative flex items-start justify-between mb-4 md:mb-6">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {branch.name}
                        </h3>
                        <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border ${branchTypeBadge.color}`}>
                          {branchTypeBadge.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1 mb-1.5 md:mb-2">
                        <Building className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] md:text-xs text-gray-500 font-medium">{branch.code}</span>
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-start text-gray-600 mb-2 md:mb-3">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                        <div className="text-xs md:text-sm leading-relaxed">
                          <p>{branch.address}</p>
                          <p>{branch.city}, {branch.province}</p>
                          {branch.postal_code && (
                            <p className="text-[10px] md:text-xs text-gray-500">{branch.postal_code}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Operating Hours */}
                      <div className="text-gray-600 mb-2 md:mb-3">
                        <div className="flex items-center mb-1">
                          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0 text-green-600" />
                          <span className="text-xs md:text-sm font-medium">Operating Hours</span>
                        </div>
                        <div className="ml-5 md:ml-6">
                          <div className="text-xs md:text-sm">
                            {typeof operatingHours === 'string' ? (
                              <span className="text-gray-500">{operatingHours}</span>
                            ) : operatingHours.isSimplified ? (
                              <>
                                <div className="text-xs md:text-sm font-medium text-gray-900">
                                  {operatingHours.hours}
                                </div>
                                <div className="text-[10px] md:text-xs text-gray-500">
                                  {operatingHours.days.join(', ')}
                                </div>
                              </>
                            ) : (
                              <div className="space-y-0.5 md:space-y-1">
                                {operatingHours.detailedHours?.map((hours: string, index: number) => (
                                  <div key={index} className="text-[10px] md:text-xs text-gray-600">
                                    {hours}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      {branch.phone && (
                        <div className="flex items-center text-gray-600 mb-1.5 md:mb-2">
                          <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0 text-green-600" />
                          <a 
                            href={`tel:${branch.phone}`}
                            className="text-xs md:text-sm hover:text-green-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {branch.phone}
                          </a>
                        </div>
                      )}

                      {branch.email && (
                        <div className="flex items-center text-gray-600 mb-3 md:mb-4">
                          <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0 text-green-600" />
                          <a 
                            href={`mailto:${branch.email}`}
                            className="text-xs md:text-sm hover:text-green-600 transition-colors break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {branch.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Status Badge */}
                  <div className={`inline-flex items-center px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4 ${status.bgColor} ${status.borderColor} border-2 shadow-sm`}>
                    <StatusIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 ${status.statusColor}`} />
                    <span className={status.statusColor}>{status.statusText}</span>
                  </div>

                  {/* Payment Options */}
                  <div className="mb-4 md:mb-6">
                    <h4 className="text-xs md:text-sm font-medium text-gray-900 mb-2 md:mb-3 flex items-center">
                      <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-green-600" />
                      Payment Options
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {paymentOptions.map((option: any, index: number) => {
                        const OptionIcon = option.icon
                        return (
                          <div
                            key={index}
                            className={`flex items-center space-x-1 md:space-x-1.5 text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-full ${option.bgColor} border border-transparent hover:border-current transition-all`}
                          >
                            <OptionIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${option.color}`} />
                            <span className={`${option.color} font-medium`}>{option.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Select Button */}
                  <div className="pt-3 md:pt-4 border-t border-gray-100">
                    <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl hover:shadow-lg md:hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95">
                      <span>Select This Branch</span>
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {branches.length === 0 && (
            <div className="text-center py-8 md:py-12 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg max-w-md mx-auto px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Building className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1.5 md:mb-2">No Branches Available</h3>
              <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">
                We're currently setting up branches in your area. Please check back later.
              </p>
              <button
                onClick={loadBranches}
                className="btn-outline text-sm md:text-base"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Footer Info */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-green-100 mt-6 md:mt-12">
        <div className="max-w-6xl mx-auto px-3 py-6 md:px-4 md:py-12">
          <div className="text-center mb-4 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-2">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Tiongson AgriVet</span>?
            </h3>
            <p className="text-gray-600 text-sm md:text-base">Your trusted agricultural partner since 2014</p>
          </div>
          <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl border border-green-100">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">Quality Products</h4>
              <p className="text-xs md:text-sm text-gray-600 text-center">
                Premium agricultural supplies and veterinary products from trusted brands
              </p>
            </div>
            <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl md:rounded-2xl border border-blue-100">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                <Truck className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">Convenient Pickup</h4>
              <p className="text-xs md:text-sm text-gray-600 text-center">
                Order online and pick up at your preferred branch location
              </p>
            </div>
            <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl md:rounded-2xl border border-purple-100">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">Expert Support</h4>
              <p className="text-xs md:text-sm text-gray-600 text-center">
                Knowledgeable staff ready to help with all your agricultural needs
              </p>
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