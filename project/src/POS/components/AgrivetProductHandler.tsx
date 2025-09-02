import React, { useState } from 'react';
import { Scale, Package, Syringe, Pill, Calendar, Hash } from 'lucide-react';
import { Product } from '../../types/pos';

interface AgrivetProductHandlerProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, weight?: number, expiryDate?: string, batchNumber?: string) => void;
  onCancel: () => void;
}

const AgrivetProductHandler: React.FC<AgrivetProductHandlerProps> = ({
  product,
  onAddToCart,
  onCancel
}) => {
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');

  const getProductIcon = () => {
    // Determine icon based on product category and type
    if (product.name.toLowerCase().includes('feed') || product.name.toLowerCase().includes('fertilizer')) {
      return <Scale className="w-6 h-6 text-orange-600" />;
    } else if (product.name.toLowerCase().includes('syringe') || product.name.toLowerCase().includes('injection')) {
      return <Syringe className="w-6 h-6 text-blue-600" />;
    } else if (product.name.toLowerCase().includes('capsule') || product.name.toLowerCase().includes('tablet')) {
      return <Pill className="w-6 h-6 text-green-600" />;
    } else {
      return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPricingTypeLabel = () => {
    switch (product.pos_pricing_type) {
      case 'weight_based':
        return 'Weight-based pricing';
      case 'bulk':
        return 'Bulk pricing';
      default:
        return 'Fixed pricing';
    }
  };

  const getUnitOfMeasureLabel = () => {
    // Special handling for agrivet products
    if (product.name.toLowerCase().includes('feed') && !product.name.toLowerCase().includes('bag') && !product.name.toLowerCase().includes('sack')) {
      return 'kg';
    } else if (product.name.toLowerCase().includes('medicine') || product.name.toLowerCase().includes('capsule') || product.name.toLowerCase().includes('tablet')) {
      if (product.name.toLowerCase().includes('box')) {
        return 'box';
      } else {
        return 'piece';
      }
    } else if (product.name.toLowerCase().includes('sachet')) {
      return 'sachet';
    } else if (product.name.toLowerCase().includes('syringe') || product.name.toLowerCase().includes('injection')) {
      if (product.name.toLowerCase().includes('glass') || product.name.toLowerCase().includes('vial')) {
        return 'vial';
      } else {
        return 'syringe';
      }
    }
    return product.unit_of_measure;
  };

  const calculateTotal = () => {
    if (product.pos_pricing_type === 'weight_based' && weight) {
      return product.unit_price * weight;
    } else {
      return product.unit_price * quantity;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const handleAddToCart = () => {
    const finalQuantity = product.pos_pricing_type === 'weight_based' ? 1 : quantity;
    const finalWeight = product.pos_pricing_type === 'weight_based' ? weight : undefined;
    const finalExpiryDate = product.requires_expiry_date ? expiryDate : undefined;
    const finalBatchNumber = product.requires_batch_tracking ? batchNumber : undefined;

    onAddToCart(product, finalQuantity, finalWeight, finalExpiryDate, finalBatchNumber);
  };

  const isFormValid = () => {
    if (product.pos_pricing_type === 'weight_based') {
      return weight && weight > 0;
    } else {
      return quantity > 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-4">
          {getProductIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add to Cart</h3>
            <p className="text-sm text-gray-600">{getPricingTypeLabel()}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          <p className="text-sm text-gray-600">Price: {formatPrice(product.unit_price)} per {getUnitOfMeasureLabel()}</p>
        </div>

        {/* Quantity/Weight Input */}
        {product.pos_pricing_type === 'weight_based' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight ({getUnitOfMeasureLabel()})
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter weight"
            />
            <p className="text-xs text-gray-500 mt-1">
              For feeds and fertilizers sold by weight
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity ({getUnitOfMeasureLabel()})
            </label>
            <input
              type="number"
              min="1"
              max={product.stock_quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {product.stock_quantity} {getUnitOfMeasureLabel()}
            </p>
          </div>
        )}

        {/* Expiry Date Input */}
        {product.requires_expiry_date && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for medicines and perishables
            </p>
          </div>
        )}

        {/* Batch Number Input */}
        {product.requires_batch_tracking && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Batch Number
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter batch number"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for batch tracking
            </p>
          </div>
        )}

        {/* Total Calculation */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-lg font-bold text-green-600">
              {formatPrice(calculateTotal())}
            </span>
          </div>
          {product.pos_pricing_type === 'weight_based' && weight && (
            <p className="text-xs text-gray-500 mt-1">
              {formatPrice(product.unit_price)} × {weight} {getUnitOfMeasureLabel()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!isFormValid()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>

        {/* Product-specific Information */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            {product.name.toLowerCase().includes('feed') && (
              <p>🌾 Feed products are sold by weight (kg) unless packaged in bags/sacks</p>
            )}
            {product.name.toLowerCase().includes('medicine') && (
              <p>💊 Medicines are sold by piece (capsules) or sachets unless in boxes</p>
            )}
            {product.name.toLowerCase().includes('syringe') && (
              <p>💉 Liquid medicines are sold by syringe unless in glass vials</p>
            )}
            {product.requires_expiry_date && (
              <p>📅 Expiry date tracking is required for this product</p>
            )}
            {product.requires_batch_tracking && (
              <p>🔢 Batch number tracking is required for this product</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgrivetProductHandler;

