import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Smartphone, 
  Eye, 
  EyeOff,
  CheckCircle,
  Shield,
  Clock,
  Truck,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useGuestSession } from '../hooks/useAnonymousSession'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import googleLogo from '../assets/google.png'
import { authService } from '../services/authService'
import { supabase } from '../services/supabase'

const AuthSelection: React.FC = () => {
  const navigate = useNavigate()
  const { selectedBranch } = useBranch()
  const { clearCart } = useCart()
  const { login, register, upgradeGuestAccount, socialLogin, isLoading, sendEmailVerification } = useAuth()
  // const { startSession, isLoading: isGuestLoading } = useGuestSession()
  
  const [authMethod, setAuthMethod] = useState<'login' | 'register' | 'guest' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [passwordResetNotice, setPasswordResetNotice] = useState<{ email: string; sent: boolean }>({
    email: '',
    sent: false
  })
  const [isResendingPasswordEmail, setIsResendingPasswordEmail] = useState(false)
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    showPassword: false,
    rememberMe: false
  })
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    acceptTerms: false
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setPasswordResetNotice({ email: '', sent: false })
    setIsResendingPasswordEmail(false)

    console.log('🔐 AuthSelection: Starting login process...', {
      email: loginForm.email,
      passwordLength: loginForm.password.length,
      rememberMe: loginForm.rememberMe
    })

    try {
      const result = await login(loginForm.email, loginForm.password)
      
      console.log('🔐 AuthSelection: Login result received:', {
        success: result.success,
        error: result.error,
        requiresVerification: result.requiresVerification
      })
      
      if (result.requiresVerification) {
        // Show verification needed message
        setError('Please verify your email before logging in. Check your inbox for the verification link.')
        setShowVerificationPrompt(true)
        setRegisteredEmail(loginForm.email)
      } else if (result.requiresPasswordReset) {
        setInfoMessage(
          result.error ||
          'Check your email for instructions to set a password and then try signing in again.'
        )
        setPasswordResetNotice({
          email: loginForm.email,
          sent: !!result.passwordResetEmailSent
        })
      } else if (result.success) {
        console.log('✅ AuthSelection: Login successful, navigating to catalog')
        navigate('/catalog')
      } else {
        console.error('❌ AuthSelection: Login failed:', result.error)
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('❌ AuthSelection: Login threw an error:', error)
      setError(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
  
    // Validate passwords match
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
  
    // Check if current user is a guest FIRST (before any auth changes)
    const { guestUpgradeService } = await import('../services/guestUpgradeService')
    const isGuest = await guestUpgradeService.isCurrentUserGuest()
    
    if (isGuest) {
      console.log('🔄 Upgrading existing guest account')
      const result = await upgradeGuestAccount({
        email: registerForm.email,
        password: registerForm.password,
        first_name: registerForm.firstName,
        last_name: registerForm.lastName,
        phone: registerForm.phone
      })
      
      if (result.success) {
        // Show email verification prompt
        setShowVerificationPrompt(true)
        setRegisteredEmail(registerForm.email)
        // Clear the form
        resetRegisterForm()
      } else {
        setError(result.error || 'Account upgrade failed')
      }
    } else {
      console.log('🆕 Creating new account')
      const result = await register({
        email: registerForm.email,
        password: registerForm.password,
        first_name: registerForm.firstName,
        last_name: registerForm.lastName,
        phone: registerForm.phone
      })
      
      if (result.success) {
        // Show email verification prompt
        setShowVerificationPrompt(true)
        setRegisteredEmail(registerForm.email)
        // Clear the form
        resetRegisterForm()
      } else {
        setError(result.error || 'Registration failed')
      }
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    console.log(`🔐 AuthSelection: handleSocialLogin called with provider:`, provider)
    setError(null)
    
    try {
      console.log(`🔐 AuthSelection: Starting ${provider} OAuth flow...`)
      
      // Call OAuth directly - the service will handle checking for existing customer
      const result = await socialLogin(provider)
      
      if (result.error) {
        console.error(`❌ AuthSelection: ${provider} OAuth error:`, result.error)
        setError(result.error)
      } else {
        // For OAuth, the user will be redirected to the provider
        // The actual login/profile completion happens in the callback
        console.log(`✅ AuthSelection: Redirecting to ${provider} OAuth provider...`)
      }
    } catch (error) {
      console.error(`❌ AuthSelection: ${provider} login failed:`, error)
      setError(`${provider} login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleResendVerification = async () => {
    setResendingEmail(true)
    setResendSuccess(false)
    
    try {
      const result = await sendEmailVerification(registeredEmail)
      if (result.success) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      } else {
        setError('Failed to resend verification email. Please try again.')
      }
    } catch (error) {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setResendingEmail(false)
    }
  }

  const handleResendPasswordReset = async () => {
    if (!passwordResetNotice.email) return

    setIsResendingPasswordEmail(true)
    setError(null)

    try {
      const { error: resendError } = await supabase.auth.resetPasswordForEmail(passwordResetNotice.email, {
        redirectTo: `${window.location.origin}/auth/password-reset`
      })

      if (resendError) {
        throw resendError
      }

      setPasswordResetNotice(prev => ({ ...prev, sent: true }))
      setInfoMessage(`Password reset email sent to ${passwordResetNotice.email}. It may take a minute to arrive—also check spam or promotions folders.`)
    } catch (error) {
      console.error('❌ AuthSelection: Failed to resend password reset email:', error)
      setError(error instanceof Error ? error.message : 'Failed to resend password reset email.')
    } finally {
      setIsResendingPasswordEmail(false)
    }
  }

  const resetForm = () => {
    setAuthMethod(null)
    setError(null)
    setInfoMessage(null)
    setShowVerificationPrompt(false)
    setRegisteredEmail('')
    setPasswordResetNotice({ email: '', sent: false })
    setIsResendingPasswordEmail(false)
    resetLoginForm()
    resetRegisterForm()
  }

  const resetLoginForm = () => {
    setLoginForm({
      email: '',
      password: '',
      showPassword: false,
      rememberMe: false
    })
  }

  const resetRegisterForm = () => {
    setRegisterForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      acceptTerms: false
    })
  }

  // Email Verification Prompt Component
  const EmailVerificationPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-10 h-10 text-green-600" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email!
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-4">
            We've sent a verification link to:
          </p>
          
          {/* Email Address */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <p className="text-lg font-semibold text-gray-900">
              {registeredEmail}
            </p>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-2">
                  To complete your registration:
                </p>
                <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here to log in with your credentials</li>
                </ol>
                <p className="text-blue-600 text-xs mt-2">
                  Note: Check your spam folder if you don't see the email
                </p>
              </div>
            </div>
          </div>

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">Verification email sent successfully!</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Open Email Button */}
            <button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Open Gmail</span>
            </button>
            
            {/* Resend Email Button */}
            <button
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendingEmail ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  <span>Resending...</span>
                </div>
              ) : (
                'Resend Verification Email'
              )}
            </button>
            
            {/* Continue to Login Button */}
            <button
              onClick={() => {
                setShowVerificationPrompt(false)
                setAuthMethod('login')
                // Pre-fill the login email
                setLoginForm(prev => ({ ...prev, email: registeredEmail }))
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              I've verified, let me log in
            </button>
            
            {/* Back to Options */}
            <button
              onClick={resetForm}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              ← Back to options
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
        
        {/* Initial Selection */}
        {!authMethod && !showVerificationPrompt && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Tiongson Agrivet
              </h1>
              <p className="text-gray-600">
                {selectedBranch?.name} Branch
              </p>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="space-y-4">
              {/* Existing Customer Login */}
              <button
                onClick={() => setAuthMethod('login')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <User className="w-5 h-5" />
                <span>I have an account</span>
              </button>

              {/* New Customer Register */}
              <button
                onClick={() => setAuthMethod('register')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <User className="w-5 h-5" />
                <span>Create new account</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Options */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors flex items-center justify-center space-x-3"
                >
                  <img src={googleLogo} alt="Google" className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Back to Branch Selection */}
              <button
                onClick={() => navigate('/branch-selection')}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change branch</span>
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Secure Checkout</p>
                </div>
                <div>
                  <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Quick Orders</p>
                </div>
                <div>
                  <Truck className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Fast Delivery</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        {authMethod === 'login' && !showVerificationPrompt && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600">
                Sign in to your account
              </p>
            </div>

            {infoMessage && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-3">
                <div className="flex items-start space-x-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Check your email</p>
                    <p>{infoMessage}</p>
                    {passwordResetNotice.email && (
                      <p className="text-xs text-blue-700 mt-1">
                        We sent the link to <strong>{passwordResetNotice.email}</strong>. It can take a minute—check your spam or promotions folders if you don’t see it.
                      </p>
                    )}
                  </div>
                </div>
                {passwordResetNotice.email && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleResendPasswordReset}
                      disabled={isResendingPasswordEmail}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResendingPasswordEmail ? 'Sending...' : 'Resend password email'}
                    </button>
                    <span className="text-xs text-blue-600">
                      Reset form opens at <code>/auth/password-reset</code>
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={loginForm.showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {loginForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loginForm.rememberMe}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-green-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setAuthMethod('register')
                    setError(null)
                    setInfoMessage(null)
                    setPasswordResetNotice({ email: '', sent: false })
                    setIsResendingPasswordEmail(false)
                  }}
                  className="text-green-600 hover:underline font-medium"
                >
                  Register here
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to options
              </button>
            </div>
          </div>
        )}

        {/* Register Form */}
        {authMethod === 'register' && !showVerificationPrompt && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600">
                Join Tiongson Agrivet family
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+63 912 345 6789"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={registerForm.showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Create a password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setRegisterForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {registerForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={registerForm.showConfirmPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setRegisterForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {registerForm.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={registerForm.acceptTerms}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    className="mr-3 mt-1"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-green-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-green-600 hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !registerForm.acceptTerms}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setAuthMethod('login')
                    setError(null)
                  }}
                  className="text-green-600 hover:underline font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to options
              </button>
            </div>
          </div>
        )}

        {/* Show Email Verification Prompt */}
        {showVerificationPrompt && <EmailVerificationPrompt />}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center">
              <LoadingSpinner message={authMethod === 'login' ? 'Signing you in...' : 'Creating your account...'} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthSelection