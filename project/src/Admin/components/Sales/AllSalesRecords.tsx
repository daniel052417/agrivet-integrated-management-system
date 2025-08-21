import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Download, Eye, Edit, Calendar, User, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type TransactionRow = {
  id: string;
  transaction_number: string;
  customer_id: string | null;
  staff_id: string | null;
  branch_id: string | null;
  transaction_date: string;
  total_amount: number;
  payment_method: string | null;
  payment_status: string | null;
};

type ItemRow = {
  id: string;
  transaction_id: string;
  quantity: number;
};

type CustomerRow = { id: string; first_name: string | null; last_name: string | null };
type StaffRow = { id: string; first_name: string | null; last_name: string | null };
type BranchRow = { id: string; name: string };

type SalesRecord = {
  id: string;
  date: string;
  time: string;
  customer: string;
  items: number;
  total: number;
  payment: string;
  staff: string;
  status: string;
  branch: string;
};

const AllSalesRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this-month');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SalesRecord[]>([]);

  function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getRangeFromDateFilter(filter: string): { start?: Date; end?: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'this-week': {
        const day = now.getDay();
        const diffToMonday = (day === 0 ? 6 : day - 1);
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'last-month': {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      case 'this-month':
      default: {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
    }
  }

  function formatDateISO(dateString: string): string {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA');
  }

  function formatTimeHM(dateString: string): string {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { start, end } = getRangeFromDateFilter(dateRange);

        let txQuery = supabase
          .from('sales_transactions')
          .select('id, transaction_number, customer_id, staff_id, branch_id, transaction_date, total_amount, payment_method, payment_status')
          .order('transaction_date', { ascending: false })
          .limit(200);

        if (start) txQuery = txQuery.gte('transaction_date', start.toISOString());
        if (end) txQuery = txQuery.lte('transaction_date', end.toISOString());

        const { data: txRows, error: txErr } = await txQuery as any;
        if (txErr) throw txErr;

        const transactions = (txRows as TransactionRow[] | null) || [];
        const transactionIds = Array.from(new Set(transactions.map(t => t.id)));
        const customerIds = Array.from(new Set(transactions.map(t => t.customer_id).filter(Boolean))) as string[];
        const staffIds = Array.from(new Set(transactions.map(t => t.staff_id).filter(Boolean))) as string[];
        const branchIds = Array.from(new Set(transactions.map(t => t.branch_id).filter(Boolean))) as string[];

        const [itemsRes, customersRes, staffRes, branchesRes] = await Promise.all([
          transactionIds.length ? supabase
            .from('transaction_items')
            .select('id, transaction_id, quantity')
            .in('transaction_id', transactionIds) : Promise.resolve({ data: [] as ItemRow[], error: null }),
          customerIds.length ? supabase
            .from('customers')
            .select('id, first_name, last_name')
            .in('id', customerIds) : Promise.resolve({ data: [] as CustomerRow[], error: null }),
          staffIds.length ? supabase
            .from('staff')
            .select('id, first_name, last_name')
            .in('id', staffIds) : Promise.resolve({ data: [] as StaffRow[], error: null }),
          branchIds.length ? supabase
            .from('branches')
            .select('id, name')
            .in('id', branchIds) : Promise.resolve({ data: [] as BranchRow[], error: null }),
        ]);

        if ((itemsRes as any).error) throw (itemsRes as any).error;
        if ((customersRes as any).error) throw (customersRes as any).error;
        if ((staffRes as any).error) throw (staffRes as any).error;
        if ((branchesRes as any).error) throw (branchesRes as any).error;

        const itemCountByTx = new Map<string, number>();
        ((itemsRes as any).data as ItemRow[]).forEach(i => {
          const prev = itemCountByTx.get(i.transaction_id) || 0;
          itemCountByTx.set(i.transaction_id, prev + Number(i.quantity || 0));
        });

        const customerNameById = new Map<string, string>();
        ((customersRes as any).data as CustomerRow[]).forEach(c => {
          const name = `${c.first_name || ''} ${c.last_name || ''}`.trim();
          customerNameById.set(c.id, name || '—');
        });

        const staffNameById = new Map<string, string>();
        ((staffRes as any).data as StaffRow[]).forEach(s => {
          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();
          staffNameById.set(s.id, name || '—');
        });

        const branchNameById = new Map<string, string>();
        ((branchesRes as any).data as BranchRow[]).forEach(b => branchNameById.set(b.id, b.name));

        const built: SalesRecord[] = transactions.map(t => ({
          id: t.transaction_number || t.id,
          date: formatDateISO(t.transaction_date),
          time: formatTimeHM(t.transaction_date),
          customer: t.customer_id ? (customerNameById.get(t.customer_id) || 'Customer') : 'Walk-in',
          items: itemCountByTx.get(t.id) || 0,
          total: Number(t.total_amount || 0),
          payment: t.payment_method || '—',
          staff: t.staff_id ? (staffNameById.get(t.staff_id) || 'Staff') : '—',
          status: (t.payment_status || 'Completed').replace(/\b\w/g, c => c.toUpperCase()),
          branch: t.branch_id ? (branchNameById.get(t.branch_id) || '—') : '—',
        }));

        setRecords(built);
      } catch (e: any) {
        console.error('Failed to load sales records', e);
        setError('Failed to load sales records');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return records.filter(r => {
      if (selectedFilter !== 'all') {
        const statusKey = selectedFilter === 'completed' ? 'Completed' : selectedFilter === 'pending' ? 'Pending' : selectedFilter === 'cancelled' ? 'Cancelled' : '';
        if (statusKey && r.status !== statusKey) return false;
      }
      if (!term) return true;
      return (
        r.id.toLowerCase().includes(term) ||
        r.customer.toLowerCase().includes(term) ||
        r.staff.toLowerCase().includes(term) ||
        r.branch.toLowerCase().includes(term)
      );
    });
  }, [records, searchTerm, selectedFilter]);

  const totals = useMemo(() => {
    const totalTransactions = records.length;
    const totalRevenue = records.reduce((s, r) => s + r.total, 0);
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const todaysSales = records.filter(r => {
      const d = new Date(`${r.date}T${r.time}`);
      return d.getTime() >= startOfToday().getTime();
    }).reduce((s, r) => s + r.total, 0);
    return { totalTransactions, totalRevenue, averageTransaction, todaysSales };
  }, [records]);

  const summaryStats = [
    { label: 'Total Transactions', value: totals.totalTransactions.toLocaleString(), change: '', color: 'text-blue-600' },
    { label: 'Total Revenue', value: `₱${totals.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` , change: '', color: 'text-green-600' },
    { label: 'Average Transaction', value: `₱${Math.round(totals.averageTransaction).toLocaleString()}`, change: '', color: 'text-purple-600' },
    { label: 'Today\'s Sales', value: `₱${Math.round(totals.todaysSales).toLocaleString()}`, change: '', color: 'text-orange-600' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment: string) => {
    switch (payment) {
      case 'Cash': return 'bg-blue-100 text-blue-800';
      case 'Credit Card': return 'bg-purple-100 text-purple-800';
      case 'Bank Transfer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Sales Records</h2>
          <p className="text-gray-600 mt-1">Complete transaction history and sales data</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${stat.color}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </button>
        </div>
      </div>

      {/* Sales Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
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
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.id}</div>
                      <div className="text-sm text-gray-500">{record.branch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.date}</div>
                      <div className="text-sm text-gray-500">{record.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{record.customer}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Package className="w-4 h-4 mr-1 text-gray-400" />
                        {record.items}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₱{record.total.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(record.payment)}`}>
                        {record.payment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.staff}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={9}>No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredRecords.length}</span> of{' '}
            <span className="font-medium">{filteredRecords.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllSalesRecords;