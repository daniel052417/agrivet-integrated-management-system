import React from 'react'
import { ShoppingCart, MapPin, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { Branch } from '../../types'

interface HeaderProps {
  branch: Branch | null
}

const Header: React.FC<HeaderProps> = ({ branch }) => {
  const navigate = useNavigate()
  const { getItemCount } = useCart()

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
              <div className="w-8 h-8 bg-agrivet-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">AgriVet</span>
            </button>
            
            {branch && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{branch.branch_name}</span>
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
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-700 hover:text-agrivet-green transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-agrivet-green text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
            
            <button className="p-2 text-gray-700 hover:text-agrivet-green transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
