import React, { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Edit, Calendar, User, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../POS/components/shared/Modal';

type TransactionRow = {
  id: string;
  transaction_number: string;
  customer_id: string | null;
  cashier_id: string;
  branch_id: string | null;
  transaction_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  status: string | null;
  created_at: string;
  updated_at: string;
  transaction_source?: string | null;
  order_id?: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  branch_id: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  order_type: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_method: string | null;
  delivery_status: string | null;
  confirmed_by: string | null;
  completed_by: string | null;
};

type ItemRow = { 
  id: string; 
  transaction_id: string; 
  product_id: string; 
  product_name: string;
  product_sku: string;
  quantity: number; 
  unit_price: number; 
  line_total: number;
  unit_of_measure: string;
};

type CustomerRow = { 
  id: string; 
  customer_number: string;
  first_name: string; 
  last_name: string; 
  email: string | null;
  phone: string | null;
  customer_type: string;
};

type StaffRow = { 
  id: string; 
  first_name: string; 
  last_name: string; 
  employee_id: string | null;
  department: string | null;
  position: string | null;
};

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
};

type BranchRow = { 
  id: string; 
  name: string; 
  code: string;
  city: string;
  province: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string | null;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  unit_name: string | null;
  unit_label: string | null;
};

type SalesRecord = {
  id: string;
  date: string;
  time: string;
  originalDate: string; // ISO string for filtering
  transactionNumber: string;
  customer: string;
  staff: string;
  branch: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  itemCount: number;
  status: string;
  customerType: string;
  staffDepartment: string;
  source: 'pos' | 'online' | 'pwa' | 'delivery' | 'unknown';
  recordType: 'transaction' | 'order';
  orderId?: string | null;
  orderType?: string | null; // 'pickup' or 'delivery' for orders
};

