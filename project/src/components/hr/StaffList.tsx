import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit, 
  Eye, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Building,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  X,
  Trash2,
  History,
  FileText,
  Upload,
  Download,
  AlertCircle,
  UserX,
  UserCheck,
  Briefcase,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStaffListData } from '../../hooks/useStaffListData';
import RequestAccount from './RequestAccount';
import AddStaff from './AddStaff';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  department: string;
  position: string;
  branch_id: string;
  is_active: boolean;
  role: string;
  phone: string;
  hire_date: string;
  salary: number;
  daily_allowance: number;
  employment_status: 'active' | 'resigned' | 'terminated' | 'on-leave';
  employment_type: 'regular' | 'probationary' | 'part-time' | 'contractual';
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  resignation_date?: string;
  termination_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  branches?: {
    id: string;
    name: string;
  };
}

interface EmploymentHistory {
  id: string;
  staff_id: string;
  change_type: 'position' | 'branch' | 'salary' | 'status' | 'type';
  old_value: string;
  new_value: string;
  effective_date: string;
  notes?: string;
  changed_by: string;
  created_at: string;
}

interface StaffDocument {
  id: string;
  staff_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  uploaded_at: string;
  uploaded_by: string;
}

const StaffList: React.FC = () => {
  // Data fetching with RBAC filtering - uses hook
  const {
    staffMembers: hookStaffMembers,
    branches: hookBranches,
    loading: hookLoading,
    error: hookError,
    refreshData,
    loadBranches,
    loadEmploymentHistory: hookLoadEmploymentHistory
  } = useStaffListData();

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [showRequestAccount, setShowRequestAccount] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [showEmploymentHistory, setShowEmploymentHistory] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentHistory[]>([]);
  const [staffDocuments, setStaffDocuments] = useState<StaffDocument[]>([]);
  
  // Sync hook data to local state for compatibility
  useEffect(() => {
    setStaffMembers(hookStaffMembers);
    setLoading(hookLoading);
    if (hookError) setError(hookError);
  }, [hookStaffMembers, hookBranches, hookLoading, hookError]);

  const branches = hookBranches;
  
  // Local loadEmploymentHistory wrapper
  const loadEmploymentHistory = async (staffId: string) => {
    const history = await hookLoadEmploymentHistory(staffId);
    setEmploymentHistory(history);
  };

  const loadStaffDocuments = async (staffId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', staffId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setStaffDocuments(data || []);
    } catch (err: any) {
      console.error('Error loading staff documents:', err);
    }
  };

  const handleViewDetails = async (staff: StaffMember) => {
    setSelectedStaff(staff);
    await loadEmploymentHistory(staff.id);
    await loadStaffDocuments(staff.id);
    setShowViewDetails(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowEditStaff(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      setSuccess('Staff member deleted successfully');
      await refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      setError(err.message || 'Failed to delete staff member');
    }
  };

  const handleResignEmployee = async (staffId: string) => {
    const resignationDate = prompt('Enter resignation date (YYYY-MM-DD):');
    if (!resignationDate) return;

    try {
      const { error } = await supabase
        .from('staff')
        .update({
          employment_status: 'resigned',
          resignation_date: resignationDate,
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId);

      if (error) throw error;

      // Add to employment history
      await supabase.from('employment_history').insert({
        staff_id: staffId,
        change_type: 'status',
        old_value: 'active',
        new_value: 'resigned',
        effective_date: resignationDate,
        notes: 'Employee resigned',
        changed_by: (await supabase.auth.getUser()).data.user?.id
      });

      setSuccess('Employee marked as resigned');
      await refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error marking employee as resigned:', err);
      setError(err.message || 'Failed to update employee status');
    }
  };

  const handleActivateEmployee = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          employment_status: 'active',
          resignation_date: null,
          termination_date: null,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId);

      if (error) throw error;

      setSuccess('Employee reactivated successfully');
      await refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error activating employee:', err);
      setError(err.message || 'Failed to activate employee');
    }
  };

  const handleUploadDocument = async (staffId: string, file: File, documentType: string) => {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${staffId}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `staff-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: insertError } = await supabase
        .from('staff_documents')
        .insert({
          staff_id: staffId,
          document_type: documentType,
          document_name: file.name,
          file_path: filePath,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

      setSuccess('Document uploaded successfully');
      await loadStaffDocuments(staffId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document');
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = 
      staff.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
    const matchesBranch = branchFilter === 'all' || staff.branch_id === branchFilter;
    const matchesStatus = statusFilter === 'all' || staff.employment_status === statusFilter;
    const matchesType = employmentTypeFilter === 'all' || staff.employment_type === employmentTypeFilter;
    
    return matchesSearch && matchesDepartment && matchesBranch && matchesStatus && matchesType;
  });

  const getDepartments = () => {
    const departments = [...new Set(staffMembers.map(staff => staff.department).filter(Boolean))];
    return departments.sort();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Active' },
      'resigned': { icon: UserX, color: 'bg-gray-100 text-gray-800', label: 'Resigned' },
      'terminated': { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Terminated' },
      'on-leave': { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'On Leave' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getEmploymentTypeBadge = (type: string) => {
    const typeConfig = {
      'regular': { color: 'bg-blue-100 text-blue-800', label: 'Regular' },
      'probationary': { color: 'bg-orange-100 text-orange-800', label: 'Probationary' },
      'part-time': { color: 'bg-purple-100 text-purple-800', label: 'Part-Time' },
      'contractual': { color: 'bg-indigo-100 text-indigo-800', label: 'Contractual' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.regular;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage employee profiles, employment history, and documents</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddStaff(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </button>
          <button
            onClick={() => setShowRequestAccount(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Request Account
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Staff</p>
              <p className="text-xl font-bold text-gray-900">{staffMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">
                {staffMembers.filter(s => s.employment_status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Probationary</p>
              <p className="text-xl font-bold text-gray-900">
                {staffMembers.filter(s => s.employment_type === 'probationary').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserX className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Resigned</p>
              <p className="text-xl font-bold text-gray-900">
                {staffMembers.filter(s => s.employment_status === 'resigned').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Departments</p>
              <p className="text-xl font-bold text-gray-900">{getDepartments().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {getDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular</option>
              <option value="probationary">Probationary</option>
              <option value="part-time">Part-Time</option>
              <option value="contractual">Contractual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compensation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {staff.first_name} {staff.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{staff.email}</div>
                        <div className="text-xs text-gray-400">ID: {staff.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{staff.position}</div>
                    <div className="text-sm text-gray-500">{staff.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building className="w-4 h-4 mr-1 text-gray-400" />
                      {staff.branches?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(staff.employment_status)}
                      {getEmploymentTypeBadge(staff.employment_type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₱{staff.salary?.toLocaleString() || '0'}/mo
                    </div>
                    <div className="text-xs text-gray-500">
                      +₱{staff.daily_allowance || 100}/day allowance
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.hire_date ? new Date(staff.hire_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(staff)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditStaff(staff)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Staff"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {staff.employment_status === 'active' && (
                        <button
                          onClick={() => handleResignEmployee(staff.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Mark as Resigned"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      {staff.employment_status === 'resigned' && (
                        <button
                          onClick={() => handleActivateEmployee(staff.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivate Employee"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Found</h3>
            <p className="text-gray-500">
              {searchTerm || departmentFilter !== 'all' || branchFilter !== 'all' || statusFilter !== 'all'
                ? 'No staff members match your filter criteria.'
                : 'No staff members found in the system.'
              }
            </p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showViewDetails && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Employee Details</h3>
              <button
                onClick={() => setShowViewDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Employee Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStaff.first_name} {selectedStaff.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Employee ID</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-green-600" />
                  Employment Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Position</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.position}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStaff.branches?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Employment Status</p>
                    <div className="mt-1">{getStatusBadge(selectedStaff.employment_status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Employment Type</p>
                    <div className="mt-1">{getEmploymentTypeBadge(selectedStaff.employment_type)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hire Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStaff.hire_date ? new Date(selectedStaff.hire_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {selectedStaff.resignation_date && (
                    <div>
                      <p className="text-xs text-gray-500">Resignation Date</p>
                      <p className="text-sm font-medium text-red-600">
                        {new Date(selectedStaff.resignation_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compensation & Emergency Contact */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                  Compensation
                </h4>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-gray-500">Base Monthly Salary</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{selectedStaff.salary?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Daily Allowance</p>
                    <p className="text-sm font-medium text-gray-900">
                      ₱{selectedStaff.daily_allowance || 100}
                    </p>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center mt-6">
                  <Phone className="w-5 h-5 mr-2 text-red-600" />
                  Emergency Contact
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Contact Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStaff.emergency_contact || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStaff.emergency_phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment History Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <History className="w-5 h-5 mr-2 text-indigo-600" />
                  Employment History
                </h4>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {employmentHistory.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employmentHistory.map((history) => (
                        <tr key={history.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(history.effective_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="capitalize font-medium text-gray-900">{history.change_type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{history.old_value}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{history.new_value}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{history.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No employment history recorded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Documents & Files
                </h4>
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const docType = prompt('Enter document type (e.g., ID, Contract, Certificate):');
                        if (docType) {
                          handleUploadDocument(selectedStaff.id, file, docType);
                        }
                      }
                    }}
                  />
                </label>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {staffDocuments.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.document_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{doc.document_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              onClick={async () => {
                                const { data } = await supabase.storage
                                  .from('staff-documents')
                                  .download(doc.file_path);
                                if (data) {
                                  const url = URL.createObjectURL(data);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = doc.document_name;
                                  a.click();
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {selectedStaff.notes && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">Notes</h4>
                <p className="text-sm text-yellow-800">{selectedStaff.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Staff Member</h3>
                <button
                  onClick={async () => {
                    setShowAddStaff(false);
                    await refreshData();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <AddStaff onBack={async () => {
                setShowAddStaff(false);
                await refreshData();
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaff && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Staff Member</h3>
                <button
                  onClick={async () => {
                    setShowEditStaff(false);
                    setSelectedStaff(null);
                    await refreshData();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <AddStaff 
                initialData={selectedStaff} 
                onBack={async () => {
                    setShowEditStaff(false);
                    setSelectedStaff(null);
                    await refreshData();
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Request Account Modal */}
      {showRequestAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Request User Accounts</h3>
                <button
                  onClick={() => setShowRequestAccount(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <RequestAccount />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;