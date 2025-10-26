import React, { useState } from 'react';
import { Trash2, Plus, Minus, User, CreditCard, AlertTriangle, ShoppingCart, X, ChevronDown, ChevronUp } from 'lucide-react';
import { CartItem, Customer } from '../../types/pos';

interface ShoppingCartProps {
  cart: CartItem[];
  selectedCustomer?: Customer | null;
  onUpdateItem: (itemId: string, updates: Partial<CartItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  onProceedToPayment: () => void;

}

const ShoppingCarts: React.FC<ShoppingCartProps> = ({
  cart,
  selectedCustomer,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  subtotal,
  tax,
  total,
  onProceedToPayment
}) => {
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateItem(itemId, { quantity: newQuantity });
    }
  };

  const handleWeightChange = (itemId: string, newWeight: number) => {
    if (newWeight <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateItem(itemId, { weight: newWeight });
    }
  };

  const handleDiscountChange = (itemId: string, discount: number) => {
    onUpdateItem(itemId, { discount: Math.max(0, discount) });
  };

  const getLowStockItems = () => {
    return cart.filter(item => item.product.stock_quantity <= item.product.minimum_stock);
  };

  const lowStockItems = getLowStockItems();

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-6">Add products to get started with a sale</p>
        <div className="text-sm text-gray-400">
          <p>💡 Tip: Use the search bar or scan barcodes to add items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col cart-panel">
      {/* Cart Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Shopping Cart
              </h2>
              <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Add Customer Button */}
        <button className="w-full bg-emerald-50 border-2 border-dashed border-emerald-200 text-emerald-700 py-3 px-4 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-colors font-semibold flex items-center justify-center gap-2">
          <User className="w-5 h-5" />
          {selectedCustomer ? 'Change Customer' : '+ Add Customer'}
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Low Stock Alert
            </span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {lowStockItems.length} item(s) are running low on stock
          </p>
        </div>
      )}

      {/* Customer Info */}
      {selectedCustomer && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Customer: {selectedCustomer.first_name} {selectedCustomer.last_name}
              </span>
            </div>
            <button
              onClick={() => setShowCustomerInfo(!showCustomerInfo)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {showCustomerInfo ? 'Hide' : 'Show'} Details
            </button>
          </div>
          {showCustomerInfo && (
            <div className="mt-2 text-sm text-blue-700">
              <p>Type: {selectedCustomer.customer_type}</p>
              <p>Phone: {selectedCustomer.phone || 'N/A'}</p>
              {selectedCustomer.loyalty_points && (
                <p>Loyalty Points: {selectedCustomer.loyalty_points}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.product.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">SKU: {item.product.sku}</p>
                  {item.product.pos_pricing_type === 'weight_based' && item.weight && (
                    <p className="text-sm text-gray-600 mt-1">
                      Weight: {item.weight} {item.product.unit_of_measure}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quantity/Weight Controls */}
                {/* Quantity/Weight Controls */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity ({item.selectedUnit?.unit_name || item.product.unit_of_measure})
                  </label>

                  <div className="quantity-control">
                    <button
                      onClick={() => {
                        const step = item.selectedUnit?.is_base_unit ? 1 : (item.selectedUnit?.min_sellable_quantity || 0.1);
                        handleQuantityChange(item.id, Math.max(0, item.quantity - step));
                      }}
                      className="quantity-btn"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      step={item.selectedUnit?.is_base_unit ? 1 : (item.selectedUnit?.min_sellable_quantity || 0.1)}
                      min={item.selectedUnit?.is_base_unit ? 1 : (item.selectedUnit?.min_sellable_quantity || 0.1)}
                      max={item.product.stock_quantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (item.selectedUnit?.is_base_unit && !Number.isInteger(val)) return; // Prevent decimals
                        handleQuantityChange(item.id, val);
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    <button
                      onClick={() => {
                        const step = item.selectedUnit?.is_base_unit ? 1 : (item.selectedUnit?.min_sellable_quantity || 0.1);
                        handleQuantityChange(item.id, item.quantity + step);
                      }}
                      className="quantity-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>


                {/* Discount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.discount}
                    onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600">
                    {formatPrice(item.unitPrice)} × {item.product.pos_pricing_type === 'weight_based' ? item.weight : item.quantity}
                  </span>
                  <span className="font-bold text-gray-900 text-lg">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
                {item.discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatPrice(item.discount)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Tax (12%)</span>
            <span className="font-semibold text-gray-900">{formatPrice(tax)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-emerald-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onProceedToPayment}
          className="w-full mt-6 bg-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default ShoppingCart;

