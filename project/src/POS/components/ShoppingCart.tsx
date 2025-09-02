import React, { useState } from 'react';
import { Trash2, Plus, Minus, User, CreditCard, AlertTriangle } from 'lucide-react';
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

const ShoppingCart: React.FC<ShoppingCartProps> = ({
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
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-500">Add products to get started with a sale</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Cart Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Shopping Cart ({cart.length} items)
          </h2>
          <button
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Clear All
          </button>
        </div>
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
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                  {item.product.pos_pricing_type === 'weight_based' && item.weight && (
                    <p className="text-sm text-gray-600">
                      Weight: {item.weight} {item.product.unit_of_measure}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity/Weight Controls */}
                <div>
                  {item.product.pos_pricing_type === 'weight_based' ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Weight ({item.product.unit_of_measure})
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleWeightChange(item.id, (item.weight || 0) - 0.1)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.weight || 0}
                          onChange={(e) => handleWeightChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleWeightChange(item.id, (item.weight || 0) + 0.1)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock_quantity}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.discount}
                    onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {formatPrice(item.unitPrice)} × {item.product.pos_pricing_type === 'weight_based' ? item.weight : item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
                {item.discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600">
                    <span>Discount</span>
                    <span>-{formatPrice(item.discount)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (12%)</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-green-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onProceedToPayment}
          className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default ShoppingCart;

