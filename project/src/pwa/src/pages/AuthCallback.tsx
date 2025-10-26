import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService'
import { CheckCircle, XCircle } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Starting callback handler...')
        console.log('🔗 Current URL:', window.location.href)
        
        // Check if there's an error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          console.error('❌ OAuth error from URL:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed')
          setTimeout(() => navigate('/auth-selection'), 3000)
          return
        }

        // ✅ FIXED: Check for OAuth code (PKCE flow)
        const code = searchParams.get('code')
        
        console.log('🔍 Checking URL params:', {
          hasCode: !!code,
          hasError: !!error
        })

        if (!code) {
          console.log('ℹ️ No OAuth code found, invalid callback')
          setStatus('error')
          setMessage('Invalid callback - no authentication code found')
          setTimeout(() => navigate('/auth-selection'), 3000)
          return
        }

        // OAuth flow detected - handle it
        const provider = searchParams.get('provider') ?? undefined
        console.log('🔐 OAuth flow detected, processing...', { provider, hasCode: !!code })

        // ✅ THIS IS THE KEY LINE - Call the function that creates the customer!
        console.log('📞 Calling handleOAuthCallback...')
        const result = await authService.handleOAuthCallback(provider)

        if (result.error || !result.user) {
          console.error('❌ OAuth callback failed:', result.error)
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
          setTimeout(() => navigate('/auth-selection'), 3000)
          return
        }

        console.log('✅ OAuth successful! User:', result.user.email)
        
        // Store user info
        localStorage.setItem('auth_user', JSON.stringify(result.user))
        
        setStatus('success')
        setMessage(`Welcome ${result.user.first_name}! Redirecting...`)
        
        // Redirect to catalog
        setTimeout(() => {
          navigate('/catalog')
        }, 2000)

      } catch (error) {
        console.error('❌ Callback error:', error)
        setStatus('error')
        setMessage('An error occurred during authentication')
        setTimeout(() => navigate('/auth-selection'), 3000)
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authenticating...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your sign-in...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/auth-selection')}
              className="btn-primary"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback