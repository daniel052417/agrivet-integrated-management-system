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
  Image as ImageIcon,
  Grid3X3,
  List
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';
import MobileBottomSheet from '../components/shared/MobileBottomSheet';
import FloatingActionButton from '../components/shared/FloatingActionButton';
import { ProductVariant, CartItem, Customer } from '../../types/pos';
import { supabase } from '../../lib/supabase';
import { customAuth } from '../../lib/customAuth';
import { POSTransactionService, CreateTransactionData } from '../../lib/posTransactionService';
import { POSDatabaseService } from '../services/databaseService';

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
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({}); // productId -> unitId
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const getCurrentBranchId = () => {
    const currentUser = customAuth.getCurrentUser();
    
    if (currentUser?.branch_id) {
      console.log('Using user branch ID:', currentUser.branch_id, 'for user:', currentUser.email);
      return currentUser.branch_id;
    }
    
    console.warn('No branch assigned to user, using fallback. User:', currentUser?.email || 'No user');
    return 'default-branch';
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      const branchId = getCurrentBranchId();
      console.log('Using branch ID:', branchId);
      
      // Check if we have any inventory records
      const { data: inventoryCheck, error: inventoryError } = await supabase
        .from('inventory')
        .select('id')
        .eq('branch_id', branchId)
        .limit(1);

      if (inventoryError) {
        console.error('Inventory check error:', inventoryError);
        console.error('Inventory error details:', JSON.stringify(inventoryError, null, 2));
        await loadProductsDirectly();
        return;
      }

      if (!inventoryCheck || inventoryCheck.length === 0) {
        console.log('No inventory records found, loading products without inventory');
        await loadProductsDirectly();
        return;
      }

      // Load products grouped with ALL their units (not flattened)
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
          base_unit,
          products!inner(
            id,
            name,
            sku,
            barcode,
            cost,
            unit_of_measure,
            expiry_date,
            is_active,
            image_url,
            categories!inner(
              id,
              name
            ),
            product_units(
              id,
              unit_name,
              unit_label,
              price_per_unit,
              is_base_unit,
              is_sellable,
              conversion_factor,
              min_sellable_quantity
            ),
            product_images!left(
              id,
              image_url,
              is_primary,
              sort_order
            )
          )
        `)
        .eq('branch_id', branchId)
        .eq('products.is_active', true)
        .order('sort_order', { 
          foreignTable: 'products.product_images',
          ascending: true 
        });

      if (error) {
        console.error('Error loading products with inventory:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        await loadProductsDirectly();
        return;
      }

      // Transform to keep products grouped with their units
      const transformedProducts = data?.map((item: any) => {
        const product = item.products;
        const category = product.categories;
        
        // Get primary image or first image
        const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url 
          || product.product_images?.[0]?.image_url 
          || product.image_url 
          || '';
        
        // Filter and sort sellable units
        const sellableUnits = (product.product_units || [])
          .filter((unit: any) => unit.is_sellable)
          .sort((a: any, b: any) => {
            // Sort by conversion_factor descending (largest first: 50kg, 25kg, 1kg, 0.25kg)
            return b.conversion_factor - a.conversion_factor;
          });
        
        // Find base unit or default to first sellable unit
        const defaultUnit = sellableUnits.find((u: any) => u.is_base_unit) || sellableUnits[0];
        
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          image_url: primaryImage,
          cost: product.cost || 0,
          category: {
            id: category.id,
            name: category.name,
            sort_order: 0,
            is_active: true,
            created_at: new Date().toISOString()
          },
          // Store ALL units with the product
          units: sellableUnits.map((unit: any) => ({
            id: unit.id,
            unit_name: unit.unit_name,
            unit_label: unit.unit_label,
            price: unit.price_per_unit,
            is_base_unit: unit.is_base_unit,
            conversion_factor: unit.conversion_factor,
            min_sellable_quantity: unit.min_sellable_quantity
          })),
          // Default selected unit
          selectedUnit: defaultUnit ? {
            id: defaultUnit.id,
            unit_name: defaultUnit.unit_name,
            unit_label: defaultUnit.unit_label,
            price: defaultUnit.price_per_unit,
            is_base_unit: defaultUnit.is_base_unit
          } : null,
          inventory: {
            id: item.id,
            branch_id: item.branch_id,
            product_id: product.id,
            quantity_on_hand: item.quantity_on_hand,
            quantity_reserved: item.quantity_reserved,
            quantity_available: item.quantity_available,
            reorder_level: item.reorder_level,
            max_stock_level: item.max_stock_level,
            base_unit: item.base_unit
          },
          // Metadata
          requires_expiry_date: product.expiry_date ? true : false,
          is_active: product.is_active,
          // Backward compatibility fields
          price: defaultUnit?.price_per_unit || 0,
          product_id: product.id,
          variant_type: 'standard' as const,
          variant_value: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_id: product.category_id,
          pos_pricing_type: 'fixed' as const,
          unit_of_measure: product.unit_of_measure,
          weight: product.weight || 0,
          requires_batch_tracking: false,
          batch_number: undefined,
          expiry_date: product.expiry_date,
          is_quick_sale: false,
          products: {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            is_active: product.is_active
          }
        };
      }) || [];

      console.log('Loaded products grouped with units:', transformedProducts);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      await loadProductsDirectly();
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductsDirectly = async () => {
    try {
      console.log('Loading products directly from products table...');
      const branchId = getCurrentBranchId();
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          barcode,
          unit_price,
          cost_price,
          unit_of_measure,
          expiry_date,
          is_active,
          categories!inner(
            id,
            name
          )
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading products directly:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Transform the data without inventory - create one product per base product with mock units
      const transformedProducts: ProductVariant[] = data?.map((item: any) => {
        const category = item.categories;
        
        // Create mock units for demonstration (since product_units table doesn't exist)
        const mockUnits = [
          { 
            id: '50kg', 
            unit_name: '50kg',
            unit_label: '50kg', 
            price: item.unit_price || 0, 
            is_base_unit: true,
            conversion_factor: 1,
            min_sellable_quantity: 1
          },
          { 
            id: '25kg', 
            unit_name: '25kg',
            unit_label: '25kg', 
            price: (item.unit_price || 0) * 0.5, 
            is_base_unit: false,
            conversion_factor: 0.5,
            min_sellable_quantity: 1
          },
          { 
            id: '1kg', 
            unit_name: '1kg',
            unit_label: '1kg', 
            price: (item.unit_price || 0) * 0.02, 
            is_base_unit: false,
            conversion_factor: 0.02,
            min_sellable_quantity: 1
          },
          { 
            id: '0.25kg', 
            unit_name: '0.25kg',
            unit_label: '0.25kg', 
            price: (item.unit_price || 0) * 0.005, 
            is_base_unit: false,
            conversion_factor: 0.005,
            min_sellable_quantity: 0.25
          }
        ];
        
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.unit_price || 0,
          barcode: item.barcode,
          image_url: item.image_url || '',
          requires_expiry_date: item.expiry_date ? true : false,
          requires_batch_tracking: false,
          batch_number: undefined,
          expiry_date: item.expiry_date,
          is_quick_sale: false,
          is_active: item.is_active,
          product_id: item.id,
          variant_type: 'standard' as const,
          variant_value: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_id: item.category_id,
          pos_pricing_type: 'fixed' as const,
          unit_of_measure: item.unit_of_measure,
          weight: item.weight || 0,
          cost: item.cost_price || 0,
          category: {
            id: category.id,
            name: category.name,
            sort_order: 0,
            is_active: true,
            created_at: new Date().toISOString()
          },
          inventory: {
            id: 'temp-id',
            branch_id: branchId,
            product_id: item.id,
            quantity_on_hand: 0,
            quantity_reserved: 0,
            quantity_available: 0,
            reorder_level: 0,
            max_stock_level: 0
          },
          products: {
            id: item.id,
            name: item.name,
            category_id: item.category_id,
            is_active: item.is_active
          },
          // Add mock units for the grouped card design
          availableUnits: mockUnits.map(unit => ({
            id: unit.id,
            label: unit.unit_label,
            price: unit.price,
            isBase: unit.is_base_unit
          })),
          units: mockUnits,
          selectedUnit: mockUnits[0] // Default to 50kg
        };
      }) || [];

      console.log('Loaded products directly:', transformedProducts);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products directly:', error);
      alert('Failed to load products. Please check your database connection and ensure you have data in the products table.');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery)
  );

  const selectUnit = (productId: string, unitId: string) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: unitId
    }));
  };

  const getSelectedUnit = (product: ProductVariant) => {
    const selectedUnitId = selectedUnits[product.id];
    const availableUnits = generateDynamicUnits(product);
    
    if (selectedUnitId) {
      return availableUnits.find((unit: any) => unit.id === selectedUnitId) || availableUnits[0];
    }
    
    // Use the product's default selectedUnit or find base unit
    if (product.selectedUnit) {
      return product.selectedUnit;
    }
    
    // Fallback to base unit or first unit
    return availableUnits.find((unit: any) => unit.is_base_unit || unit.isBase) || availableUnits[0];
  };

  const getCurrentPrice = (product: ProductVariant) => {
    const selectedUnit = getSelectedUnit(product);
    const isBaseUnit = selectedUnit?.is_base_unit || selectedUnit?.isBase;
    
    if (isBaseUnit) {
      // Base unit uses its fixed price
      return selectedUnit?.price || product.price;
    } else {
      // Sub-units calculate price based on selected unit's conversion factor
      const units = product.units || (product as any).availableUnits || [];
      const smallestUnit = units.reduce((smallest: any, unit: any) => {
        if (!smallest || unit.conversion_factor < smallest.conversion_factor) {
          return unit;
        }
        return smallest;
      });
      
      if (smallestUnit && selectedUnit) {
        const pricePerKg = smallestUnit.price / smallestUnit.conversion_factor;
        return pricePerKg * selectedUnit.conversion_factor;
      }
      
      return selectedUnit?.price || product.price;
    }
  };

  // Enhanced unit selection with tiered pricing system
  const generateDynamicUnits = (product: ProductVariant) => {
    const units = product.units || (product as any).availableUnits || [];
    if (units.length === 0) return [];

    // Find the minimum sellable quantity from all units
    const minSellableQuantity = Math.min(
      ...units.map((unit: any) => unit.min_sellable_quantity || 0.25)
    );

    // Find the base unit (is_base_unit = true) and smallest unit for calculations
    const baseUnit = units.find((u: any) => u.is_base_unit);
    const smallestUnit = units.reduce((smallest: any, unit: any) => {
      if (!smallest || unit.conversion_factor < smallest.conversion_factor) {
        return unit;
      }
      return smallest;
    });

    // Generate practical unit options based on min sellable quantity
    const baseUnits = [50, 25, 10, 5, 1, 0.5, 0.25]; // Common selling units
    const availableUnits = baseUnits.filter(unit => unit >= minSellableQuantity);

    // Create dynamic unit options with tiered pricing
    const dynamicUnits = availableUnits.map(unit => {
      let unitPrice = 0;
      let pricingMethod = '';

      if (baseUnit && unit >= baseUnit.conversion_factor) {
        // For units >= base unit: use base unit pricing
        unitPrice = baseUnit.price;
        pricingMethod = 'base_unit';
      } else if (smallestUnit) {
        // For units < base unit: use smallest unit pricing
        unitPrice = (smallestUnit.price / smallestUnit.conversion_factor) * unit;
        pricingMethod = 'smallest_unit';
      } else {
        // Fallback to original calculation
        unitPrice = (baseUnit?.price || 0) / (baseUnit?.conversion_factor || 1) * unit;
        pricingMethod = 'fallback';
      }
      
      // Format display label
      let displayLabel = '';
      if (unit >= 1) {
        displayLabel = `${unit}kg`;
      } else if (unit === 0.5) {
        displayLabel = '1/2';
      } else if (unit === 0.25) {
        displayLabel = '1/4';
      } else {
        displayLabel = `${unit}kg`;
      }

      return {
        id: `dynamic_${unit}`,
        unit_name: `${unit}kg`,
        unit_label: displayLabel,
        price: unitPrice,
        conversion_factor: unit,
        min_sellable_quantity: minSellableQuantity,
        is_dynamic: true,
        pricing_method: pricingMethod,
        base_unit_id: baseUnit?.id,
        smallest_unit_id: smallestUnit?.id
      };
    });

    // Add original units if they're not already covered
    const originalUnits = units.map((unit: any) => ({
      ...unit,
      is_dynamic: false,
      pricing_method: unit.is_base_unit ? 'base_unit' : 'smallest_unit'
    }));

    // Combine and deduplicate by conversion_factor
    const allUnits = [...originalUnits, ...dynamicUnits];
    const uniqueUnits = allUnits.reduce((acc: any[], unit: any) => {
      const existing = acc.find(u => Math.abs(u.conversion_factor - unit.conversion_factor) < 0.01);
      if (!existing) {
        acc.push(unit);
      }
      return acc;
    }, []);

    // Sort by conversion_factor descending (largest first)
    return uniqueUnits.sort((a: any, b: any) => b.conversion_factor - a.conversion_factor);
  };


  const addToCart = (product: ProductVariant) => {
    const selectedUnit = getSelectedUnit(product);
    const currentPrice = getCurrentPrice(product);
    
    // Check if this is a base unit or sub-unit
    const isBaseUnit = selectedUnit?.is_base_unit || selectedUnit?.isBase;
    const unitQuantity = isBaseUnit ? 1 : (selectedUnit?.conversion_factor || 1);
    
    // Calculate the correct unit price for display
    let displayUnitPrice = currentPrice;
    if (!isBaseUnit) {
      // For sub-units, use per-kg pricing for display
      const units = product.units || (product as any).availableUnits || [];
      const smallestUnit = units.reduce((smallest: any, unit: any) => {
        if (!smallest || unit.conversion_factor < smallest.conversion_factor) {
          return unit;
        }
        return smallest;
      });
      
      if (smallestUnit) {
        displayUnitPrice = smallestUnit.price / smallestUnit.conversion_factor;
      }
    }
    
    // Find existing item for the same product AND same unit type (base/sub)
    const existingItem = cart.find(item => 
      item.product.id === product.id && 
      item.isBaseUnit === isBaseUnit
    );
    
    if (existingItem) {
      // Merge with existing item of the same type
      const newQuantity = existingItem.quantity + unitQuantity;
      
      setCart(cart.map(item =>
        item.id === existingItem.id
          ? { 
              ...item, 
              quantity: newQuantity,
              lineTotal: newQuantity * item.unitPrice
            }
          : item
      ));
    } else {
      // Create new item with unit type information
      const newItem: CartItem = {
        id: `${product.id}-${isBaseUnit ? 'base' : 'sub'}-${Date.now()}`,
        product: {
          ...product,
          price: currentPrice,
          unit_of_measure: selectedUnit?.unit_label || selectedUnit?.label || product.unit_of_measure
        },
        quantity: unitQuantity,
        unitPrice: displayUnitPrice, // Use per-kg price for sub-units
        discount: 0,
        lineTotal: displayUnitPrice * unitQuantity, // Use per-kg price * quantity for line total
        selectedUnit: selectedUnit,
        isBaseUnit: isBaseUnit // Add unit type flag
      };
      
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => {
        if (item.id === itemId) {
          // Calculate correct line total based on unit type
          let lineTotal;
          if (item.isBaseUnit) {
            // Base units: quantity * unit price
            lineTotal = newQuantity * item.unitPrice;
          } else {
            // Sub-units: quantity * unit price (per kg)
            lineTotal = newQuantity * item.unitPrice;
          }
          
          return { 
            ...item, 
            quantity: newQuantity,
            lineTotal: lineTotal - item.discount
          };
        }
        return item;
      }));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.lineTotal, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setSearchQuery('');
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (paymentMethod === 'cash' && (!cashAmount || parseFloat(cashAmount) < calculateTotal())) {
      alert('Cash amount must be greater than or equal to the total amount');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      const currentUser = customAuth.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const branchId = getCurrentBranchId();
      
      // Get or create POS session
      console.log('Getting or creating POS session for cashier:', currentUser.id, 'branch:', branchId);
      const posSession = await POSDatabaseService.getOrCreatePOSSession(currentUser.id, branchId);
      const posSessionId = posSession.id;
      
      console.log('Using POS session:', posSessionId);

      // Prepare transaction data
      const transactionData: CreateTransactionData = {
        pos_session_id: posSessionId,
        customer_id: selectedCustomer?.id,
        cashier_id: currentUser.id,
        branch_id: branchId,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: item.quantity,
          unit_of_measure: item.isBaseUnit 
            ? (item.selectedUnit?.unit_label || item.product.unit_of_measure)
            : 'kg',
          unit_price: item.unitPrice,
          discount_amount: item.discount || 0,
          discount_percentage: item.discount > 0 ? (item.discount / item.lineTotal) * 100 : 0,
          line_total: item.lineTotal,
          weight_kg: item.isBaseUnit ? undefined : item.quantity,
          expiry_date: item.product.expiry_date,
          batch_number: item.product.batch_number
        })),
        subtotal: calculateSubtotal(),
        discount_amount: cart.reduce((sum, item) => sum + (item.discount || 0), 0),
        discount_percentage: cart.reduce((sum, item) => sum + (item.discount || 0), 0) / calculateSubtotal() * 100,
        tax_amount: 0, // No VAT for this store
        total_amount: calculateTotal(),
        notes: `Payment via ${paymentMethod}`,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'cash' ? parseFloat(cashAmount) : undefined,
        reference_number: paymentMethod !== 'cash' ? `REF-${Date.now()}` : undefined
      };

      console.log('Creating transaction:', transactionData);

      // Create the transaction
      const result = await POSTransactionService.createTransaction(transactionData);
      
      console.log('Transaction created successfully:', result);

      // Update inventory
      await POSTransactionService.updateInventoryAfterTransaction(
        branchId,
        cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      );

      console.log('Inventory updated successfully');

      // Update POS session totals
      await POSTransactionService.updatePOSSessionAfterTransaction(
        posSessionId,
        {
          total_amount: calculateTotal(),
          discount_amount: cart.reduce((sum, item) => sum + (item.discount || 0), 0),
          tax_amount: 0 // No VAT for this store
        }
      );

      console.log('POS session updated successfully');

      // Show success message
      setPaymentSuccess(true);
      
      // Reset form after a short delay
      setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        setPaymentMethod(null);
        setCashAmount('');
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setIsProcessingPayment(false);
      }, 2000);

    } catch (error) {
      console.error('Payment processing failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessingPayment(false);
    }
  };

  // Product Card Component
  const ProductCard = ({ product, viewMode }: { product: ProductVariant; viewMode: 'grid' | 'list' }) => {
    const stockQuantity = product.inventory?.quantity_available || 0;
    const reorderLevel = product.inventory?.reorder_level || 0;
    const maxStock = product.inventory?.max_stock_level || 0;
    const isLowStock = stockQuantity <= reorderLevel && stockQuantity > 0;
    const isOutOfStock = stockQuantity <= 0;
    const stockPercentage = maxStock ? (stockQuantity / maxStock) * 100 : 100;
    const availableUnits = generateDynamicUnits(product);
    const selectedUnit = getSelectedUnit(product);
    const currentPrice = getCurrentPrice(product);

    if (viewMode === 'list') {
      return (
        <div className="product-card flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          {/* Product Image */}
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                  {product.name}
                </h3>
                <div className="text-xs text-gray-500 mt-1">
                  SKU: {product.sku}
                </div>
              </div>
              {isLowStock && (
                <span className="low-stock-badge ml-2 flex-shrink-0">
                  {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                </span>
              )}
            </div>

            {/* Stock Info */}
            <div className="flex items-center space-x-4 mb-2">
              <div className="text-xs text-gray-600">
                Stock: {stockQuantity} left
              </div>
              <div className="flex-1 max-w-24">
                <div className="stock-progress">
                  <div 
                    className={`stock-progress-fill ${isLowStock ? 'stock-progress-low' : ''}`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Unit Selector */}
            {availableUnits.length > 1 && (
              <div className="mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Unit:</span>
                  <div className="flex flex-wrap gap-1">
                    {availableUnits.map((unit: any) => (
                      <button
                        key={unit.id}
                        onClick={() => selectUnit(product.id, unit.id)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          selectedUnit?.id === unit.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={`${unit.unit_name} - ₱${unit.price.toFixed(2)}`}
                      >
                        {unit.unit_label || unit.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price and Add Button */}
          <div className="flex flex-col items-end space-y-2 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">
                ₱{currentPrice.toFixed(2)}
              </div>
              {selectedUnit && (
                <div className="text-xs text-gray-500">
                  per {selectedUnit.unit_label || selectedUnit.label}
                  {selectedUnit.is_dynamic && (
                    <span className="text-emerald-600 ml-1">•</span>
                  )}
                </div>
              )}
            </div>
            {!isOutOfStock && (
              <button
                onClick={() => addToCart(product)}
                className="touch-button bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      );
    }

    // Grid View (existing layout)
    return (
      <div className="product-card">
        <div className="w-full h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-3 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
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

          {/* Enhanced Unit Selector */}
          {availableUnits.length > 1 && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-2">Select Unit:</div>
              <div className="flex flex-wrap gap-1">
                {availableUnits.map((unit: any) => (
                  <button
                    key={unit.id}
                    onClick={() => selectUnit(product.id, unit.id)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      selectedUnit?.id === unit.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={`${unit.unit_name} - ₱${unit.price.toFixed(2)}`}
                  >
                    {unit.unit_label || unit.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-emerald-600">
                ₱{currentPrice.toFixed(2)}
              </span>
              {selectedUnit && (
                <div className="text-xs text-gray-500">
                  per {selectedUnit.unit_label || selectedUnit.label}
                  {selectedUnit.is_dynamic && (
                    <span className="text-emerald-600 ml-1">•</span>
                  )}
                </div>
              )}
            </div>
            {!isOutOfStock && (
              <button
                onClick={() => addToCart(product)}
                className="touch-button bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add to Cart
              </button>
            )}
          </div>
          
          {product.is_quick_sale && (
            <div className="flex items-center text-xs text-emerald-600 mb-2">
              <Zap className="w-3 h-3 mr-1" />
              Quick Sale
            </div>
          )}
          
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
  };

  return (
    <div className="pos-system h-screen flex flex-col">
      <div className="bg-white shadow-lg p-4 flex-shrink-0">
        <div className="flex space-x-4">
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
          
          <div className="flex space-x-2">
            {/* View Toggle Buttons - Hidden on mobile */}
            {!isMobile && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            )}
            
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
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
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
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode="list" />
                ))}
              </div>
            )
          )}
        </div>

        {!isMobile && (
        <div className="w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Cart Header - Fixed */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
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

          {/* Customer Section - Fixed */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Customer:</span>
              <button
                onClick={() => {
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

          {/* Cart Items - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
                    <div className="text-sm text-gray-600">
                      {(() => {
                        if (item.isBaseUnit) {
                          // Base unit pricing
                          return `₱${item.unitPrice.toFixed(2)} per ${item.selectedUnit?.unit_label || 'unit'}`;
                        } else {
                          // Sub-unit pricing (per kg)
                          return `₱${item.unitPrice.toFixed(2)} per 1kg`;
                        }
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseFloat(e.target.value) || 0.01;
                          updateQuantity(item.id, newQuantity);
                        }}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <span className="text-xs text-gray-500">
                        {item.isBaseUnit ? (item.selectedUnit?.unit_label || 'unit') : 'kg'}
                      </span>
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

          {/* Payment Section - Completely Static at Bottom */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 space-y-3 bg-white shadow-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-xl font-bold text-emerald-600">
                  <span>Total:</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
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

        {isMobile && (
          <MobileBottomSheet
            isOpen={showMobileCart}
            onClose={() => setShowMobileCart(false)}
            title={`Cart (${cart.length})`}
          >
            {/* Mobile View Toggle */}
            <div className="mb-4 flex justify-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Customer:</span>
                <button
                  onClick={() => {
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
                      <div className="text-sm text-gray-600">
                        {(() => {
                          if (item.isBaseUnit) {
                            // Base unit pricing
                            return `₱${item.unitPrice.toFixed(2)} per ${item.selectedUnit?.unit_label || 'unit'}`;
                          } else {
                            // Sub-unit pricing (per kg)
                            return `₱${item.unitPrice.toFixed(2)} per 1kg`;
                          }
                        })()}
                      </div>
                      <div className="quantity-control">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(0.01, item.quantity - 0.01))}
                          className="quantity-btn"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="quantity-display">
                          {item.quantity}{item.isBaseUnit ? (item.selectedUnit?.unit_label || 'unit') : 'kg'}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 0.01)}
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

            {cart.length > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-xl font-bold text-emerald-600">
                    <span>Total:</span>
                    <span>₱{calculateTotal().toFixed(2)}</span>
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

      <Modal
        isOpen={showPaymentModal}
        onClose={() => !isProcessingPayment && setShowPaymentModal(false)}
        title={paymentSuccess ? "Payment Successful!" : "Payment"}
        size="lg"
      >
        <div className="space-y-6">
          {paymentSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Completed!</h3>
              <p className="text-gray-600 mb-4">Transaction has been recorded successfully.</p>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Inventory has been updated and receipt is ready for printing.
                </p>
              </div>
            </div>
          ) : isProcessingPayment ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment...</h3>
              <p className="text-gray-600">Please wait while we process your transaction.</p>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-lg font-semibold mb-4">Select Payment Method</h4>
                <div className="grid grid-cols-3 gap-4">
                  <TouchButton
                    onClick={() => setPaymentMethod('cash')}
                    variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
                    icon={Banknote}
                    className="py-6"
                    disabled={isProcessingPayment}
                  >
                    Cash
                  </TouchButton>
                  <TouchButton
                    onClick={() => setPaymentMethod('gcash')}
                    variant={paymentMethod === 'gcash' ? 'primary' : 'outline'}
                    icon={Smartphone}
                    className="py-6"
                    disabled={isProcessingPayment}
                  >
                    GCash
                  </TouchButton>
                  <TouchButton
                    onClick={() => setPaymentMethod('paymaya')}
                    variant={paymentMethod === 'paymaya' ? 'primary' : 'outline'}
                    icon={Smartphone}
                    className="py-6"
                    disabled={isProcessingPayment}
                  >
                    PayMaya
                  </TouchButton>
                </div>
              </div>

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
                    disabled={isProcessingPayment}
                  />
                  {cashAmount && (
                    <div className="mt-2 text-sm text-gray-600">
                      Change: ₱{(parseFloat(cashAmount) - calculateTotal()).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    ₱{calculateTotal().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>

              <div className="flex space-x-4">
                <TouchButton
                  onClick={() => setShowPaymentModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </TouchButton>
                <TouchButton
                  onClick={handlePayment}
                  variant="success"
                  className="flex-1"
                  icon={Receipt}
                  disabled={isProcessingPayment || (paymentMethod === 'cash' && (!cashAmount || parseFloat(cashAmount) < calculateTotal()))}
                >
                  {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
                </TouchButton>
              </div>
            </>
          )}
        </div>
      </Modal>

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

export default CashierScreen