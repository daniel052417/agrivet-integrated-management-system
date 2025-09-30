import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PWAProvider } from './contexts/PWAContext'
import { CartProvider } from './contexts/CartContext'
import { BranchProvider } from './contexts/BranchContext'
import ErrorBoundary from './components/common/ErrorBoundary'

// Pages
import BranchSelection from './pages/BranchSelection'
import AuthSelection from './pages/AuthSelection'
import ProductCatalog from './pages/ProductCatalog'
import ShoppingCart from './pages/ShoppingCart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import NotFound from './pages/NotFound'

// Demo Components
import PromoDemo from './components/promotions/PromoDemo'

// Layouts
import MainLayout from './layouts/MainLayout'
import KioskLayout from './layouts/KioskLayout'

function App() {
  return (
    <ErrorBoundary>
      <PWAProvider>
        <BranchProvider>
          <CartProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Navigate to="/branch-selection" replace />} />
                
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
                
                {/* Demo Routes */}
                <Route path="/demo/promotions" element={
                  <MainLayout>
                    <PromoDemo />
                  </MainLayout>
                } />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </CartProvider>
        </BranchProvider>
      </PWAProvider>
    </ErrorBoundary>
  )
}

export default App
