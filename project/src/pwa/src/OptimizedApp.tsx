import { Routes, Route, Navigate } from 'react-router-dom'
import { PWAProvider } from './contexts/PWAContext'
import { CartProvider } from './contexts/CartContext'
import { OptimizedBranchProvider } from './contexts/OptimizedBranchContext'
import { OptimizedAuthProvider } from './contexts/OptimizedAuthContext'
import OptimizedSmartRouter from './components/routing/OptimizedSmartRouter'
import ErrorBoundary from './components/common/ErrorBoundary'
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics'

// Pages
import BranchSelection from './pages/BranchSelection'
import AuthSelection from './pages/AuthSelection'
import ProductCatalog from './pages/ProductCatalog'
import ShoppingCart from './pages/ShoppingCart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import UserSettings from './pages/UserSettings'
import NotFound from './pages/NotFound'

// Demo Components
import PromoDemo from './components/promotions/PromoDemo'
import CarouselDemo from './components/promotions/CarouselDemo'

// Layouts
import MainLayout from './layouts/MainLayout'
import KioskLayout from './layouts/KioskLayout'

import AuthCallback from './pages/AuthCallback'

// Performance monitoring component
const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { recordTimeToInteractive, logMetrics } = usePerformanceMetrics()

  useEffect(() => {
    // Record time to interactive when component mounts
    recordTimeToInteractive()
    
    // Log metrics after a short delay to allow all data to load
    const timer = setTimeout(() => {
      logMetrics()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return <>{children}</>
}

function OptimizedApp() {
  return (
    <ErrorBoundary>
      <PerformanceMonitor>
        <PWAProvider>
          <OptimizedAuthProvider>
            <OptimizedBranchProvider>
              <CartProvider>
                <OptimizedSmartRouter>
                  <div className="min-h-screen bg-gray-50">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Navigate to="/branch-selection" replace />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/branch-selection" element={
                        <KioskLayout>
                          <BranchSelection />
                        </KioskLayout>
                      } />
                      
                      <Route path="/auth-selection" element={
                        <KioskLayout>
                          <AuthSelection />
                        </KioskLayout>
                      } />
                      
                      <Route path="/catalog" element={
                        <MainLayout>
                          <ProductCatalog />
                        </MainLayout>
                      } />
                      
                      <Route path="/cart" element={
                        <MainLayout>
                          <ShoppingCart />
                        </MainLayout>
                      } />
                      
                      <Route path="/checkout" element={
                        <MainLayout>
                          <Checkout />
                        </MainLayout>
                      } />
                      
                      <Route path="/order-confirmation/:orderId" element={
                        <MainLayout>
                          <OrderConfirmation />
                        </MainLayout>
                      } />
                      
                      <Route path="/settings" element={
                        <MainLayout>
                          <UserSettings />
                        </MainLayout>
                      } />
                      
                      {/* Demo Routes */}
                      <Route path="/demo/promotions" element={
                        <MainLayout>
                          <PromoDemo />
                        </MainLayout>
                      } />
                      
                      <Route path="/demo/carousel" element={
                        <MainLayout>
                          <CarouselDemo />
                        </MainLayout>
                      } />
                      
                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </OptimizedSmartRouter>
              </CartProvider>
            </OptimizedBranchProvider>
          </OptimizedAuthProvider>
        </PWAProvider>
      </PerformanceMonitor>
    </ErrorBoundary>
  )
}

export default OptimizedApp






