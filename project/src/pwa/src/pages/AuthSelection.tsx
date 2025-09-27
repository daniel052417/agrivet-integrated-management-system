import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Smartphone, 
  Facebook, 
  Eye, 
  EyeOff,
  CheckCircle,
  Shield,
  Clock,
  Truck
} from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { useCart } from '../contexts/CartContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

const AuthSelection: React.FC = () => {
  const navigate = useNavigate()
  const { selectedBranch } = useBranch()
  const { clearCart } = useCart()
  
  const [authMethod, setAuthMethod] = useState<'login' | 'register' | 'guest' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    showPassword: false,
    rememberMe: false
  })
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    acceptTerms: false
  })

  const handleGuestContinue = () => {
    // Clear any existing cart for fresh guest session
    clearCart()
    navigate('/catalog')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful login
      console.log('Login successful:', loginForm.email)
      navigate('/catalog')
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful registration
      console.log('Registration successful:', registerForm.email)
      navigate('/catalog')
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    setError(null)
    
    // Simulate social login
    setTimeout(() => {
      console.log(`${provider} login successful`)
      navigate('/catalog')
    }, 1500)
  }

  const resetForm = () => {
    setAuthMethod(null)
    setError(null)
    setLoginForm({
      email: '',
      password: '',
      showPassword: false,
      rememberMe: false
    })
    setRegisterForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      acceptTerms: false
    })
  }

  if (!selectedBranch) {
    navigate('/branch-selection')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/branch-selection')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to {selectedBranch.name}
              </h1>
              <p className="text-gray-600">
                Choose how you'd like to continue
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!authMethod ? (
          /* Auth Method Selection */
          <div className="space-y-8">
            {/* Branch Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-agrivet-green rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedBranch.name}
                  </h2>
                  <p className="text-gray-600 mb-3">{selectedBranch.address}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Ready in 30 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>Secure Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auth Options */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Guest Checkout */}
              <div
                onClick={() => setAuthMethod('guest')}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-agrivet-green transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-agrivet-green/10 transition-colors">
                    <User className="w-8 h-8 text-gray-600 group-hover:text-agrivet-green" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-agrivet-green transition-colors">
                    Continue as Guest
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Quick checkout without creating an account
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>No registration required</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Fast checkout process</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Order tracking via SMS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login */}
              <div
                onClick={() => setAuthMethod('login')}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-agrivet-green transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-agrivet-green/10 transition-colors">
                    <Lock className="w-8 h-8 text-blue-600 group-hover:text-agrivet-green" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-agrivet-green transition-colors">
                    Sign In
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Access your account and order history
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Order history</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Faster checkout</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Loyalty points</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Register */}
              <div
                onClick={() => setAuthMethod('register')}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-agrivet-green transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-agrivet-green/10 transition-colors">
                    <User className="w-8 h-8 text-green-600 group-hover:text-agrivet-green" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-agrivet-green transition-colors">
                    Create Account
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Join AgriVet for exclusive benefits
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Exclusive discounts</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Order tracking</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Loyalty rewards</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Login Options */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Or continue with
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="font-medium text-gray-700">Google</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Facebook</span>
                </button>
              </div>
            </div>
          </div>
        ) : authMethod === 'guest' ? (
          /* Guest Confirmation */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Continue as Guest
              </h2>
              <p className="text-gray-600 mb-8">
                You can browse products and place orders without creating an account. 
                We'll send order updates via SMS.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No account required</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Order tracking via SMS</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Secure payment processing</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={resetForm}
                  className="flex-1 btn-outline"
                >
                  Go Back
                </button>
                <button
                  onClick={handleGuestContinue}
                  className="flex-1 btn-primary"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Login/Register Forms */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {authMethod === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-gray-600">
                  {authMethod === 'login' 
                    ? 'Welcome back! Sign in to your account' 
                    : 'Join AgriVet for exclusive benefits'
                  }
                </p>
              </div>

              {error && (
                <div className="mb-6">
                  <ErrorMessage message={error} />
                </div>
              )}

              {authMethod === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-6">
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
                        className="input-field pl-10"
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
                        className="input-field pl-10 pr-10"
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
                    <a href="#" className="text-sm text-agrivet-green hover:underline">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field pl-10"
                        placeholder="Enter your full name"
                        required
                      />
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
                        className="input-field pl-10"
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
                        className="input-field pl-10"
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
                        className="input-field pl-10 pr-10"
                        placeholder="Create a password"
                        required
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
                        className="input-field pl-10 pr-10"
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
                        <a href="#" className="text-agrivet-green hover:underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-agrivet-green hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !registerForm.acceptTerms}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={resetForm}
                  className="text-sm text-gray-600 hover:text-agrivet-green transition-colors"
                >
                  ← Back to options
                </button>
              </div>
            </div>
          </div>
        )}

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
