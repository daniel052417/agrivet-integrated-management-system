import React, { useState } from 'react'
import { Download, X } from 'lucide-react'
import { usePWA } from '../../contexts/PWAContext'

const InstallPrompt: React.FC = () => {
  const { installApp } = usePWA()
  const [isInstalling, setIsInstalling] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      await installApp()
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  if (isDismissed) {
    return null
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Download className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="text-blue-900 font-medium text-sm">
              Install AgriVet Kiosk
            </p>
            <p className="text-blue-700 text-xs">
              Get quick access and better experience
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isInstalling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Install</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
