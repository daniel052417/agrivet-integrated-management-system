import React from 'react'
import { Wifi, WifiOff } from 'lucide-react'

const OfflineIndicator: React.FC = () => {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <WifiOff className="w-4 h-4 text-yellow-600 mr-2" />
        <span className="text-yellow-800 text-sm font-medium">
          You're offline. Some features may not be available.
        </span>
      </div>
    </div>
  )
}

export default OfflineIndicator
