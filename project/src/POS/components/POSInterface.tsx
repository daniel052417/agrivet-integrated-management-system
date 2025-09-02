import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, CreditCard, Receipt, User, Settings, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProductSearch from './ProductSearch';
import ShoppingCartComponent from './ShoppingCart';
import PaymentProcessing from './PaymentProcessing';
import CustomerLookup from './CustomerLookup';
import POSHeader from './POSHeader';
import QuickSaleShortcuts from './QuickSaleShortcuts';
import POSDashboard from './POSDashboard';
import { POSSession, CartItem, Customer, Product } from '../../types/pos';

interface POSInterfaceProps {
  user: any;
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

  // Initialize POS session
  useEffect(() => {
    initializePOSSession();
  }, []);

  const initializePOSSession = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's an open session for this cashier
      const { data: existingSession, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('cashier_id', user.id)
        .eq('status', 'open')
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      if (existingSession) {
        setCurrentSession(existingSession);
      } else {
        // Create new session
        const sessionNumber = await generateSessionNumber();
        const { data: newSession, error: createError } = await supabase
          .from('pos_sessions')
          .insert({
            cashier_id: user.id,
            branch_id: user.branch_id || null,
            session_number: sessionNumber,
            starting_cash: 0, // Will be updated when cashier opens drawer
            status: 'open'
          })
          .select()
          .single();

        if (createError) throw createError;
        setCurrentSession(newSession);
      }
    } catch (error: any) {
      console.error('Error initializing POS session:', error);
      setError('Failed to initialize POS session');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSessionNumber = async (): Promise<string> => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from('pos_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`);
    
    return `S${today}${String((count || 0) + 1).padStart(3, '0')}`;
  };

  const addToCart = (product: Product, quantity: number = 1, weight?: number, expiryDate?: string, batchNumber?: string) => {
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
        unitPrice: product.unit_price,
        discount: 0,
        lineTotal: (product.unit_price * quantity) - (weight ? 0 : 0),
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

  const calculateLineTotal = (item: CartItem): number => {
    const baseAmount = item.product.pos_pricing_type === 'weight_based' && item.weight
      ? item.unitPrice * item.weight
      : item.unitPrice * item.quantity;
    
    return baseAmount - item.discount;
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
    <div className="min-h-screen bg-gray-100">
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
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Search className="w-5 h-5 inline mr-2" />
                Products
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cart'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Cart ({cart.length})
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-green-500 text-green-600'
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
                <div className="flex-1 p-6">
                  <ProductSearch onAddToCart={addToCart} />
                </div>
                <div className="w-80 border-l border-gray-200 bg-white">
                  <QuickSaleShortcuts onAddToCart={addToCart} />
                </div>
              </div>
            )}
            
            {activeTab === 'cart' && (
              <div className="h-full p-6">
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
              <div className="h-full p-6">
                <CustomerLookup
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                />
              </div>
            )}
            
            {activeTab === 'payment' && (
              <div className="h-full p-6">
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
