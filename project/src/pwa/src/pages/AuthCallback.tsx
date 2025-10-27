import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'
import { supabase } from '../services/supabase'
import { CheckCircle, XCircle, User, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'profile-needed'>('loading')
  const [message, setMessage] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const { markProfileComplete } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Starting callback handler...')
        
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
    
        if (error) {
          console.error('❌ OAuth error from URL:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed')
          setTimeout(() => navigate('/auth-selection'), 3000)
          return
        }
    
        const code = searchParams.get('code')
        
        if (!code) {
          console.log('ℹ️ No OAuth code found, checking for existing session...')
          
          // Check if we have an existing session (user might be coming from profile completion)
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            console.log('✅ Existing session found, user already authenticated')
            navigate('/catalog')
            return
          }
          
          setStatus('error')
          setMessage('Invalid callback - no authentication code found')
          setTimeout(() => navigate('/auth-selection'), 3000)
          return
        }
    
        const provider = searchParams.get('provider') ?? undefined
        console.log('🔐 AuthCallback: OAuth flow detected, processing...', { provider })
    
        // Handle OAuth callback and check for existing customer
        const result = await authService.handleOAuthCallback(provider)
    
        if (result.error || !result.user) {
          console.error('❌ AuthCallback: OAuth callback failed:', result.error)
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
          setTimeout(() => navigate('/auth-selection'), 3000)
          return
        }
    
        // Check if this is a new user without customer record
        if (result.requiresProfileCompletion) {
          console.log('📝 AuthCallback: New OAuth user needs to complete profile')
          setStatus('profile-needed')
          setUserInfo({
            userId: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || '',
            lastName: result.user.last_name || '',
            phone: result.user.phone || ''
          })
          
          // Store temporary user info and navigate to profile completion
          localStorage.setItem('oauth_temp_user', JSON.stringify({
            userId: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || '',
            lastName: result.user.last_name || '',
            phone: result.user.phone || ''
          }))
          
          setMessage('Please complete your profile to continue')
          const user = result.user!;
          // Navigate to profile completion after a short delay
          setTimeout(() => {
            navigate('/complete-profile', {
              state: {
                userId: user.id,
                email: user.email,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                phone: user.phone || '',
                fromOAuth: true
              }
            })
          }, 2000)
          
          return
        }
    
        console.log('✅ AuthCallback: OAuth successful! Existing customer found:', result.user)
        
        // Store user info
        localStorage.setItem('auth_user', JSON.stringify(result.user))
        localStorage.setItem('agrivet_user_cache', JSON.stringify(result.user))
        
        setStatus('success')
        setMessage(`Welcome back, ${result.user.first_name}! Redirecting...`)
        
        setTimeout(() => {
          navigate('/catalog')
        }, 2000)
    
      } catch (error) {
        console.error('❌ AuthCallback: Callback error caught:', error)
        setStatus('error')
        setMessage('An error occurred during authentication')
        setTimeout(() => navigate('/auth-selection'), 3000)
      }
    }

    handleCallback()
  }, [navigate, searchParams, markProfileComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
        
        {/* Loading State */}
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

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">{message}</p>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 text-green-600 animate-spin mx-auto" />
            </div>
          </>
        )}

        {/* Profile Needed State */}
        {status === 'profile-needed' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Almost There!
            </h2>
            <p className="text-gray-600 mb-2">{message}</p>
            {userInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700 mb-2">
                  Logged in as: <strong>{userInfo.email}</strong>
                </p>
                <p className="text-xs text-gray-600">
                  We need a few more details to set up your account
                </p>
              </div>
            )}
            <div className="mt-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            </div>
          </>
        )}

        {/* Error State */}
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
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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