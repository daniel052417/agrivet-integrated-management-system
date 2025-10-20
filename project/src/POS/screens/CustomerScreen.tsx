import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  Gift,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Filter,
  Download
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchase: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'vip';
  notes?: string;
  purchaseHistory: {
    id: string;
    date: string;
    amount: number;
    items: number;
  }[];
}

const CustomerScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Mock customers data
  const customers: Customer[] = [
    {
      id: '1',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@email.com',
      phone: '+63 912 345 6789',
      address: '123 Main St, Quezon City, Metro Manila',
      loyaltyPoints: 1250,
      totalSpent: 15750.00,
      lastPurchase: '2024-01-15',
      joinDate: '2023-06-15',
      status: 'vip',
      notes: 'Regular customer, prefers bulk orders',
      purchaseHistory: [
        { id: '1', date: '2024-01-15', amount: 2500.00, items: 3 },
        { id: '2', date: '2024-01-10', amount: 1800.00, items: 2 },
        { id: '3', date: '2024-01-05', amount: 3200.00, items: 5 }
      ]
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      phone: '+63 917 123 4567',
      address: '456 Oak Ave, Makati City, Metro Manila',
      loyaltyPoints: 680,
      totalSpent: 8450.00,
      lastPurchase: '2024-01-12',
      joinDate: '2023-08-20',
      status: 'active',
      purchaseHistory: [
        { id: '4', date: '2024-01-12', amount: 1200.00, items: 2 },
        { id: '5', date: '2024-01-08', amount: 950.00, items: 1 }
      ]
    },
    {
      id: '3',
      name: 'Pedro Rodriguez',
      email: 'pedro.rodriguez@email.com',
      phone: '+63 918 987 6543',
      address: '789 Pine St, Taguig City, Metro Manila',
      loyaltyPoints: 320,
      totalSpent: 4200.00,
      lastPurchase: '2024-01-08',
      joinDate: '2023-11-10',
      status: 'active',
      purchaseHistory: [
        { id: '6', date: '2024-01-08', amount: 800.00, items: 1 }
      ]
    },
    {
      id: '4',
      name: 'Ana Garcia',
      email: 'ana.garcia@email.com',
      phone: '+63 919 555 1234',
      address: '321 Elm St, Pasig City, Metro Manila',
      loyaltyPoints: 0,
      totalSpent: 0,
      lastPurchase: '',
      joinDate: '2024-01-01',
      status: 'inactive',
      purchaseHistory: []
    }
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery);
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const totalLoyaltyPoints = customers.reduce((total, customer) => total + customer.loyaltyPoints, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'text-purple-600 bg-purple-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { tier: 'Gold', color: 'text-yellow-600 bg-yellow-100' };
    if (points >= 500) return { tier: 'Silver', color: 'text-gray-600 bg-gray-100' };
    return { tier: 'Bronze', color: 'text-orange-600 bg-orange-100' };
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => console.log('Export customers')}
              variant="outline"
              icon={Download}
            >
              Export
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowAddCustomerModal(true)}
              variant="primary"
              icon={Plus}
            >
              Add Customer
            </TouchButton>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <Award className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-600">{vipCustomers}</p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-yellow-600">{totalLoyaltyPoints.toLocaleString()}</p>
              </div>
              <Gift className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Customers ({filteredCustomers.length})</h2>
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
            >
              Grid
            </TouchButton>
            <TouchButton
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
            >
              Table
            </TouchButton>
          </div>
        </div>

        {/* Customers Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCustomers.map(customer => {
              const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints);
              
              return (
                <div key={customer.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    {/* Customer Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                            {customer.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${loyaltyTier.color}`}>
                            {loyaltyTier.tier}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {customer.email}
                      </div>
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">{customer.address}</span>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{customer.loyaltyPoints}</div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">₱{customer.totalSpent.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Total Spent</div>
                      </div>
                    </div>
                    
                    {/* Last Purchase */}
                    {customer.lastPurchase && (
                      <div className="text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Last Purchase: {new Date(customer.lastPurchase).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <TouchButton
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDetailsModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        className="flex-1"
                      >
                        View
                      </TouchButton>
                      <TouchButton
                        onClick={() => console.log('Edit customer:', customer.id)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        className="flex-1"
                      >
                        Edit
                      </TouchButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map(customer => {
                    const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints);
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">Joined: {new Date(customer.joinDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.phone}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                              {customer.status.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${loyaltyTier.color}`}>
                              {loyaltyTier.tier}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.loyaltyPoints}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{customer.totalSpent.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowCustomerDetailsModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => console.log('Edit customer:', customer.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => console.log('Delete customer:', customer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={showCustomerDetailsModal}
          onClose={() => setShowCustomerDetailsModal(false)}
          title={selectedCustomer.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.phone}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                  {selectedCustomer.status.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Loyalty Points</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.loyaltyPoints}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Spent</label>
                <p className="mt-1 text-sm text-gray-900">₱{selectedCustomer.totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Join Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedCustomer.joinDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h4>
              {selectedCustomer.purchaseHistory.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.purchaseHistory.map(purchase => (
                    <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(purchase.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">{purchase.items} items</div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        ₱{purchase.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No purchase history</p>
              )}
            </div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <TouchButton
                onClick={() => setShowCustomerDetailsModal(false)}
                variant="outline"
              >
                Close
              </TouchButton>
              <TouchButton
                onClick={() => console.log('Edit customer:', selectedCustomer.id)}
                variant="primary"
                icon={Edit}
              >
                Edit Customer
              </TouchButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerScreen;















