import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { realtimeService } from '../services/realtimeService'

interface RealtimeContextType {
  isConnected: boolean
  activeSubscriptions: number
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting'
  lastUpdate: Date | null
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

interface RealtimeProviderProps {
  children: ReactNode
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [activeSubscriptions, setActiveSubscriptions] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    console.log('🔄 RealtimeContext: Initializing real-time service...')
    
    // Set up callbacks for connection status
    realtimeService.setCallbacks({
      onConnectionStatusChange: (status) => {
        console.log('📡 RealtimeContext: Connection status changed:', status)
        setConnectionStatus(status)
        setIsConnected(status === 'connected')
        
        if (status === 'connected') {
          setLastUpdate(new Date())
        }
      },
      onInventoryUpdate: () => {
        setLastUpdate(new Date())
      },
      onBranchUpdate: () => {
        setLastUpdate(new Date())
      },
      onProductUpdate: () => {
        setLastUpdate(new Date())
      },
      onCategoryUpdate: () => {
        setLastUpdate(new Date())
      },
      onPromotionUpdate: () => {
        setLastUpdate(new Date())
      }
    })

    // Monitor subscription count
    const updateSubscriptionCount = () => {
      const count = realtimeService.getActiveSubscriptionsCount()
      setActiveSubscriptions(count)
    }

    // Update subscription count periodically
    const interval = setInterval(updateSubscriptionCount, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const value: RealtimeContextType = {
    isConnected,
    activeSubscriptions,
    connectionStatus,
    lastUpdate
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}




