import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Download, Eye, Edit, Calendar, User, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
};

type ItemRow = { 
  id: string; 
  transaction_id: string; 
  product_id: string; 
  quantity: number; 
  unit_price: number; 
  line_total: number; 
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

type BranchRow = { 
  id: string; 
  name: string; 
  code: string;
  city: string;
  province: string;
};

type SalesRecord = {
  id: string;
  date: string;
  time: string;
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
};

const AllSalesRecords: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load transactions with all relevant fields
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
          updated_at
        `)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Load transaction items (using 'pos_transaction_items' table)
      const { data: itemsData, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select(`
          id,
          transaction_id,
          product_id,
          quantity,
          unit_price,
          line_total
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
      setItems(itemsData || []);
      setCustomers(customersData || []);
      setStaff(staffData || []);
      setBranches(branchesData || []);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const salesRecords = useMemo(() => {
    return transactions.map(transaction => {
      const customer = customers.find(c => c.id === transaction.customer_id);
      const staffMember = staff.find(s => s.id === transaction.cashier_id);
      const branch = branches.find(b => b.id === transaction.branch_id);
      const transactionItems = items.filter(item => item.transaction_id === transaction.id);
      
      const transactionDate = new Date(transaction.transaction_date);
      
      return {
        id: transaction.id,
        date: transactionDate.toLocaleDateString(),
        time: transactionDate.toLocaleTimeString(),
        transactionNumber: transaction.transaction_number,
        customer: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Walk-in Customer',
        staff: staffMember ? `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim() : 'Unknown',
        branch: branch?.name || 'Unknown Branch',
        subtotal: transaction.subtotal || 0,
        taxAmount: transaction.tax_amount || 0,
        totalAmount: transaction.total_amount || 0,
        paymentStatus: transaction.payment_status || 'Unknown',
        itemCount: transactionItems.reduce((sum, item) => sum + item.quantity, 0),
        status: transaction.status || transaction.payment_status || 'Unknown',
        customerType: customer?.customer_type || 'Unknown',
        staffDepartment: staffMember?.department || 'Unknown'
      };
    });
  }, [transactions, customers, staff, branches, items]);

  const filteredRecords = useMemo(() => {
    return salesRecords.filter(record => {
      const matchesSearch = record.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.branch.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || record.paymentStatus === statusFilter;
      
      const matchesDateRange = (!dateRange.start || record.date >= dateRange.start) &&
                              (!dateRange.end || record.date <= dateRange.end);
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [salesRecords, searchTerm, statusFilter, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 2 
    }).format(amount);
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
                <p className="text-2xl font-bold text-gray-900">{salesRecords.length}</p>
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
                  {formatCurrency(salesRecords.reduce((sum, record) => sum + record.totalAmount, 0))}
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
                  {salesRecords.filter(r => r.paymentStatus === 'pending').length}
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
                  {formatCurrency(salesRecords.length > 0 ? salesRecords.reduce((sum, record) => sum + record.totalAmount, 0) / salesRecords.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
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
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
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
              
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
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
                    Transaction
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
                      </div>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.paymentStatus)}`}>
                        {record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900" title="Edit">
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
      </div>
  );
};

export default AllSalesRecords;

