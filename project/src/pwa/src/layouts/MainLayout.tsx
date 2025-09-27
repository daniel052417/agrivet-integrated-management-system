import React, { ReactNode } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { usePWA } from '../contexts/PWAContext'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import OfflineIndicator from '../components/common/OfflineIndicator'
import InstallPrompt from '../components/common/InstallPrompt'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { selectedBranch } = useBranch()
  const { settings } = usePWA()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Offline Indicator */}
      {!settings.isOnline && <OfflineIndicator />}
      
      {/* Install Prompt */}
      {settings.canInstall && !settings.isInstalled && <InstallPrompt />}
      
      {/* Header */}
      <Header branch={selectedBranch} />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default MainLayout
