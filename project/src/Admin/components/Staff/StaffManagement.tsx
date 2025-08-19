import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, Calendar } from 'lucide-react';

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const staff = [
    {
      id: 1,
      name: 'Maria Santos',
      position: 'Store Manager',
      department: 'Operations',
      email: 'maria.santos@agrivet.com',
      phone: '+63 912 345 6789',
      hireDate: '2023-01-15',
      status: 'Active',
      avatar: null
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      position: 'Veterinarian',
      department: 'Veterinary Services',
      email: 'juan.delacruz@agrivet.com',
      phone: '+63 918 765 4321',
      hireDate: '2023-03-20',
      status: 'Active',
      avatar: null
    },
    {
      id: 3,
      name: 'Ana Rodriguez',
      position: 'Sales Associate',
      department: 'Sales',
      email: 'ana.rodriguez@agrivet.com',
      phone: '+63 917 555 0123',
      hireDate: '2023-06-10',
      status: 'Active',
      avatar: null
    },
    {
      id: 4,
      name: 'Carlos Martinez',
      position: 'Inventory Clerk',
      department: 'Warehouse',
      email: 'carlos.martinez@agrivet.com',
      phone: '+63 915 444 7890',
      hireDate: '2023-08-05',
      status: 'On Leave',
      avatar: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'On Leave':
        return 'bg-orange-100 text-orange-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.position}</p>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Hired: {member.hireDate}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Department:</span> {member.department}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors">
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors">
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;