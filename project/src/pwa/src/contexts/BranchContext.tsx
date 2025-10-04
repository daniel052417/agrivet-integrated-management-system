import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Branch, BranchContextType, BranchAvailability } from '../types'
import { branchService } from '../services/branchService'
import { realtimeService } from '../services/realtimeService'

const BranchContext = createContext<BranchContextType | undefined>(undefined)

interface BranchProviderProps {
  children: ReactNode
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [branchAvailability, setBranchAvailability] = useState<BranchAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false) // Changed from true
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  const CACHE_KEYS = {
    BRANCHES: 'branches_cache',
    SELECTED_BRANCH: 'selected_branch',
    BRANCH_AVAILABILITY: 'branch_availability_cache',
    CACHE_TIME: 'branches_cache_time'
  }

  // Load selected branch from localStorage on mount
  useEffect(() => {
    const savedBranch = localStorage.getItem('agrivet-selected-branch')
    if (savedBranch) {
      try {
        const parsedBranch = JSON.parse(savedBranch)
        setSelectedBranch(parsedBranch)
      } catch (error) {
        console.error('Error loading selected branch from localStorage:', error)
      }
    }
  }, [])

  // Save selected branch to localStorage whenever it changes
  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem('agrivet-selected-branch', JSON.stringify(selectedBranch))
    } else {
      localStorage.removeItem('agrivet-selected-branch')
    }
  }, [selectedBranch])

  // Load cached data immediately, then refresh in background
  useEffect(() => {
    const initializeBranches = async () => {
      console.log('🔄 BranchContext: Initializing with optimistic caching...')
      
      // 1. Load from cache first (instant)
      const cachedBranches = localStorage.getItem(CACHE_KEYS.BRANCHES)
      const cachedAvailability = localStorage.getItem(CACHE_KEYS.BRANCH_AVAILABILITY)
      const cacheTime = localStorage.getItem(CACHE_KEYS.CACHE_TIME)
      
      // Check if cache is still fresh
      const isCacheFresh = cacheTime && 
        (Date.now() - parseInt(cacheTime)) < CACHE_DURATION
      
      if (cachedBranches && isCacheFresh) {
        // Use fresh cache without refreshing
        try {
          const parsedBranches = JSON.parse(cachedBranches)
          setAvailableBranches(parsedBranches)
          console.log('✅ BranchContext: Using fresh cache:', parsedBranches.length, 'branches')
          
          if (cachedAvailability) {
            const parsedAvailability = JSON.parse(cachedAvailability)
            setBranchAvailability(parsedAvailability)
            console.log('✅ BranchContext: Using fresh availability cache')
          }
        } catch (e) {
          console.error('❌ BranchContext: Failed to parse cached data')
        }
      } else if (cachedBranches) {
        // Cache expired or doesn't exist - load from cache but refresh
        try {
          const parsedBranches = JSON.parse(cachedBranches)
          setAvailableBranches(parsedBranches)
          console.log('⚠️ BranchContext: Using stale cache, refreshing in background...')
          
          if (cachedAvailability) {
            const parsedAvailability = JSON.parse(cachedAvailability)
            setBranchAvailability(parsedAvailability)
          }
        } catch (e) {
          console.error('❌ BranchContext: Failed to parse stale cache')
        }
      }
      
      // 2. Refresh from database in background (no blocking)
      refreshBranches()
    }

    initializeBranches()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔄 BranchContext: Setting up real-time subscriptions...')
    
    // Set up callbacks for real-time updates
    realtimeService.setCallbacks({
      onBranchUpdate: (payload) => {
        console.log('📡 BranchContext: Real-time branch update received:', payload)
        handleRealtimeBranchUpdate(payload)
      },
      onConnectionStatusChange: (status) => {
        console.log('📡 BranchContext: Real-time connection status:', status)
        setIsRealtimeConnected(status === 'connected')
      }
    })

    // Subscribe to branch changes
    const branchSubscription = realtimeService.subscribeToBranches()
    
    return () => {
      console.log('🔌 BranchContext: Cleaning up real-time subscriptions...')
      if (branchSubscription) {
        branchSubscription.unsubscribe()
      }
    }
  }, [])

  // Handle real-time branch updates
  const handleRealtimeBranchUpdate = (payload: any) => {
    try {
      const { eventType, new: newData, old: oldData } = payload
      
      if (eventType === 'UPDATE' && newData) {
        // Update branch in available branches list
        setAvailableBranches(prevBranches => {
          const updatedBranches = prevBranches.map(branch => 
            branch.id === newData.id ? { ...branch, ...newData } : branch
          )
          
          // Update cache with new data
          localStorage.setItem(CACHE_KEYS.BRANCHES, JSON.stringify(updatedBranches))
          localStorage.setItem(CACHE_KEYS.CACHE_TIME, Date.now().toString())
          
          console.log('✅ BranchContext: Updated branch in real-time:', newData.name)
          return updatedBranches
        })

        // Update selected branch if it's the one being updated
        if (selectedBranch && selectedBranch.id === newData.id) {
          setSelectedBranch(prevBranch => ({ ...prevBranch, ...newData }))
          localStorage.setItem('agrivet-selected-branch', JSON.stringify({ ...selectedBranch, ...newData }))
          console.log('✅ BranchContext: Updated selected branch in real-time')
        }
      } else if (eventType === 'INSERT' && newData) {
        // Add new branch to the list
        setAvailableBranches(prevBranches => {
          const updatedBranches = [...prevBranches, newData]
          localStorage.setItem(CACHE_KEYS.BRANCHES, JSON.stringify(updatedBranches))
          localStorage.setItem(CACHE_KEYS.CACHE_TIME, Date.now().toString())
          console.log('✅ BranchContext: Added new branch in real-time:', newData.name)
          return updatedBranches
        })
      } else if (eventType === 'DELETE' && oldData) {
        // Remove branch from the list
        setAvailableBranches(prevBranches => {
          const updatedBranches = prevBranches.filter(branch => branch.id !== oldData.id)
          localStorage.setItem(CACHE_KEYS.BRANCHES, JSON.stringify(updatedBranches))
          localStorage.setItem(CACHE_KEYS.CACHE_TIME, Date.now().toString())
          console.log('✅ BranchContext: Removed branch in real-time:', oldData.name)
          return updatedBranches
        })

        // Clear selected branch if it was deleted
        if (selectedBranch && selectedBranch.id === oldData.id) {
          setSelectedBranch(null)
          localStorage.removeItem('agrivet-selected-branch')
          console.log('✅ BranchContext: Cleared selected branch (was deleted)')
        }
      }
    } catch (error) {
      console.error('❌ BranchContext: Error handling real-time branch update:', error)
    }
  }

  const selectBranch = (branch: Branch) => {
    setSelectedBranch(branch)
  }

  const clearBranch = () => {
    setSelectedBranch(null)
  }

  const refreshBranches = async () => {
    try {
      console.log('🔄 BranchContext: Refreshing branches from database...')
      setIsLoading(true)
      setError(null)
      
      // Load branches and availability in parallel
      const [branches, availability] = await Promise.all([
        branchService.getBranches(),
        branchService.getBranchAvailability()
      ])
      
      if (branches.length > 0) {
        setAvailableBranches(branches)
        setBranchAvailability(availability)
        
        // Update cache
        localStorage.setItem(CACHE_KEYS.BRANCHES, JSON.stringify(branches))
        localStorage.setItem(CACHE_KEYS.BRANCH_AVAILABILITY, JSON.stringify(availability))
        localStorage.setItem(CACHE_KEYS.CACHE_TIME, Date.now().toString())
        
        console.log('✅ BranchContext: Branches refreshed and cached:', branches.length, 'branches')
        
        // If we had a selected branch, update it with fresh data
        if (selectedBranch) {
          const updatedBranch = branches.find(b => b.id === selectedBranch.id)
          if (updatedBranch) {
            setSelectedBranch(updatedBranch)
            localStorage.setItem('agrivet-selected-branch', JSON.stringify(updatedBranch))
            console.log('✅ BranchContext: Updated selected branch with fresh data')
          }
        }
      }
    } catch (err) {
      console.error('❌ BranchContext: Error refreshing branches:', err)
      setError('Failed to load branches')
      // Don't clear existing data on error - keep using cache
    } finally {
      setIsLoading(false)
    }
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

  const value: BranchContextType = {
    selectedBranch,
    availableBranches,
    branchAvailability,
    selectBranch,
    clearBranch,
    refreshBranches,
    isBranchOpen,
    isRealtimeConnected
  }

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  )
}

export const useBranch = (): BranchContextType => {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}
