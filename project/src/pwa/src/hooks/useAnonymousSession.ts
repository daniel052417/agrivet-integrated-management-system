import { useState } from 'react'
import { startGuestSession, hasValidSession } from '../services/supabase'

/**
 * Hook to manage guest session state
 * No automatic initialization - only when explicitly called
 */
export const useGuestSession = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const success = await startGuestSession()
      
      if (success) {
        setIsInitialized(true)
        console.log('✅ Guest session started successfully')
        return true
      } else {
        setError('Failed to start guest session')
        console.warn('⚠️ Guest session start failed')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Guest session start error:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const checkSession = async (): Promise<boolean> => {
    try {
      const hasSession = await hasValidSession()
      setIsInitialized(hasSession)
      return hasSession
    } catch (err) {
      console.error('❌ Error checking session:', err)
      return false
    }
  }

  return {
    isInitialized,
    isLoading,
    error,
    startSession,
    checkSession
  }
}
