import React from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Database, Smartphone } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

interface CartSyncStatusProps {
  className?: string
  showDetails?: boolean
}

const CartSyncStatus: React.FC<CartSyncStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { isLoading, lastSaveTime, saveToLocalStorage } = useCart()
  const [storageInfo, setStorageInfo] = React.useState<{
    hasIndexedDB: boolean
    hasLocalStorage: boolean
    sessionId: string
  } | null>(null)

  React.useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await useCart().getStorageInfo?.()
        if (info) {
          setStorageInfo(info)
        }
      } catch (error) {
        console.error('Failed to get storage info:', error)
      }
    }
    loadStorageInfo()
  }, [])

  const handleSave = async () => {
    if (saveToLocalStorage) {
      try {
        await saveToLocalStorage()
      } catch (error) {
        console.error('Manual save failed:', error)
      }
    }
  }

  const formatLastSave = (date: Date | null) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
    }
    
    if (storageInfo?.hasIndexedDB) {
      return <Database className="w-4 h-4 text-green-500" />
    }
    
    if (storageInfo?.hasLocalStorage) {
      return <Smartphone className="w-4 h-4 text-blue-500" />
    }
    
    return <AlertCircle className="w-4 h-4 text-yellow-500" />
  }

  const getStatusText = () => {
    if (isLoading) return 'Saving...'
    if (storageInfo?.hasIndexedDB) return `Saved ${formatLastSave(lastSaveTime)}`
    if (storageInfo?.hasLocalStorage) return `Saved ${formatLastSave(lastSaveTime)}`
    return 'Not saved'
  }

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-600'
    if (storageInfo?.hasIndexedDB || storageInfo?.hasLocalStorage) return 'text-green-600'
    return 'text-yellow-600'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Save cart to local storage"
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </button>

      {showDetails && storageInfo && (
        <div className="text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            {storageInfo.hasIndexedDB ? (
              <>
                <Database className="w-3 h-3" />
                <span>IndexedDB</span>
              </>
            ) : storageInfo.hasLocalStorage ? (
              <>
                <Smartphone className="w-3 h-3" />
                <span>LocalStorage</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>No Storage</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CartSyncStatus
