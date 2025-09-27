import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PWASettings, PWAContextType } from '../types'

const PWAContext = createContext<PWAContextType | undefined>(undefined)

interface PWAProviderProps {
  children: ReactNode
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PWASettings>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    installPrompt: null
  })

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://')
      
      setSettings(prev => ({ ...prev, isInstalled }))
    }

    // Check online status
    const handleOnline = () => setSettings(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSettings(prev => ({ ...prev, isOnline: false }))

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setSettings(prev => ({ 
        ...prev, 
        canInstall: true, 
        installPrompt: e 
      }))
    }

    // Check app installed status
    window.addEventListener('appinstalled', () => {
      setSettings(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false 
      }))
    })

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)

    // Initial checks
    checkInstalled()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    }
  }, [])

  const updateSettings = (newSettings: Partial<PWASettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const installApp = async () => {
    if (settings.installPrompt) {
      const result = await (settings.installPrompt as any).prompt()
      console.log('Install prompt result:', result)
      
      if (result.outcome === 'accepted') {
        setSettings(prev => ({ 
          ...prev, 
          isInstalled: true, 
          canInstall: false 
        }))
      }
    }
  }

  const checkOnlineStatus = () => {
    return navigator.onLine
  }

  const value: PWAContextType = {
    settings,
    updateSettings,
    installApp,
    checkOnlineStatus
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}
