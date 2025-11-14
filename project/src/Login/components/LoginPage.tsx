import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.png';
import { settingsService } from '../../lib/settingsService';

interface LoginPageProps {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onLoginSubmit: (e: React.FormEvent) => void;
}

export default function LoginPage({
  username,
  password,
  showPassword,
  isLoading,
  error,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPassword,
  onLoginSubmit
}: LoginPageProps) {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Tiongson');
  const [tagline, setTagline] = useState('AGRIVET');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        const general = settings.general || {};
        setCompanyLogo(general.companyLogo || settings.company_logo || null);
        
        // Extract company name - use first word if full name is too long
        const fullCompanyName = general.companyName || settings.company_name || 'Tiongson';
        setCompanyName(fullCompanyName.split(' ')[0]);
        setTagline(fullCompanyName.includes(' ') ? fullCompanyName.split(' ').slice(1).join(' ') : 'AGRIVET');
      } catch (error) {
        console.error('Error loading login settings:', error);
      }
    };

    loadSettings();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/30 to-emerald-200/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-100/30 to-amber-200/30 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Logo Section */}
          <div className="flex items-center justify-center mb-8 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Enhanced Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                <img 
                  src={companyLogo || logo} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
              </div>
              <div className="text-left">
                <div className="text-red-500 text-lg sm:text-xl font-serif italic tracking-wide">{companyName}</div>
                <div className="text-green-700 text-2xl sm:text-3xl font-bold tracking-wider">{tagline}</div>
                <div className="text-gray-500 text-xs sm:text-sm font-medium tracking-widest uppercase">Agricultural Supplies</div>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Please enter your details to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 relative z-10">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={onLoginSubmit} className="space-y-6 relative z-10">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700 block">
                Username (Email)
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-gray-50/50 hover:bg-white text-gray-700 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-gray-50/50 hover:bg-white text-gray-700 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={onToggleShowPassword}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <a 
                href="#" 
                className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors duration-200 hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center relative z-10">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="text-green-600 hover:text-green-700 font-medium transition-colors duration-200 hover:underline">
                Contact Administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2025 Tjenyson AGRIVET. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}