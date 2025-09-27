import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Smartphone,
  X, 
  Plus, 
  Minus,
  Trash2,
  Barcode,
  User,
  Receipt,
  Zap,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';
import MobileBottomSheet from '../components/shared/MobileBottomSheet';
import FloatingActionButton from '../components/shared/FloatingActionButton';
import { ProductVariant, CartItem, Customer } from '../../types/pos';
import { supabase } from '../../lib/supabase';
import { simplifiedAuth } from '../../lib/simplifiedAuth';

// Using types from pos.ts

const CashierScreen: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'paymaya' | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Get current branch ID from user session
  const getCurrentBranchId = () => {
    const currentUser = simplifiedAuth.getCurrentUser();
    
    if (currentUser?.branch_id) {
      console.log('Using user branch ID:', currentUser.branch_id, 'for user:', currentUser.email);
      return currentUser.branch_id;
    }
    
    // Fallback to a default branch ID if no branch assigned to user
    console.warn('No branch assigned to user, using fallback. User:', currentUser?.email || 'No user');
    return 'default-branch';
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      // Get the current branch ID from user session
      const branchId = getCurrentBranchId();
      console.log('Using branch ID:', branchId);
      
      // First, let's check if we have any inventory records
      const { data: inventoryCheck, error: inventoryError } = await supabase
        .from('inventory')
        .select('id')
        .eq('branch_id', branchId)
        .limit(1);

      if (inventoryError) {
        console.error('Inventory check error:', inventoryError);
        // If no inventory records, try to load products without inventory
        await loadProductsWithoutInventory();
        return;
      }

      if (!inventoryCheck || inventoryCheck.length === 0) {
        console.log('No inventory records found, loading products without inventory');
        await loadProductsWithoutInventory();
        return;
      }

      // Load products with inventory data using a simpler approach
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          branch_id,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          max_stock_level,
          product_variants!inner(
            id,
            name,
            sku,
            price,
            barcode,
            image_url,
            requires_expiry_date,
            requires_batch_tracking,
            batch_number,
            expiry_date,
            is_quick_sale,
            products!inner(
              id,
              name,
              category_id,
              is_active
            )
          )
        `)
        .eq('branch_id', branchId)
        .eq('product_variants.is_active', true)
        .eq('product_variants.products.is_active', true);

      if (error) {
        console.error('Error loading products with inventory:', error);
        // Fallback to products without inventory
        await loadProductsWithoutInventory();
        return;
      }

      // Transform the data
      const transformedProducts: ProductVariant[] = data?.map((item: any) => {
        const variant = item.product_variants;
        const product = variant.products;
        
        return {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          barcode: variant.barcode,
          image_url: variant.image_url,
          requires_expiry_date: variant.requires_expiry_date,
          requires_batch_tracking: variant.requires_batch_tracking,
          batch_number: variant.batch_number,
          expiry_date: variant.expiry_date,
          is_quick_sale: variant.is_quick_sale,
          is_active: true,
          product_id: product.id,
          variant_type: 'standard' as const,
          variant_value: '',
          created_at: new Date().toISOString(),
          pos_pricing_type: 'fixed' as const,
          products: {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            is_active: product.is_active
          },
          inventory: {
            id: item.id,
            branch_id: item.branch_id,
            product_variant_id: variant.id,
            quantity_on_hand: item.quantity_on_hand,
            quantity_reserved: item.quantity_reserved,
            quantity_available: item.quantity_available,
            reorder_level: item.reorder_level,
            max_stock_level: item.max_stock_level
          }
        };
      }) || [];

      console.log('Loaded products with inventory:', transformedProducts);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      // Final fallback - try to load products without inventory
      await loadProductsWithoutInventory();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback function to load products without inventory data
  const loadProductsWithoutInventory = async () => {
    try {
      console.log('Loading products without inventory data...');
      const branchId = getCurrentBranchId();
      
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          name,
          sku,
          price,
          barcode,
          image_url,
          requires_expiry_date,
          requires_batch_tracking,
          batch_number,
          expiry_date,
          is_quick_sale,
          products!inner(
            id,
            name,
            category_id,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true);

      if (error) throw error;

      // Transform the data without inventory
      const transformedProducts: ProductVariant[] = data?.map((item: any) => {
        const product = item.products;
        
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          barcode: item.barcode,
          image_url: item.image_url,
          requires_expiry_date: item.requires_expiry_date,
          requires_batch_tracking: item.requires_batch_tracking,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          is_quick_sale: item.is_quick_sale,
          is_active: true,
          product_id: product.id,
          variant_type: 'standard' as const,
          variant_value: '',
          created_at: new Date().toISOString(),
          pos_pricing_type: 'fixed' as const,
          products: {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            is_active: product.is_active
          },
          inventory: {
            id: 'temp-id',
            branch_id: branchId,
            product_variant_id: item.id,
            quantity_on_hand: 0,
            quantity_reserved: 0,
            quantity_available: 0,
            reorder_level: 0,
            max_stock_level: 0
          }
        };
      }) || [];

      console.log('Loaded products without inventory:', transformedProducts);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products without inventory:', error);
      alert('Failed to load products. Please check your database connection and ensure you have data in the product_variants table.');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery)
  );

  const addToCart = (product: ProductVariant) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        lineTotal: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              quantity: newQuantity,
              lineTotal: item.unitPrice * newQuantity - item.discount
            }
          : item
      ));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.lineTotal, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.12; // 12% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setSearchQuery('');
    }
  };

  const handlePayment = () => {
    // Process payment logic here
    console.log('Processing payment:', {
      cart,
      customer: selectedCustomer,
      paymentMethod,
      total: calculateTotal()
    });
    
    // Clear cart and reset
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod(null);
    setCashAmount('');
    setShowPaymentModal(false);
  };

  return (
    <div className="pos-system h-screen flex flex-col">
      {/* Header with Search and Barcode */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex space-x-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.length > 3) {
                  handleBarcodeScan(searchQuery);
                }
              }}
            />
          </div>
          
          {/* Barcode Scanner Button */}
          <TouchButton
            onClick={() => barcodeInputRef.current?.focus()}
            variant="outline"
            icon={Barcode}
            className="px-6"
          >
            Scan
          </TouchButton>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">No products found</p>
              <p className="text-gray-400">Try adjusting your search or check your database connection</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Debug: Products loaded: {products.length}</p>
                <p>Search query: "{searchQuery}"</p>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const stockQuantity = product.inventory?.quantity_available || 0;
                const reorderLevel = product.inventory?.reorder_level || 0;
                const maxStock = product.inventory?.max_stock_level || 0;
                const isLowStock = stockQuantity <= reorderLevel && stockQuantity > 0;
                const isOutOfStock = stockQuantity <= 0;
                const stockPercentage = maxStock ? (stockQuantity / maxStock) * 100 : 100;

                return (
                  <div key={product.id} className="product-card">
                    {/* Product Image */}
                    <div className="w-full h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-3 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {product.name}
                        </h3>
                        {isLowStock && (
                          <span className="low-stock-badge">
                            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        SKU: {product.sku}
                      </div>
                      
                      {/* Stock Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Stock</span>
                          <span>{stockQuantity} left</span>
                        </div>
                        <div className="stock-progress">
                          <div 
                            className={`stock-progress-fill ${isLowStock ? 'stock-progress-low' : ''}`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-emerald-600">
                          ₱{product.price.toFixed(2)}
                        </span>
                        {!isOutOfStock && (
                          <button
                            onClick={() => addToCart(product)}
                            className="touch-button bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                      
                      {/* Quick Sale Badge */}
                      {product.is_quick_sale && (
                        <div className="flex items-center text-xs text-emerald-600 mb-2">
                          <Zap className="w-3 h-3 mr-1" />
                          Quick Sale
                        </div>
                      )}
                      
                      {/* Special Requirements */}
                      {(product.requires_expiry_date || product.requires_batch_tracking) && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Eye className="w-3 h-3 mr-1" />
                          {product.requires_expiry_date && 'Expiry Tracking'}
                          {product.requires_batch_tracking && 'Batch Tracking'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          )}
        </div>

        {/* Cart Sidebar - Desktop */}
        {!isMobile && (
        <div className="w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-2" />
                Cart ({cart.length})
              </h2>
              <button
                onClick={() => setCart([])}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Customer:</span>
              <button
                  onClick={() => {
                    // Simple customer selection for now
                    const mockCustomer: Customer = {
                      id: '1',
                      customer_number: 'C000001',
                      first_name: 'John',
                      last_name: 'Doe',
                      email: 'john.doe@example.com',
                      phone: '+1234567890',
                      address: '123 Main St',
                      city: 'Manila',
                      province: 'Metro Manila',
                      customer_type: 'regular',
                      is_active: true,
                      created_at: new Date().toISOString(),
                      user_id: 'user-1',
                      customer_code: 'C000001',
                      date_of_birth: '1990-01-01',
                      registration_date: new Date().toISOString(),
                      total_spent: 5000,
                      last_purchase_date: new Date().toISOString(),
                      loyalty_points: 150,
                      loyalty_tier: 'silver',
                      total_lifetime_spent: 5000
                    };
                    setSelectedCustomer(selectedCustomer ? null : mockCustomer);
                  }}
                  className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <User className="w-4 h-4" />
                  <span>{selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Add Customer'}</span>
              </button>
            </div>
            {selectedCustomer && (
              <div className="mt-2 text-xs text-gray-500">
                  Points: {selectedCustomer.loyalty_points}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">Cart is empty</p>
                <p className="text-sm">Add products to get started</p>
              </div>
            ) : (
              cart.map(item => (
                  <div key={item.id} className="product-card">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">₱{item.unitPrice.toFixed(2)}</span>
                      <div className="quantity-control">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                        <span className="quantity-display">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                      <span className="font-semibold text-emerald-600">
                        ₱{item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (12%):</span>
                  <span>₱{calculateTax().toFixed(2)}</span>
                </div>
                  <div className="flex justify-between text-xl font-bold text-emerald-600">
                  <span>Total:</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
                  <div className="text-xs text-gray-500 text-center">
                    VAT included
                  </div>
              </div>
              
              <TouchButton
                onClick={() => setShowPaymentModal(true)}
                variant="success"
                size="xl"
                fullWidth
                icon={CreditCard}
              >
                Proceed to Payment
              </TouchButton>
            </div>
          )}
        </div>
        )}

        {/* Mobile Bottom Sheet for Cart */}
        {isMobile && (
          <MobileBottomSheet
            isOpen={showMobileCart}
            onClose={() => setShowMobileCart(false)}
            title={`Cart (${cart.length})`}
          >
            {/* Customer Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Customer:</span>
                <button
                  onClick={() => {
                    // Simple customer selection for now
                    const mockCustomer: Customer = {
                      id: '1',
                      customer_number: 'C000001',
                      first_name: 'John',
                      last_name: 'Doe',
                      email: 'john.doe@example.com',
                      phone: '+1234567890',
                      address: '123 Main St',
                      city: 'Manila',
                      province: 'Metro Manila',
                      customer_type: 'regular',
                      is_active: true,
                      created_at: new Date().toISOString(),
                      user_id: 'user-1',
                      customer_code: 'C000001',
                      date_of_birth: '1990-01-01',
                      registration_date: new Date().toISOString(),
                      total_spent: 5000,
                      last_purchase_date: new Date().toISOString(),
                      loyalty_points: 150,
                      loyalty_tier: 'silver',
                      total_lifetime_spent: 5000
                    };
                    setSelectedCustomer(selectedCustomer ? null : mockCustomer);
                  }}
                  className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Add Customer'}</span>
                </button>
              </div>
              {selectedCustomer && (
                <div className="mt-2 text-xs text-gray-500">
                  Points: {selectedCustomer.loyalty_points}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">Cart is empty</p>
                  <p className="text-sm">Add products to get started</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="product-card">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">₱{item.unitPrice.toFixed(2)}</span>
                      <div className="quantity-control">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-semibold text-emerald-600">
                        ₱{item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₱{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (12%):</span>
                    <span>₱{calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-emerald-600">
                    <span>Total:</span>
                    <span>₱{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    VAT included
                  </div>
                </div>
                
                <TouchButton
                  onClick={() => setShowPaymentModal(true)}
                  variant="success"
                  size="xl"
                  fullWidth
                  icon={CreditCard}
                >
                  Proceed to Payment
                </TouchButton>
              </div>
            )}
          </MobileBottomSheet>
        )}

        {/* Floating Action Button for Mobile Cart */}
        {isMobile && cart.length > 0 && (
          <FloatingActionButton
            onClick={() => setShowMobileCart(true)}
            icon={ShoppingCart}
            label="View Cart"
            variant="primary"
            className="fixed bottom-6 right-6 z-50"
          />
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Payment"
        size="lg"
      >
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Select Payment Method</h4>
            <div className="grid grid-cols-3 gap-4">
              <TouchButton
                onClick={() => setPaymentMethod('cash')}
                variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
                icon={Banknote}
                className="py-6"
              >
                Cash
              </TouchButton>
              <TouchButton
                onClick={() => setPaymentMethod('gcash')}
                variant={paymentMethod === 'gcash' ? 'primary' : 'outline'}
                icon={Smartphone}
                className="py-6"
              >
                GCash
              </TouchButton>
              <TouchButton
                onClick={() => setPaymentMethod('paymaya')}
                variant={paymentMethod === 'paymaya' ? 'primary' : 'outline'}
                icon={Smartphone}
                className="py-6"
              >
                PayMaya
              </TouchButton>
            </div>
          </div>

          {/* Cash Amount Input */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash Amount
              </label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Enter amount received"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
              />
              {cashAmount && (
                <div className="mt-2 text-sm text-gray-600">
                  Change: ₱{(parseFloat(cashAmount) - calculateTotal()).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Total Display */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                ₱{calculateTotal().toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <TouchButton
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </TouchButton>
            <TouchButton
              onClick={handlePayment}
              variant="success"
              className="flex-1"
              icon={Receipt}
              disabled={paymentMethod === 'cash' && (!cashAmount || parseFloat(cashAmount) < calculateTotal())}
            >
              Complete Payment
            </TouchButton>
          </div>
        </div>
      </Modal>

      {/* Hidden barcode input for scanning */}
      <input
        ref={barcodeInputRef}
        type="text"
        className="sr-only"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleBarcodeScan(searchQuery);
          }
        }}
      />
    </div>
  );
};

export default CashierScreen;

