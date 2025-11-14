import React from 'react'
import { ShoppingCart, MapPin, User, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { Branch } from '../../types'
import logo from '../../assets/logo.png'

interface HeaderProps {
  branch: Branch | null
}

const Header: React.FC<HeaderProps> = ({ branch }) => {
  const navigate = useNavigate()
  const { getItemCount } = useCart()
  const { isAuthenticated } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Branch */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <img 
                src={logo} 
                alt="AgriVet Logo" 
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold text-gray-900 text-lg">AgriVet</span>
            </button>
            
            {branch && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{branch.name}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => navigate('/catalog')}
              className="text-gray-700 hover:text-agrivet-green transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="text-gray-700 hover:text-agrivet-green transition-colors"
              title="My Orders"
            >
              <Package className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative text-gray-700 hover:text-agrivet-green transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-agrivet-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/settings')}
                className="text-gray-700 hover:text-agrivet-green transition-colors"
                title="Settings"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </nav>

          {/* Mobile - Only show logo and branch, navigation moved to bottom */}
          <div className="md:hidden flex items-center">
            {/* Mobile header is minimal - navigation is in bottom nav */}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
