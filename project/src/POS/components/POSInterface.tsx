import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, User } from 'lucide-react';
import ProductSearch from './ProductSearch';
import ShoppingCartComponent from './ShoppingCart';
import PaymentProcessing from './PaymentProcessing';
import CustomerLookup from './CustomerLookup';
import POSHeader from './POSHeader';
import QuickSaleShortcuts from './QuickSaleShortcuts';
import POSDashboard from './POSDashboard';
import FloatingActionButton from './shared/FloatingActionButton';
import MobileBottomSheet from './shared/MobileBottomSheet';
import POSSessionService from '../services/sessionService';
import { POSSession, CartItem, Customer, ProductVariant, User as UserType } from '../../types/pos';

interface POSInterfaceProps {
  user: UserType;
  onLogout: () => void;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ user, onLogout }) => {
  const [currentSession, setCurrentSession] = useState<POSSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'cart' | 'payment' | 'customers'>('products');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize POS session
  useEffect(() => {
    initializePOSSession();
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const initializePOSSession = async () => {
    try {
      setIsLoading(true);
      
      const session = await POSSessionService.initializeSession(user, user.branch_id);
      setCurrentSession(session);
    } catch (error: any) {
      console.error('Error initializing POS session:', error);
      setError('Failed to initialize POS session');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLineTotal = (item: CartItem): number => {
    const baseAmount = item.product.pos_pricing_type === 'weight_based' && item.weight
      ? item.unitPrice * item.weight
      : item.unitPrice * item.quantity;
    
    return baseAmount - item.discount;
  };

  const addToCart = (product: ProductVariant, quantity: number = 1, weight?: number, expiryDate?: string, batchNumber?: string) => {
    const existingItemIndex = cart.findIndex(item => 
      item.product.id === product.id && 
      item.weight === weight
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity,
        weight,
        unitPrice: product.price,
        discount: 0,
        lineTotal: calculateLineTotal({
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          weight,
          unitPrice: product.price,
          discount: 0,
          lineTotal: 0,
          expiryDate,
          batchNumber
        }),
        expiryDate,
        batchNumber
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, ...updates, lineTotal: calculateLineTotal({ ...item, ...updates }) }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const calculateSubtotal = (): number => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const calculateTax = (): number => {
    // Get tax rate from settings
    const taxRate = 0.12; // Default 12% VAT
    return calculateSubtotal() * taxRate;
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  const handleTransactionComplete = () => {
    clearCart();
    setActiveTab('products');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing POS System...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to initialize POS session</p>
          <button 
            onClick={initializePOSSession}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <POSHeader 
        user={user}
        session={currentSession}
        onLogout={onLogout}
        onShowDashboard={() => setShowDashboard(true)}
      />
      
      <div className="flex h-screen pt-16">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Search className="w-5 h-5 inline mr-2" />
                Products
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'cart'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Cart ({cart.length})
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'customers'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 inline mr-2" />
                Customers
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'products' && (
              <div className="h-full flex">
                <div className="flex-1">
                  <ProductSearch onAddToCart={addToCart} />
                </div>
                {!isMobile && (
                  <div className="w-80 border-l border-gray-200 bg-white">
                    <QuickSaleShortcuts onAddToCart={addToCart} />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'cart' && (
              <div className="h-full">
                <ShoppingCartComponent
                  cart={cart}
                  selectedCustomer={selectedCustomer}
                  onUpdateItem={updateCartItem}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  subtotal={calculateSubtotal()}
                  tax={calculateTax()}
                  total={calculateTotal()}
                  onProceedToPayment={() => setActiveTab('payment')}
                />
              </div>
            )}
            
            {activeTab === 'customers' && (
              <div className="h-full">
                <CustomerLookup
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                />
              </div>
            )}
            
            {activeTab === 'payment' && (
              <div className="h-full">
                <PaymentProcessing
                  cart={cart}
                  selectedCustomer={selectedCustomer}
                  subtotal={calculateSubtotal()}
                  tax={calculateTax()}
                  total={calculateTotal()}
                  session={currentSession}
                  onTransactionComplete={handleTransactionComplete}
                  onBack={() => setActiveTab('cart')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheet for Cart */}
      {isMobile && (
        <MobileBottomSheet
          isOpen={showMobileCart}
          onClose={() => setShowMobileCart(false)}
          title="Shopping Cart"
        >
          <ShoppingCartComponent
            cart={cart}
            selectedCustomer={selectedCustomer}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            subtotal={calculateSubtotal()}
            tax={calculateTax()}
            total={calculateTotal()}
            onProceedToPayment={() => {
              setShowMobileCart(false);
              setActiveTab('payment');
            }}
          />
        </MobileBottomSheet>
      )}

      {/* Mobile Floating Action Button */}
      {isMobile && cart.length > 0 && (
        <FloatingActionButton
          onClick={() => setShowMobileCart(true)}
          icon={ShoppingCart}
          label="View Cart"
          variant="primary"
          className="fixed bottom-4 right-4 z-30"
        />
      )}

      {/* Dashboard Modal */}
      {showDashboard && currentSession && (
        <POSDashboard
          session={currentSession}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </div>
  );
};

export default POSInterface;
