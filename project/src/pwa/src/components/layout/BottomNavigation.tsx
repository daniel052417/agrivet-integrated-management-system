import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Package, User, Grid } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getItemCount } = useCart()
  const { isAuthenticated } = useAuth()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      path: '/catalog',
      label: 'Products',
      icon: Grid,
      show: true
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: Package,
      show: true
    },
    {
      path: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      show: true,
      badge: getItemCount()
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: User,
      show: isAuthenticated
    }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 transition-colors ${
                  active
                    ? 'text-agrivet-green'
                    : 'text-gray-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'text-agrivet-green' : 'text-gray-600'}`} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md border-2 border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-0.5 font-medium truncate w-full text-center ${
                  active ? 'text-agrivet-green' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </button>
            )
          })}
      </div>
    </nav>
  )
}

export default BottomNavigation

