import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PWAProvider } from './contexts/PWAContext'
import { CartProvider } from './contexts/CartContext'
import { BranchProvider } from './contexts/BranchContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import SmartRouter from './components/routing/SmartRouter'
import ErrorBoundary from './components/common/ErrorBoundary'
import AuthCallback from './pages/AuthCallback'


// ✅ LAZY LOAD PAGES
const BranchSelection = lazy(() => import('./pages/BranchSelection'))
const AuthSelection = lazy(() => import('./pages/AuthSelection'))
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'))
const ShoppingCart = lazy(() => import('./pages/ShoppingCart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const Orders = lazy(() => import('./pages/Orders'))
const UserSettings = lazy(() => import('./pages/UserSettings'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ProfileCompletion = lazy(() => import('./pages/ProfileCompletion'))

// Demo Components
const PromoDemo = lazy(() => import('./components/promotions/PromoDemo'))
const CarouselDemo = lazy(() => import('./components/promotions/CarouselDemo'))
const CartPersistenceTest = lazy(() => import('./components/cart/CartPersistenceTest'))
const PromotionTestSuite = lazy(() => import('./components/promotions/PromotionTestSuite'))
const PromotionQuickTest = lazy(() => import('./components/promotions/PromotionQuickTest'))
const DisplayModeTestSuite = lazy(() => import('./components/promotions/DisplayModeTestSuite'))
const MultiUnitTestSuite = lazy(() => import('./components/catalog/MultiUnitTestSuite'))
const MultiUnitDemo = lazy(() => import('./components/catalog/MultiUnitDemo'))
const ImagePreviewDemo = lazy(() => import('./components/catalog/ImagePreviewDemo'))
const ImagePreviewTest = lazy(() => import('./components/catalog/ImagePreviewTest'))
const SupabaseConnectionTest = lazy(() => import('./components/debug/SupabaseConnectionTest'))

// Layouts
import MainLayout from './layouts/MainLayout'
import KioskLayout from './layouts/KioskLayout'

// ✅ Page loader component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
)

function App() {
  const [isInitializing, setIsInitializing] = useState(true)

  const [sessionId] = useState(() => {
    let sessionId = localStorage.getItem('pwa-session-id')
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('pwa-session-id', sessionId)
    }
    return sessionId
  })

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 App: Starting initialization...')
      await new Promise(resolve => setTimeout(resolve, 100))
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
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </SmartRouter>
              </CartProvider>
            </BranchProvider>
          </AuthProvider>
        </RealtimeProvider>
      </PWAProvider>
    </ErrorBoundary>
  )
}

// ✅ Separate component for routes — allows safe use of useAuth()
function AppRoutes() {
  const { user, needsProfile, markProfileComplete } = useAuth()
 if (needsProfile) {
    return (
      <KioskLayout>
        <ProfileCompletion
          userId={user?.id || ''}
          email={user?.email || ''}
          firstName={user?.first_name || ''}
          lastName={user?.last_name || ''}
          onComplete={markProfileComplete}
        />
      </KioskLayout>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/branch-selection" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route
          path="/complete-profile"
          element={
            <KioskLayout>
              
              <ProfileCompletion
                userId={user?.id || ''}
                email={user?.email || ''}
                firstName={user?.first_name || ''}
                lastName={user?.last_name || ''}
                onComplete={() => console.log('Profile completed')}
              />
              
            </KioskLayout>
          }
        />

        <Route
          path="/branch-selection"
          element={
            <KioskLayout>
              <BranchSelection />
            </KioskLayout>
          }
        />

        <Route
          path="/auth-selection"
          element={
            <KioskLayout>
              <AuthSelection />
            </KioskLayout>
          }
        />

        <Route
          path="/catalog"
          element={
            <MainLayout>
              <ProductCatalog />
            </MainLayout>
          }
        />

        <Route
          path="/cart"
          element={
            <MainLayout>
              <ShoppingCart />
            </MainLayout>
          }
        />

        <Route
          path="/checkout"
          element={
            <MainLayout>
              <Checkout />
            </MainLayout>
          }
        />

        <Route
          path="/order-confirmation/:orderId"
          element={
            <MainLayout>
              <OrderConfirmation />
            </MainLayout>
          }
        />

        <Route
          path="/orders"
          element={
            <MainLayout>
              <Orders />
            </MainLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <MainLayout>
              <UserSettings />
            </MainLayout>
          }
        />

        {/* Demo / Debug routes */}
        <Route
          path="/demo/promotions"
          element={
            <MainLayout>
              <PromoDemo />
            </MainLayout>
          }
        />

        <Route
          path="/demo/carousel"
          element={
            <MainLayout>
              <CarouselDemo />
            </MainLayout>
          }
        />

        <Route
          path="/demo/cart-test"
          element={
            <MainLayout>
              <CartPersistenceTest />
            </MainLayout>
          }
        />

        <Route
          path="/demo/promotion-test"
          element={
            <MainLayout>
              <PromotionTestSuite />
            </MainLayout>
          }
        />

        <Route
          path="/demo/promotion-quick"
          element={
            <MainLayout>
              <PromotionQuickTest />
            </MainLayout>
          }
        />

        <Route
          path="/demo/display-modes"
          element={
            <MainLayout>
              <DisplayModeTestSuite />
            </MainLayout>
          }
        />

        <Route
          path="/demo/multi-unit"
          element={
            <MainLayout>
              <MultiUnitTestSuite />
            </MainLayout>
          }
        />

        <Route
          path="/demo/multi-unit-demo"
          element={
            <MainLayout>
              <MultiUnitDemo />
            </MainLayout>
          }
        />

        <Route
          path="/demo/image-preview"
          element={
            <MainLayout>
              <ImagePreviewDemo />
            </MainLayout>
          }
        />

        <Route
          path="/demo/image-preview-test"
          element={
            <MainLayout>
              <ImagePreviewTest />
            </MainLayout>
          }
        />

        <Route
          path="/debug/supabase"
          element={
            <MainLayout>
              <SupabaseConnectionTest />
            </MainLayout>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