const AllSalesRecords: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<SalesRecord | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<{
    transaction: TransactionRow | null;
    order: OrderRow | null;
    items: ItemRow[];
    orderItems: OrderItemRow[];
    customer: CustomerRow | null;
    cashier: UserRow | null;
    branch: BranchRow | null;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load transactions with all relevant fields including source
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('pos_transactions')
        .select(`
          id,
          transaction_number,
          customer_id,
          cashier_id,
          branch_id,
          transaction_date,
          subtotal,
          tax_amount,
          total_amount,
          payment_status,
          status,
          created_at,
          updated_at,
          transaction_source,
          order_id
        `)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Load online orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          branch_id,
          status,
          subtotal,
          tax_amount,
          total_amount,
          payment_status,
          payment_method,
          order_type,
          created_at,
          updated_at,
          customer_name,
          customer_email,
          customer_phone,
          delivery_method,
          delivery_status,
          confirmed_by,
          completed_by
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Load order items
      const orderIds = ordersData?.map(o => o.id) || [];
      let orderItemsData: OrderItemRow[] = [];
      if (orderIds.length > 0) {
        const { data: orderItemsResult, error: orderItemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            product_id,
            product_name,
            product_sku,
            quantity,
            unit_price,
            line_total,
            unit_name,
            unit_label
          `)
          .in('order_id', orderIds);
        
        if (orderItemsError) throw orderItemsError;
        orderItemsData = orderItemsResult || [];
      }

      // Load transaction items (using 'pos_transaction_items' table)
      const { data: itemsData, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select(`
          id,
          transaction_id,
          product_id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          line_total,
          unit_of_measure
        `);

      if (itemsError) throw itemsError;

      // Load customers with additional fields
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          customer_number,
          first_name,
          last_name,
          email,
          phone,
          customer_type
        `)
        .eq('is_active', true);

      if (customersError) throw customersError;

      // Load staff with additional fields
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          employee_id,
          department,
          position,
          email
        `)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load users (for cashier lookup - cashier_id references users table)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role
        `)
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Load branches with additional fields
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          code,
          city,
          province
        `)
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      setTransactions(transactionsData || []);
      setOrders(ordersData || []);
      setItems(itemsData || []);
      setOrderItems(orderItemsData);
      setCustomers(customersData || []);
      setStaff(staffData || []);
      setUsers(usersData || []);
      setBranches(branchesData || []);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const salesRecords = useMemo(() => {
    const records: SalesRecord[] = [];

    // Process POS transactions
    transactions.forEach(transaction => {
      const customer = customers.find(c => c.id === transaction.customer_id);
      const cashier = users.find(u => u.id === transaction.cashier_id);
      const branch = branches.find(b => b.id === transaction.branch_id);
      const transactionItems = items.filter(item => item.transaction_id === transaction.id);
      const transactionDate = new Date(transaction.transaction_date);
      
      // Determine source: if order_id exists, it's from an online order
      const source = transaction.transaction_source || (transaction.order_id ? 'online' : 'pos');
      
      records.push({
        id: transaction.id,
        date: transactionDate.toLocaleDateString(),
        time: transactionDate.toLocaleTimeString(),
        originalDate: transaction.transaction_date,
        transactionNumber: transaction.transaction_number,
        customer: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Walk-in Customer',
        staff: cashier ? `${cashier.first_name || ''} ${cashier.last_name || ''}`.trim() : 'Unknown',
        branch: branch?.name || 'Unknown Branch',
        subtotal: transaction.subtotal || 0,
        taxAmount: transaction.tax_amount || 0,
        totalAmount: transaction.total_amount || 0,
        paymentStatus: transaction.payment_status || 'Unknown',
        itemCount: transactionItems.length,
        status: transaction.status || transaction.payment_status || 'Unknown',
        customerType: customer?.customer_type || 'Unknown',
        staffDepartment: cashier?.role || 'Unknown',
        source: source as 'pos' | 'online' | 'pwa' | 'delivery' | 'unknown',
        recordType: 'transaction',
        orderId: transaction.order_id || null
      });
    });

    // Process online orders (only those NOT converted to transactions yet)
    orders.forEach(order => {
      // Check if this order already has a transaction
      const hasTransaction = transactions.some(t => t.order_id === order.id);
      if (hasTransaction) return; // Skip if already converted to transaction

      const customer = customers.find(c => c.id === order.customer_id);
      const branch = branches.find(b => b.id === order.branch_id);
      const orderItemsForOrder = orderItems.filter(item => item.order_id === order.id);
      const orderDate = new Date(order.created_at);
      
      // Get staff who confirmed/completed
      const confirmedBy = order.confirmed_by ? users.find(u => u.id === order.confirmed_by) : null;
      const completedBy = order.completed_by ? users.find(u => u.id === order.completed_by) : null;
      const staffName = completedBy 
        ? `${completedBy.first_name || ''} ${completedBy.last_name || ''}`.trim()
        : confirmedBy 
        ? `${confirmedBy.first_name || ''} ${confirmedBy.last_name || ''}`.trim()
        : 'System';

      // Determine source based on order type and delivery method
      let source: 'pos' | 'online' | 'pwa' | 'delivery' | 'unknown' = 'online';
      if (order.order_type === 'delivery') {
        source = 'delivery';
      } else if (order.delivery_method === 'pwa') {
        source = 'pwa';
      }

      records.push({
        id: order.id,
        date: orderDate.toLocaleDateString(),
        time: orderDate.toLocaleTimeString(),
        originalDate: order.created_at,
        transactionNumber: order.order_number,
        customer: order.customer_name 
          ? order.customer_name 
          : customer 
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() 
          : 'Walk-in Customer',
        staff: staffName,
        branch: branch?.name || 'Unknown Branch',
        subtotal: order.subtotal || 0,
        taxAmount: order.tax_amount || 0,
        totalAmount: order.total_amount || 0,
        paymentStatus: order.payment_status || 'Unknown',
        itemCount: orderItemsForOrder.length,
        status: order.status || order.payment_status || 'Unknown',
        customerType: customer?.customer_type || 'Regular',
        staffDepartment: completedBy?.role || confirmedBy?.role || 'System',
        source,
        recordType: 'order',
        orderId: order.id,
        orderType: order.order_type || null
      });
    });

    // Sort by date (newest first)
    return records.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions, orders, customers, users, branches, items, orderItems]);

  // Get unique cashiers with their branch assignments
  const cashierOptions = useMemo(() => {
    const cashierMap = new Map<string, { name: string; branch: string; id: string }>();
    
    transactions.forEach(transaction => {
      const cashier = users.find(u => u.id === transaction.cashier_id);
      const branch = branches.find(b => b.id === transaction.branch_id);
      
      if (cashier && transaction.cashier_id) {
        const cashierName = `${cashier.first_name} ${cashier.last_name}`.trim();
        const branchName = branch?.name || 'Unknown Branch';
        const key = transaction.cashier_id;
        
        if (!cashierMap.has(key)) {
          cashierMap.set(key, {
            id: transaction.cashier_id,
            name: cashierName,
            branch: branchName
          });
        }
      }
    });
    
    return Array.from(cashierMap.values()).sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.branch.localeCompare(b.branch);
    });
  }, [transactions, users, branches]);

  const filteredRecords = useMemo(() => {
    return salesRecords.filter(record => {
      const matchesSearch = record.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.branch.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter: check paymentStatus for transactions, check status for orders
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        // For orders, check the order status field (which has pending_confirmation, confirmed, etc.)
        if (record.recordType === 'order') {
          return record.status === statusFilter || record.paymentStatus === statusFilter;
        }
        // For transactions, check payment_status
        return record.paymentStatus === statusFilter;
      })();
      
      // Source filter: all, walk-in (pos), pickup (online orders with pickup), delivery
      const matchesSource = (() => {
        if (sourceFilter === 'all') return true;
        if (sourceFilter === 'walk-in') return record.source === 'pos';
        if (sourceFilter === 'pickup') return record.recordType === 'order' && record.orderType === 'pickup';
        if (sourceFilter === 'delivery') return record.orderType === 'delivery' || record.source === 'delivery';
        return record.source === sourceFilter;
      })();
      
      const matchesCashier = cashierFilter === 'all' || 
        (() => {
          const transaction = transactions.find(t => t.id === record.id && record.recordType === 'transaction');
          return transaction && transaction.cashier_id === cashierFilter;
        })();
      
      // Date range filtering
      const matchesDateRange = (() => {
        if (!dateRange.start && !dateRange.end) return true;
        
        try {
          const recordDate = new Date(record.originalDate);
          if (isNaN(recordDate.getTime())) return true; // Skip invalid dates
          
          const recordDateStr = recordDate.toISOString().split('T')[0];
          
          const startMatch = !dateRange.start || recordDateStr >= dateRange.start;
          const endMatch = !dateRange.end || recordDateStr <= dateRange.end;
          
          return startMatch && endMatch;
        } catch (e) {
          console.warn('Invalid date for record:', record.id, record.originalDate);
          return true; // Include record if date parsing fails
        }
      })();
      
      return matchesSearch && matchesStatus && matchesSource && matchesCashier && matchesDateRange;
    });
  }, [salesRecords, searchTerm, statusFilter, sourceFilter, cashierFilter, dateRange, transactions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_confirmation':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'wholesale':
        return 'bg-blue-100 text-blue-800';
      case 'regular':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'pos':
        return 'bg-blue-100 text-blue-800';
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'pwa':
        return 'bg-purple-100 text-purple-800';
      case 'delivery':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: string, orderType?: string | null) => {
    switch (source) {
      case 'pos':
        return 'Walk-in';
      case 'online':
        // For online orders, show with order type
        if (orderType === 'pickup') {
          return 'Online - pick-up';
        } else if (orderType === 'delivery') {
          return 'Online - delivery';
        }
        return 'Online';
      case 'pwa':
        return 'PWA';
      case 'delivery':
        return 'Online - delivery';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const handleViewDetails = async (record: SalesRecord) => {
    try {
      setLoadingDetails(true);
      setSelectedTransaction(record);
      
      if (record.recordType === 'transaction') {
        // Find the transaction
        const transaction = transactions.find(t => t.id === record.id);
        if (!transaction) {
          setError('Transaction not found');
          return;
        }

        // Get transaction items with product details
        const transactionItems = items.filter(item => item.transaction_id === transaction.id);
        
        // Get related data
        const customer = customers.find(c => c.id === transaction.customer_id);
        const cashier = users.find(u => u.id === transaction.cashier_id);
        const branch = branches.find(b => b.id === transaction.branch_id);

        setTransactionDetails({
          transaction,
          order: null,
          items: transactionItems,
          orderItems: [],
          customer: customer || null,
          cashier: cashier || null,
          branch: branch || null
        });
      } else {
        // Find the order
        const order = orders.find(o => o.id === record.id);
        if (!order) {
          setError('Order not found');
          return;
        }

        // Get order items
        const itemsForOrder = orderItems.filter(item => item.order_id === order.id);
        
        // Get related data
        const customer = customers.find(c => c.id === order.customer_id);
        const branch = branches.find(b => b.id === order.branch_id);
        const confirmedBy = order.confirmed_by ? users.find(u => u.id === order.confirmed_by) : null;
        const completedBy = order.completed_by ? users.find(u => u.id === order.completed_by) : null;

        setTransactionDetails({
          transaction: null,
          order,
          items: [],
          orderItems: itemsForOrder,
          customer: customer || null,
          cashier: completedBy || confirmedBy || null,
          branch: branch || null
        });
      }

      setShowDetailsModal(true);
    } catch (err: any) {
      console.error('Error loading transaction details:', err);
      setError(err.message || 'Failed to load transaction details');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Sales Records</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadSalesData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Sales Records</h1>
          <p className="text-gray-600">View and manage all sales transactions</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRecords.filter(r => {
                    const paymentStatus = (r.paymentStatus || '').toLowerCase().trim();
                    // Count records where paymentStatus is NOT 'confirmed'
                    return paymentStatus !== 'confirmed';
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredRecords.length > 0 ? filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0) / filteredRecords.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="walk-in">Walk-in (POS)</option>
                <option value="pickup">Pick up</option>
                <option value="delivery">Delivery</option>
              </select>

              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="all">All Cashiers</option>
                {cashierOptions.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name} - {cashier.branch}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End Date"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction/Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.transactionNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.date} {record.time}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {record.recordType === 'order' ? 'Order' : 'Transaction'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(record.source)}`}>
                        {getSourceLabel(record.source, record.orderType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{record.customer}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(record.customerType)}`}>
                          {record.customerType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{record.staff}</div>
                        <div className="text-xs text-gray-500">{record.staffDepartment}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(record.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.itemCount} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Subtotal: {formatCurrency(record.subtotal)}</div>
                        <div>Tax: {formatCurrency(record.taxAmount)}</div>
                        <div className="font-medium">Total: {formatCurrency(record.totalAmount)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.recordType === 'order' ? record.status : record.paymentStatus)}`}>
                        {record.recordType === 'order' ? record.status : record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewDetails(record)}
                          className="text-blue-600 hover:text-blue-900 transition-colors" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Records Found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end
                ? 'No records match your filter criteria.'
                : 'No sales transactions have been recorded yet.'
              }
            </p>
          </div>
        )}

        {/* Transaction Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
            setTransactionDetails(null);
          }}
          title={selectedTransaction ? `Transaction Details - ${selectedTransaction.transactionNumber}` : 'Transaction Details'}
          size="lg"
        >
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transactionDetails ? (
            <div className="space-y-6">
              {/* Transaction/Order Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {transactionDetails.transaction ? 'Transaction Information' : 'Order Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {transactionDetails.transaction ? 'Transaction Number' : 'Order Number'}
                    </p>
                    <p className="font-medium">
                      {transactionDetails.transaction?.transaction_number || transactionDetails.order?.order_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {transactionDetails.transaction 
                        ? new Date(transactionDetails.transaction.transaction_date).toLocaleString('en-PH')
                        : transactionDetails.order
                        ? new Date(transactionDetails.order.created_at).toLocaleString('en-PH')
                        : 'N/A'}
                    </p>
                  </div>
                  {transactionDetails.transaction && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(transactionDetails.transaction.transaction_source || 'pos')}`}>
                          {getSourceLabel(transactionDetails.transaction.transaction_source || 'pos')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Transaction Status</p>
                        <p className="font-medium">{transactionDetails.transaction?.status || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {transactionDetails.order && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Order Type</p>
                        <p className="font-medium capitalize">{transactionDetails.order.order_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Delivery Method</p>
                        <p className="font-medium capitalize">{transactionDetails.order.delivery_method || 'N/A'}</p>
                      </div>
                      {transactionDetails.order.delivery_status && (
                        <div>
                          <p className="text-sm text-gray-600">Delivery Status</p>
                          <p className="font-medium capitalize">{transactionDetails.order.delivery_status}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transactionDetails.transaction?.payment_status || transactionDetails.order?.payment_status || 'Unknown')}`}>
                      {transactionDetails.transaction?.payment_status || transactionDetails.order?.payment_status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">
                      {transactionDetails.order?.customer_name 
                        ? transactionDetails.order.customer_name
                        : transactionDetails.customer 
                        ? `${transactionDetails.customer.first_name} ${transactionDetails.customer.last_name}`.trim()
                        : transactionDetails.transaction ? 'Walk-in Customer' : 'Walk-in Customer'}
                    </p>
                  </div>
                  {(transactionDetails.customer || transactionDetails.order) && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Customer Type</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(transactionDetails.customer?.customer_type || 'Regular')}`}>
                          {transactionDetails.customer?.customer_type || 'Regular'}
                        </span>
                      </div>
                      {(transactionDetails.order?.customer_email || transactionDetails.customer?.email) && (
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{transactionDetails.order?.customer_email || transactionDetails.customer?.email}</p>
                        </div>
                      )}
                      {(transactionDetails.order?.customer_phone || transactionDetails.customer?.phone) && (
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{transactionDetails.order?.customer_phone || transactionDetails.customer?.phone}</p>
                        </div>
                      )}
                      {transactionDetails.order?.delivery_address && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Delivery Address</p>
                          <p className="font-medium">{transactionDetails.order.delivery_address}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Cashier Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cashier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cashier Name</p>
                    <p className="font-medium">
                      {transactionDetails.cashier 
                        ? `${transactionDetails.cashier.first_name} ${transactionDetails.cashier.last_name}`.trim()
                        : 'Unknown'}
                    </p>
                  </div>
                  {transactionDetails.cashier && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-medium">{transactionDetails.cashier.role || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{transactionDetails.cashier.email}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Branch Information */}
              {transactionDetails.branch && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Branch Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Branch Name</p>
                      <p className="font-medium">{transactionDetails.branch.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{transactionDetails.branch.city}, {transactionDetails.branch.province}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction/Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {transactionDetails.transaction ? 'Transaction Items' : 'Order Items'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionDetails.items.length > 0 ? (
                        transactionDetails.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.product_sku}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity} {item.unit_of_measure || 'pcs'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.line_total)}
                            </td>
                          </tr>
                        ))
                      ) : transactionDetails.orderItems.length > 0 ? (
                        transactionDetails.orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.product_name || 'Unknown Product'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.product_sku || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity} {item.unit_label || item.unit_name || 'pcs'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.line_total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction/Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {transactionDetails.transaction ? 'Transaction Summary' : 'Order Summary'}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(transactionDetails.transaction?.subtotal || transactionDetails.order?.subtotal || 0)}
                    </span>
                  </div>
                  {transactionDetails.order?.delivery_fee && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivery Fee</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(transactionDetails.order.delivery_fee)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(transactionDetails.transaction?.tax_amount || transactionDetails.order?.tax_amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-base font-semibold text-gray-900">Total Amount</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(transactionDetails.transaction?.total_amount || transactionDetails.order?.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No transaction details available</p>
            </div>
          )}
        </Modal>
      </div>
  );
};

export default AllSalesRecords;

