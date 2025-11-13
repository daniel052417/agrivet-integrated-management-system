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
  List,
  DollarSign,
  Camera,
  Upload
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
  
  // Expense states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseType, setExpenseType] = useState('');
  const [expenseOther, setExpenseOther] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseImage, setExpenseImage] = useState<File | null>(null);
  const [expenseImagePreview, setExpenseImagePreview] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [branchName, setBranchName] = useState<string>('');
  const expenseImageInputRef = useRef<HTMLInputElement>(null);

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

  // Load employees when Cash Advance is selected
  useEffect(() => {
    if (expenseType === 'Cash Advance' && showExpenseModal) {
      loadEmployees();
    } else {
      setEmployees([]);
      setSelectedEmployeeId('');
    }
  }, [expenseType, showExpenseModal]);

  // Load branch name when expense modal opens
  useEffect(() => {
    if (showExpenseModal) {
      loadBranchName();
    }
  }, [showExpenseModal]);

  const loadBranchName = async () => {
    try {
      const branchId = getCurrentBranchId();
      if (branchId && branchId !== 'default-branch') {
        const { data, error } = await supabase
          .from('branches')
          .select('name')
          .eq('id', branchId)
          .eq('is_active', true)
          .single();
        
        if (error) throw error;
        setBranchName(data?.name || branchId);
      } else {
        setBranchName(branchId || 'N/A');
      }
    } catch (error) {
      console.error('Error loading branch name:', error);
      const branchId = getCurrentBranchId();
      setBranchName(branchId || 'N/A');
    }
  };

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const branchId = getCurrentBranchId();
      
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          employee_id,
          position,
          email
        `)
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .in('position', ['cashier', 'branch staff'])
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      alert('Failed to load employees. Please try again.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

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
      // Using explicit foreign key constraint names to avoid relationship ambiguity
      // Note: expiry_date, batch_number, batch_no, expiration_date are now in inventory table, not products
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
          batch_number,
          expiry_date,
          batch_no,
          expiration_date,
          products!inventory_product_id_fkey(
            id,
            name,
            sku,
            barcode,
            cost,
            unit_of_measure,
            is_active,
            image_url,
            categories!products_category_id_fkey(
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
            is_base_unit: defaultUnit.is_base_unit,
            conversion_factor: defaultUnit.conversion_factor,
            min_sellable_quantity: defaultUnit.min_sellable_quantity ?? 1, // 👈 add this
            minimum_stock: defaultUnit.minimum_stock ?? 0
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
          // Metadata - expiry_date, batch_number are now in inventory table, not products
          requires_expiry_date: item.expiry_date || item.expiration_date ? true : false,
          is_active: product.is_active,
          // Backward compatibility fields
          price: defaultUnit?.price_per_unit || 0,
          product_id: product.id,
          variant_type: 'standard' as const,
          variant_value: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_id: product.category_id || category.id,
          pos_pricing_type: 'fixed' as const,
          unit_of_measure: product.unit_of_measure,
          weight: product.weight || 0,
          requires_batch_tracking: item.batch_number || item.batch_no ? true : false,
          batch_number: item.batch_number || item.batch_no || undefined,
          expiry_date: item.expiry_date || item.expiration_date || undefined,
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
      
      // Using explicit foreign key constraint name to avoid relationship ambiguity
      // Note: expiry_date, batch_number are now in inventory table, not products
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          barcode,
          cost,
          unit_of_measure,
          is_active,
          image_url,
          categories!products_category_id_fkey(
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
          )
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading products directly:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Transform the data without inventory
      const transformedProducts: ProductVariant[] = data?.map((item: any) => {
        const category = item.categories || { id: null, name: 'Uncategorized' };
        
        // Filter and sort sellable units from product_units table
        const sellableUnits = (item.product_units || [])
          .filter((unit: any) => unit.is_sellable)
          .sort((a: any, b: any) => {
            return parseFloat(b.conversion_factor) - parseFloat(a.conversion_factor);
          });
        
        // Find base unit or default to first sellable unit
        const defaultUnit = sellableUnits.find((u: any) => u.is_base_unit) || sellableUnits[0];
        
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: 0, // Price will come from product_units.price_per_unit
          barcode: item.barcode,
          image_url: item.image_url || '',
          // Note: expiry_date, batch_number are in inventory table, not products
          // When loading directly from products (no inventory), these will be undefined
          requires_expiry_date: false,
          requires_batch_tracking: false,
          batch_number: undefined,
          expiry_date: undefined,
          is_quick_sale: false,
          is_active: item.is_active,
          product_id: item.id,
          variant_type: 'standard' as const,
          variant_value: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_id: category.id || item.category_id || null,
          pos_pricing_type: 'fixed' as const,
          unit_of_measure: item.unit_of_measure,
          weight: item.weight || 0,
          cost: item.cost || 0,
          category: {
            id: category.id || null,
            name: category.name || 'Uncategorized',
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
          // Store ALL units with the product from database
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
            is_base_unit: defaultUnit.is_base_unit,
            conversion_factor: defaultUnit.conversion_factor,
            min_sellable_quantity: defaultUnit.min_sellable_quantity ?? 1, // 👈 add this
            minimum_stock: defaultUnit.minimum_stock ?? 0
          } : null
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
    
    // Return the exact price from the database (price_per_unit)
    // No calculations needed - the database already has the correct price for each unit
    return selectedUnit?.price || product.price;
  };

  // Get units directly from database (product_units table) - NO hardcoded units
  const generateDynamicUnits = (product: ProductVariant) => {
    // Get units from product.units (which comes from product_units table)
    const units = product.units || [];
    
    // Return empty array if no units available
    if (units.length === 0) return [];

    // Filter only sellable units (is_sellable = true)
    // This should already be filtered in the query, but we double-check here
    const sellableUnits = units.filter((unit: any) => unit.is_sellable !== false);
    
    // Sort by conversion_factor descending (largest first: Sack, then Kg, etc.)
    return sellableUnits.sort((a: any, b: any) => {
      const aFactor = parseFloat(a.conversion_factor || 0);
      const bFactor = parseFloat(b.conversion_factor || 0);
      return bFactor - aFactor;
    });
  };


  const addToCart = (product: ProductVariant) => {
    const selectedUnit = getSelectedUnit(product);
    const currentPrice = getCurrentPrice(product); // This is the exact price_per_unit from database
    
    // Use the minimum sellable quantity from the selected unit or default to 1
    const minQuantity = parseFloat((selectedUnit as any)?.min_sellable_quantity || '1');
    
    // Find existing item with the same product AND same unit
    const existingItem = cart.find(item => 
      item.product.id === product.id && 
      item.selectedUnit?.id === selectedUnit?.id
    );
    
    if (existingItem) {
      // Add minimum quantity to existing item
      const newQuantity = existingItem.quantity + minQuantity;
      
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
      // Create new cart item with the selected unit and its price
      const newItem: CartItem = {
        id: `${product.id}-${selectedUnit?.id}-${Date.now()}`,
        product: {
          ...product,
          price: currentPrice || 0,
          unit_of_measure: selectedUnit?.unit_label || product.unit_of_measure
        },
        quantity: minQuantity,
        unitPrice: currentPrice || 0, // Use the exact price_per_unit from database
        discount: 0,
        lineTotal: (currentPrice || 0) * minQuantity,
        minimum_stock: (selectedUnit as any)?.minimum_stock ?? product.minimum_stock ?? 0,
        selectedUnit: {
          id: selectedUnit?.id || '',
          unit_name: selectedUnit?.unit_name || '',
          unit_label: selectedUnit?.unit_label || '',
          price: currentPrice || 0,
          is_base_unit: selectedUnit?.is_base_unit || false,
          conversion_factor: (selectedUnit as any)?.conversion_factor || 1,
          min_sellable_quantity: (selectedUnit as any)?.min_sellable_quantity || 1,
          minimum_stock: (selectedUnit as any)?.minimum_stock ?? 0
        },
        isBaseUnit: selectedUnit?.is_base_unit || false
      };
      
      setCart([...cart, newItem]);
    }
  };

      const updateQuantity = async (itemId: string, newQuantity: number) => {
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.id === itemId) {
            const { selectedUnit } = item;
            const isBaseUnit = selectedUnit?.is_base_unit;
            const minQty = selectedUnit?.min_sellable_quantity ?? 0.01;

            let validQuantity = newQuantity;

            if (isBaseUnit) {
              validQuantity = Math.floor(newQuantity); // whole numbers only
            } else {
              const multiplier = Math.round(validQuantity / minQty);
              validQuantity = parseFloat((multiplier * minQty).toFixed(2));
            }

            if (validQuantity <= 0) return null;

            const lineTotal = validQuantity * item.unitPrice;

            return {
              ...item,
              quantity: validQuantity,
              lineTotal: lineTotal - (item.discount || 0),
            };
          }
          return item;
        }).filter(Boolean) as CartItem[]
      );
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
          unit_of_measure: item.selectedUnit?.unit_label || item.product.unit_of_measure,
          unit_price: item.unitPrice,
          discount_amount: item.discount || 0,
          discount_percentage: item.discount > 0 ? (item.discount / item.lineTotal) * 100 : 0,
          line_total: item.lineTotal,
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

  const handleExpenseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setExpenseImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpenseImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitExpense = async () => {
    try {
      // Validate form
      if (!expenseType) {
        alert('Please select an expense type');
        return;
      }
      
      if (expenseType === 'Other' && !expenseOther.trim()) {
        alert('Please specify the expense type');
        return;
      }
      
      if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      if (!expenseDescription.trim()) {
        alert('Please enter a description');
        return;
      }
      
      if (expenseType === 'Cash Advance' && !selectedEmployeeId) {
        alert('Please select an employee for cash advance');
        return;
      }

      setIsSubmittingExpense(true);
      
      const currentUser = customAuth.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const branchId = getCurrentBranchId();
      
      // Upload image if provided
      let receiptUrl = null;
      let receiptFileName = null;
      
      if (expenseImage) {
        const fileExt = expenseImage.name.split('.').pop();
        const fileName = `expenses/${branchId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, expenseImage, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          // Try fallback bucket if receipts bucket doesn't exist
          console.warn('Receipts bucket not found, trying expenses bucket');
          const { error: fallbackError } = await supabase.storage
            .from('expenses')
            .upload(fileName, expenseImage, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (fallbackError) {
            console.error('Error uploading expense image:', fallbackError);
            // Continue without image
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('expenses')
              .getPublicUrl(fileName);
            receiptUrl = publicUrl;
            receiptFileName = fileName;
          }
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          receiptUrl = publicUrl;
          receiptFileName = fileName;
        }
      }
      
      // Determine category name
      const categoryName = expenseType === 'Other' ? expenseOther : expenseType;
      
      // Get or create expense category
      let categoryId: string | null = null;
      
      // First, try to find existing category
      const { data: existingCategory } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('name', categoryName)
        .eq('is_active', true)
        .single();
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category if it doesn't exist
        const { data: newCategory, error: createCategoryError } = await supabase
          .from('expense_categories')
          .insert([{
            name: categoryName,
            is_active: true
          }])
          .select('id')
          .single();
        
        if (createCategoryError) {
          console.error('Error creating expense category:', createCategoryError);
          // Continue without category_id if creation fails
        } else if (newCategory) {
          categoryId = newCategory.id;
        }
      }
      
      // Prepare description with employee info if cash advance
      const finalDescription = expenseType === 'Cash Advance' && selectedEmployeeId
        ? `${expenseDescription} (Employee: ${employees.find(e => e.id === selectedEmployeeId)?.first_name} ${employees.find(e => e.id === selectedEmployeeId)?.last_name})`
        : expenseDescription;
      
      // Get current date
      const expenseDate = new Date().toISOString().split('T')[0];
      
      // Determine status and approval requirements based on category
      // Cash Advance requires approval, others are auto-approved
      const isCashAdvance = categoryName === 'Cash Advance';
      const requiresApproval = isCashAdvance;
      const expenseStatus = isCashAdvance ? 'pending_approval' : 'approved';
      
      // If approved, set reviewed_by and reviewed_at immediately
      const reviewedBy = !isCashAdvance ? currentUser.id : null;
      const reviewedAt = !isCashAdvance ? new Date().toISOString() : null;
      
      // Create expense record with new schema compatible with Expenses.tsx
      const expenseData: any = {
        date: expenseDate,
        description: finalDescription,
        amount: parseFloat(expenseAmount),
        category_id: categoryId,
        branch_id: branchId !== 'default-branch' ? branchId : null,
        receipt_url: receiptUrl,
        payment_method: null, // Can be set if needed
        reference: `POS-${Date.now()}`, // Reference number for tracking
        status: expenseStatus,
        created_by: currentUser.id,
        requires_approval: requiresApproval,
        reviewed_by: reviewedBy,
        reviewed_at: reviewedAt,
        source: 'POS' // Mark expense as coming from POS/CashierScreen
      };
      
      // Add receipt_file_name if available (if schema supports it)
      if (receiptFileName) {
        expenseData.receipt_file_name = receiptFileName;
      }
      
      const { error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating expense:', error);
        throw error;
      }
      
      alert('Expense submitted successfully!');
      
      // Reset form
      setExpenseType('');
      setExpenseOther('');
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseImage(null);
      setExpenseImagePreview(null);
      setSelectedEmployeeId('');
      setBranchName('');
      setShowExpenseModal(false);
      
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert(`Failed to submit expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleCloseExpenseModal = () => {
    if (!isSubmittingExpense) {
      setShowExpenseModal(false);
      // Reset form
      setExpenseType('');
      setExpenseOther('');
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseImage(null);
      setExpenseImagePreview(null);
      setSelectedEmployeeId('');
      setBranchName('');
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
                ₱{(currentPrice || 0).toFixed(2)}
              </div>
              {selectedUnit && (
                <div className="text-xs text-gray-500">
                  per {selectedUnit.unit_label}
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
      <div className="product-card cursor-pointer">
        <div className="w-full h-24 md:h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-2 md:mb-3 overflow-hidden">
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
            <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="p-2 md:p-3">
          <div className="flex items-start justify-between mb-1 md:mb-2 gap-1">
            <h3 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight flex-1 min-w-0 line-clamp-2">
              {product.name}
            </h3>
            {isLowStock && (
              <span className="low-stock-badge text-xs px-1.5 py-0.5 flex-shrink-0">
                {isOutOfStock ? 'Out' : 'Low'}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-1 md:mb-2 truncate">
            SKU: {product.sku}
          </div>
          
          <div className="mb-2 md:mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Stock</span>
              <span className="font-medium">{stockQuantity}</span>
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
            <div className="mb-2 md:mb-3">
              <div className="text-xs text-gray-600 mb-1 md:mb-2">Unit:</div>
              <div className="flex flex-wrap gap-1">
                {availableUnits.slice(0, 3).map((unit: any) => (
                  <button
                    key={unit.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectUnit(product.id, unit.id);
                    }}
                    className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs rounded-md transition-colors touch-button ${
                      selectedUnit?.id === unit.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                    }`}
                    title={`${unit.unit_name} - ₱${unit.price.toFixed(2)}`}
                  >
                    {unit.unit_label || unit.label}
                  </button>
                ))}
                {availableUnits.length > 3 && (
                  <span className="text-xs text-gray-500 px-1">+{availableUnits.length - 3}</span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-2 md:mb-3">
            <div>
              <span className="text-base md:text-lg font-bold text-emerald-600">
                ₱{(currentPrice || 0).toFixed(2)}
              </span>
              {selectedUnit && (
                <div className="text-xs text-gray-500">
                  per {selectedUnit.unit_label}
                </div>
              )}
            </div>
            {!isOutOfStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="touch-button bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors w-full md:w-auto"
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
    <div className="pos-system h-screen flex flex-col overflow-hidden">
      <div className="bg-white shadow-lg p-3 md:p-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-3 md:space-x-4 md:gap-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 md:w-6 md:h-6" />
            <input
              type="text"
              placeholder="Search products, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 text-base md:text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent search-input-mobile"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.length > 3) {
                  handleBarcodeScan(searchQuery);
                }
              }}
            />
          </div>
          
          <div className="flex space-x-2 md:space-x-2">
            {/* View Toggle Buttons - Hidden on mobile */}
            {!isMobile && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors touch-button ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors touch-button ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Add Expense Button */}
            <TouchButton
              onClick={() => setShowExpenseModal(true)}
              variant="outline"
              icon={DollarSign}
              className="px-4 md:px-6 text-sm md:text-base"
              size={isMobile ? "md" : "lg"}
            >
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Expense</span>
            </TouchButton>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 p-3 md:p-4 overflow-y-auto min-h-0 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-base md:text-lg font-semibold">No products found</p>
              <p className="text-gray-400 text-sm md:text-base mt-2">Try adjusting your search or check your database connection</p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 product-grid-mobile product-grid-tablet">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode="list" />
                ))}
              </div>
            )
          )}
        </div>

        {!isMobile && (
        <div className="w-full md:w-80 lg:w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Cart Header - Fixed */}
          <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                <span>Cart ({cart.length})</span>
              </h2>
              <button
                onClick={() => setCart([])}
                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 active:bg-red-100 touch-button"
                aria-label="Clear cart"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Customer Section - Fixed */}
          <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs md:text-sm font-medium text-gray-700 flex-shrink-0">Customer:</span>
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
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 md:px-3 py-2 rounded-lg hover:bg-emerald-100 active:bg-emerald-200 transition-colors touch-button text-xs md:text-sm flex-1 min-w-0"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Add Customer'}</span>
              </button>
            </div>
            {selectedCustomer && (
              <div className="mt-2 text-xs text-gray-500">
                Points: {selectedCustomer.loyalty_points}
              </div>
            )}
          </div>

          {/* Cart Items - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 min-h-0 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-sm md:text-base">Cart is empty</p>
                <p className="text-xs md:text-sm">Add products to get started</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="product-card p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-xs md:text-sm flex-1 min-w-0 pr-2">{item.product.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 md:p-2 rounded hover:bg-red-50 active:bg-red-100 touch-button flex-shrink-0"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <div className="text-xs md:text-sm text-gray-600">
                      {(() => {
                        if (item.isBaseUnit) {
                          return `₱${item.unitPrice.toFixed(2)} per ${item.selectedUnit?.unit_label || 'unit'}`;
                        } else {
                          return `₱${item.unitPrice.toFixed(2)} per 1kg`;
                        }
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input
                        type="number"
                        min={item.selectedUnit?.is_base_unit ? 1 : item.selectedUnit?.min_sellable_quantity ?? 0.01}
                        step={item.selectedUnit?.is_base_unit ? 1 : item.selectedUnit?.min_sellable_quantity ?? 0.01}
                        value={item.quantity}
                        onChange={(e) => {
                          let newQuantity = parseFloat(e.target.value) || 0;
                          updateQuantity(item.id, newQuantity);
                        }}
                        className="w-20 md:w-16 px-2 py-1.5 md:py-1 text-xs md:text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />

                      <span className="text-xs text-gray-500">
                        {item.isBaseUnit ? (item.selectedUnit?.unit_label || 'unit') : 'kg'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-semibold text-emerald-600 text-sm md:text-base">
                      ₱{item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Section - Completely Static at Bottom */}
          {cart.length > 0 && (
            <div className="p-3 md:p-4 border-t border-gray-200 space-y-3 bg-white shadow-lg flex-shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between text-lg md:text-xl font-bold text-emerald-600">
                  <span>Total:</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <TouchButton
                onClick={() => setShowPaymentModal(true)}
                variant="success"
                size={isMobile ? "lg" : "xl"}
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
                        ₱{item.unitPrice.toFixed(2)} per {item.selectedUnit?.unit_label || 'unit'}
                      </div>
                      <div className="quantity-control">
                        <button
                          onClick={() => {
                            const minQty = parseFloat((item.selectedUnit as any)?.min_sellable_quantity || '0.01');
                            updateQuantity(item.id, Math.max(minQty, item.quantity - minQty));
                          }}
                          className="quantity-btn"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="quantity-display">
                          {item.quantity} {item.selectedUnit?.unit_label || 'unit'}
                        </span>
                        <button
                          onClick={() => {
                            const minQty = parseFloat((item.selectedUnit as any)?.min_sellable_quantity || '0.01');
                            updateQuantity(item.id, item.quantity + minQty);
                          }}
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={handleCloseExpenseModal}
        title="Add Expense"
        size="lg"
      >
        <div className="space-y-6">
          {/* Expense Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Type <span className="text-red-500">*</span>
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
              disabled={isSubmittingExpense}
            >
              <option value="">Select expense type</option>
              <option value="Cash Advance">Cash Advance</option>
              <option value="Delivery Payment">Delivery Payment</option>
              <option value="Utilities">Utilities</option>
              <option value="Supplies">Supplies</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Other Expense Type Field */}
          {expenseType === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specify Expense Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={expenseOther}
                onChange={(e) => setExpenseOther(e.target.value)}
                placeholder="Enter expense type"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                disabled={isSubmittingExpense}
              />
            </div>
          )}

          {/* Employee Selection for Cash Advance */}
          {expenseType === 'Cash Advance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee <span className="text-red-500">*</span>
              </label>
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : (
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  disabled={isSubmittingExpense}
                >
                  <option value="">Select employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.position} ({employee.employee_id})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
              disabled={isSubmittingExpense}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder="Enter expense description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg resize-none"
              disabled={isSubmittingExpense}
            />
          </div>

          {/* Image Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt/Image
            </label>
            <div className="space-y-3">
              <input
                ref={expenseImageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleExpenseImageChange}
                className="hidden"
                disabled={isSubmittingExpense}
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    // Create a new input for camera capture
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    // Set capture attribute for camera access (mobile)
                    (input as any).capture = 'environment'; // Use rear camera
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleExpenseImageChange({ target: { files: [file] } } as any);
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingExpense}
                >
                  <Camera className="w-5 h-5" />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleExpenseImageChange({ target: { files: [file] } } as any);
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingExpense}
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </button>
              </div>
              
              {expenseImagePreview && (
                <div className="mt-3 relative">
                  <img
                    src={expenseImagePreview}
                    alt="Expense receipt preview"
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseImage(null);
                      setExpenseImagePreview(null);
                      if (expenseImageInputRef.current) {
                        expenseImageInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={isSubmittingExpense}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Auto-filled Branch and User Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Information</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Branch:</span>
                <span className="font-medium">{branchName || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span>Recorded By:</span>
                <span className="font-medium">{(() => {
                  const currentUser = customAuth.getCurrentUser();
                  return currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email : 'N/A';
                })()}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <TouchButton
              onClick={handleCloseExpenseModal}
              variant="outline"
              className="flex-1"
              disabled={isSubmittingExpense}
            >
              Cancel
            </TouchButton>
            <TouchButton
              onClick={handleSubmitExpense}
              variant="success"
              className="flex-1"
              disabled={isSubmittingExpense}
            >
              {isSubmittingExpense ? 'Submitting...' : 'Submit Expense'}
            </TouchButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CashierScreen