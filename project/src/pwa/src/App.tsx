import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PWAProvider } from './contexts/PWAContext'
import { CartProvider } from './contexts/CartContext'
import { BranchProvider } from './contexts/BranchContext'
import { AuthProvider } from './contexts/AuthContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import SmartRouter from './components/routing/SmartRouter'
import ErrorBoundary from './components/common/ErrorBoundary'

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
import CartPersistenceTest from './components/cart/CartPersistenceTest'
import PromotionTestSuite from './components/promotions/PromotionTestSuite'
import PromotionQuickTest from './components/promotions/PromotionQuickTest'
import DisplayModeTestSuite from './components/promotions/DisplayModeTestSuite'
import MultiUnitTestSuite from './components/catalog/MultiUnitTestSuite'
import MultiUnitDemo from './components/catalog/MultiUnitDemo'
import ImagePreviewDemo from './components/catalog/ImagePreviewDemo'
import ImagePreviewTest from './components/catalog/ImagePreviewTest'

// Layouts
import MainLayout from './layouts/MainLayout'
import KioskLayout from './layouts/KioskLayout'

import AuthCallback from './pages/AuthCallback'

function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    let sessionId = localStorage.getItem('pwa-session-id')
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('pwa-session-id', sessionId)
    }
    return sessionId
  })

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 App: Starting parallel initialization...')
      
      // Load both contexts in parallel instead of sequential
      await Promise.all([
        // Auth will initialize on its own via AuthContext
        // Branches will initialize on their own via BranchContext
        // Just wait a moment for both contexts to mount
        new Promise(resolve => setTimeout(resolve, 100))
      ])
      
      console.log('✅ App: Initialization complete')
      setIsInitializing(false)
    }

    initializeApp()
  }, [])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Tiongson Agrivet...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing your experience</p>
        </div>
      </div>
    )
  }

          return (
            <ErrorBoundary>
              <PWAProvider>
                <RealtimeProvider>
                  <AuthProvider>
                    <BranchProvider>
                      <CartProvider sessionId={sessionId}>
                        <SmartRouter>
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
                    
                    <Route path="/demo/cart-test" element={
                      <MainLayout>
                        <CartPersistenceTest />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/promotion-test" element={
                      <MainLayout>
                        <PromotionTestSuite />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/promotion-quick" element={
                      <MainLayout>
                        <PromotionQuickTest />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/display-modes" element={
                      <MainLayout>
                        <DisplayModeTestSuite />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/multi-unit" element={
                      <MainLayout>
                        <MultiUnitTestSuite />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/multi-unit-demo" element={
                      <MainLayout>
                        <MultiUnitDemo />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/image-preview" element={
                      <MainLayout>
                        <ImagePreviewDemo />
                      </MainLayout>
                    } />
                    
                    <Route path="/demo/image-preview-test" element={
                      <MainLayout>
                        <ImagePreviewTest />
                      </MainLayout>
                    } />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                        </div>
                      </SmartRouter>
                    </CartProvider>
                  </BranchProvider>
                </AuthProvider>
              </RealtimeProvider>
            </PWAProvider>
          </ErrorBoundary>
        )
}

export default App
