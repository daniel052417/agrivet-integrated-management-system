import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Branch, BranchContextType, BranchAvailability } from '../types'
import { branchService } from '../services/branchService'

interface OptimizedBranchContextType extends BranchContextType {
  isInitializing: boolean
  lastSyncTime: number | null
  refreshBranches: () => Promise<void>
  isRefreshing: boolean
}

const BranchContext = createContext<OptimizedBranchContextType | undefined>(undefined)

interface BranchProviderProps {
  children: ReactNode
}

// Cache configuration
const CACHE_KEYS = {
  SELECTED_BRANCH: 'agrivet-selected-branch',
  AVAILABLE_BRANCHES: 'agrivet-available-branches',
  BRANCH_AVAILABILITY: 'agrivet-branch-availability',
  LAST_SYNC: 'agrivet-branches-last-sync',
  CACHE_VERSION: 'agrivet-branches-cache-version'
}

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const CACHE_VERSION = '1.0.0'

export const OptimizedBranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [branchAvailability, setBranchAvailability] = useState<BranchAvailability[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  // Load cached data immediately for instant UI
  useEffect(() => {
    const loadCachedData = () => {
      try {
        console.log('🚀 BranchContext: Loading cached data for instant UI...')
        
        // Load selected branch
        const cachedSelectedBranch = localStorage.getItem(CACHE_KEYS.SELECTED_BRANCH)
        if (cachedSelectedBranch) {
          const parsedBranch = JSON.parse(cachedSelectedBranch)
          setSelectedBranch(parsedBranch)
          console.log('✅ BranchContext: Loaded cached selected branch:', parsedBranch.name)
        }

        // Load available branches
        const cachedBranches = localStorage.getItem(CACHE_KEYS.AVAILABLE_BRANCHES)
        const cachedAvailability = localStorage.getItem(CACHE_KEYS.BRANCH_AVAILABILITY)
        const cachedSyncTime = localStorage.getItem(CACHE_KEYS.LAST_SYNC)
        const cachedVersion = localStorage.getItem(CACHE_KEYS.CACHE_VERSION)

        if (cachedBranches && cachedAvailability && cachedSyncTime && cachedVersion === CACHE_VERSION) {
          const branches = JSON.parse(cachedBranches)
          const availability = JSON.parse(cachedAvailability)
          const syncTime = parseInt(cachedSyncTime)

          // Check if cache is still valid
          const isCacheValid = Date.now() - syncTime < CACHE_TTL

          if (isCacheValid) {
            console.log('✅ BranchContext: Loading cached branches and availability')
            setAvailableBranches(branches)
            setBranchAvailability(availability)
            setLastSyncTime(syncTime)
          } else {
            console.log('⏰ BranchContext: Cache expired, will refresh in background')
          }
        }
      } catch (error) {
        console.error('❌ BranchContext: Error loading cached data:', error)
      }
    }

    loadCachedData()
  }, [])

  // Initialize and start background sync
  useEffect(() => {
    const initializeBranches = async () => {
      try {
        console.log('🔄 BranchContext: Initializing branches...')
        await refreshBranches(true)
      } catch (error) {
        console.error('❌ BranchContext: Error initializing branches:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeBranches()
  }, [])

  // Background sync interval
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      console.log('🔄 BranchContext: Background sync...')
      await refreshBranches(false)
    }, SYNC_INTERVAL)

    return () => clearInterval(syncInterval)
  }, [])

  const cacheBranchData = (branches: Branch[], availability: BranchAvailability[]) => {
    try {
      localStorage.setItem(CACHE_KEYS.AVAILABLE_BRANCHES, JSON.stringify(branches))
      localStorage.setItem(CACHE_KEYS.BRANCH_AVAILABILITY, JSON.stringify(availability))
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString())
      localStorage.setItem(CACHE_KEYS.CACHE_VERSION, CACHE_VERSION)
    } catch (error) {
      console.error('❌ BranchContext: Error caching branch data:', error)
    }
  }

  const refreshBranches = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsRefreshing(true)
      }

      console.log('🔄 BranchContext: Refreshing branches...')
      
      // Load branches and availability in parallel
      const [branches, availability] = await Promise.all([
        branchService.getBranches(),
        branchService.getBranchAvailability()
      ])

      console.log('✅ BranchContext: Branches refreshed successfully', {
        branchesCount: branches.length,
        availabilityCount: availability.length
      })

      setAvailableBranches(branches)
      setBranchAvailability(availability)
      setLastSyncTime(Date.now())

      // Cache the data
      cacheBranchData(branches, availability)

      // Validate selected branch is still available
      if (selectedBranch) {
        const isStillAvailable = branches.some(branch => branch.id === selectedBranch.id)
        if (!isStillAvailable) {
          console.log('⚠️ BranchContext: Selected branch no longer available, clearing selection')
          setSelectedBranch(null)
        }
      }

    } catch (error) {
      console.error('❌ BranchContext: Error refreshing branches:', error)
      
      // On error, set empty arrays to prevent infinite loading
      if (isInitialLoad) {
        setAvailableBranches([])
        setBranchAvailability([])
      }
    } finally {
      if (isInitialLoad) {
        setIsRefreshing(false)
      }
    }
  }, [selectedBranch])

  const selectBranch = (branch: Branch) => {
    console.log('🎯 BranchContext: Selecting branch:', branch.name)
    setSelectedBranch(branch)
  }

  const clearBranch = () => {
    console.log('🧹 BranchContext: Clearing selected branch')
    setSelectedBranch(null)
  }

  const isBranchOpen = (branchId: string): boolean => {
    const availability = branchAvailability.find(avail => avail.branchId === branchId)
    if (!availability) return false

    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    const isTodayOpen = availability.operatingHours.days.includes(currentDay)
    const isWithinHours = currentTime >= availability.operatingHours.open && 
                         currentTime <= availability.operatingHours.close

    return availability.isOpen && isTodayOpen && isWithinHours
  }

  const value: OptimizedBranchContextType = {
    selectedBranch,
    availableBranches,
    branchAvailability,
    isInitializing,
    lastSyncTime,
    isRefreshing,
    selectBranch,
    clearBranch,
    refreshBranches,
    isBranchOpen
  }

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  )
}

export const useOptimizedBranch = (): OptimizedBranchContextType => {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useOptimizedBranch must be used within an OptimizedBranchProvider')
  }
  return context
}









