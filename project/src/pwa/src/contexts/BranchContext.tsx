import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Branch, BranchContextType, BranchAvailability } from '../types'
import { branchService } from '../services/branchService'
import { initializeAnonymousSession } from '../services/supabase'

const BranchContext = createContext<BranchContextType | undefined>(undefined)

interface BranchProviderProps {
  children: ReactNode
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [branchAvailability, setBranchAvailability] = useState<BranchAvailability[]>([])

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

  // Initialize anonymous session and load branches on mount
  useEffect(() => {
    const initializeAndLoad = async () => {
      console.log('🔐 BranchContext: Initializing anonymous session...')
      await initializeAnonymousSession()
      console.log('🔄 BranchContext: Loading branches...')
      refreshBranches()
    }
    initializeAndLoad()
  }, [])

  const selectBranch = (branch: Branch) => {
    setSelectedBranch(branch)
  }

  const clearBranch = () => {
    setSelectedBranch(null)
  }

  const refreshBranches = async () => {
    try {
      console.log('🔄 BranchContext: Starting refreshBranches...')
      console.log('🔄 BranchContext: Calling branchService.getBranches()...')
      const branches = await branchService.getBranches()
      console.log('📊 BranchContext: Branches received from service:', branches)
      console.log('📊 BranchContext: Number of branches:', branches.length)
      setAvailableBranches(branches)
      
      // Load branch availability
      console.log('🔄 BranchContext: Calling branchService.getBranchAvailability()...')
      const availability = await branchService.getBranchAvailability()
      console.log('📊 BranchContext: Availability received from service:', availability)
      setBranchAvailability(availability)
      console.log('✅ BranchContext: refreshBranches completed successfully')
    } catch (error) {
      console.error('❌ BranchContext: Error refreshing branches:', error)
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
    isBranchOpen
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
