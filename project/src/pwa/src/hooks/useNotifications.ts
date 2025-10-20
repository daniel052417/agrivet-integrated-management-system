import { useState, useEffect, useCallback } from 'react'
import { NotificationHookOptions, NotificationHookReturn, NotificationData } from '../types'

export const useNotifications = (options: NotificationHookOptions = {}): NotificationHookReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  const {
    onPermissionGranted,
    onPermissionDenied,
    onNotificationClick,
    onNotificationError
  } = options

  // Check notification support and permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsSupported('Notification' in window)
    
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      const error = new Error('Notifications are not supported in this browser')
      onNotificationError?.(error)
      throw error
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        onPermissionGranted?.()
      } else {
        onPermissionDenied?.()
      }
      
      return result
    } catch (error) {
      onNotificationError?.(error as Error)
      throw error
    }
  }, [isSupported, onPermissionGranted, onPermissionDenied, onNotificationError])

  // Show notification
  const showNotification = useCallback(async (data: NotificationData): Promise<void> => {
    if (!isSupported) {
      const error = new Error('Notifications are not supported in this browser')
      onNotificationError?.(error)
      throw error
    }

    if (permission !== 'granted') {
      const error = new Error('Notification permission not granted')
      onNotificationError?.(error)
      throw error
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/pwa-192x192.png',
        badge: data.badge || '/pwa-192x192.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      })

      // Handle notification click
      notification.onclick = (event) => {
        onNotificationClick?.(notification)
        
        // Focus the window
        if (window.focus) {
          window.focus()
        }
        
        // Navigate to URL if provided
        if (data.data?.url) {
          window.location.href = data.data.url
        }
        
        notification.close()
      }

      // Auto-close after 5 seconds if not requiring interaction
      if (!data.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

    } catch (error) {
      onNotificationError?.(error as Error)
      throw error
    }
  }, [isSupported, permission, onNotificationClick, onNotificationError])

  // Schedule notification
  const scheduleNotification = useCallback(async (
    data: NotificationData, 
    delay: number
  ): Promise<void> => {
    if (delay <= 0) {
      return showNotification(data)
    }

    setTimeout(() => {
      showNotification(data).catch(error => {
        onNotificationError?.(error)
      })
    }, delay)
  }, [showNotification, onNotificationError])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.getNotifications().then(notifications => {
            notifications.forEach(notification => notification.close())
          })
        })
      })
    }
  }, [])

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleNotification,
    clearNotifications
  }
}

export default useNotifications
