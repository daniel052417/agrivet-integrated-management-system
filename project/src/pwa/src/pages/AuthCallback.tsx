import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { CheckCircle, XCircle } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if there's an error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Email verification failed')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          setStatus('error')
          setMessage('Could not verify email. Please try again.')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        // Check if email is confirmed
        if (session.user.email_confirmed_at) {
          setStatus('success')
          setMessage('Email verified successfully! Redirecting to catalog...')
          
          // Wait a moment then redirect
          setTimeout(() => {
            navigate('/catalog?verified=true')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Email not confirmed. Please check your inbox.')
          setTimeout(() => navigate('/auth'), 3000)
        }
      } catch (error) {
        console.error('Email confirmation error:', error)
        setStatus('error')
        setMessage('An error occurred during verification')
        setTimeout(() => navigate('/auth'), 3000)
      }
    }

    handleEmailConfirmation()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
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
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/auth')}
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