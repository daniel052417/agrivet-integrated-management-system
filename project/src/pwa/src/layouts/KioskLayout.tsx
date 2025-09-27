import React, { ReactNode } from 'react'
import { usePWA } from '../contexts/PWAContext'
import OfflineIndicator from '../components/common/OfflineIndicator'
import InstallPrompt from '../components/common/InstallPrompt'

interface KioskLayoutProps {
  children: ReactNode
}

const KioskLayout: React.FC<KioskLayoutProps> = ({ children }) => {
  const { settings } = usePWA()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      {!settings.isOnline && <OfflineIndicator />}
      
      {/* Install Prompt */}
      {settings.canInstall && !settings.isInstalled && <InstallPrompt />}
      
      {/* Main Content */}
      {children}
    </div>
  )
}

export default KioskLayout
