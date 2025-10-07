import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { customAuth } from '../../lib/customAuth';

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
  created_at: string;
  branches?: {
    id: string;
    name: string;
  };
}

interface AccountRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_email: string;
  requested_by: string;
  requested_by_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  email_sent: boolean;
  role?: string;
  staff: StaffMember;
}

const RequestAccount: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; display_name: string }>>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load staff members
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          email,
          employee_id,
          department,
          position,
          branch_id,
          is_active,
          role,
          created_at,
          branches:branch_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (staffError) throw staffError;

      // Load account requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('account_requests')
        .select(`
          id,
          staff_id,
          staff_name,
          staff_email,
          requested_by,
          requested_by_name,
          status,
          created_at,
          approved_at,
          rejected_at,
          approved_by,
          rejected_by,
          rejection_reason,
          email_sent,
          role,
          staff:staff_id (
            id,
            first_name,
            last_name,
            email,
            employee_id,
            department,
            position,
            branch_id,
            is_active,
            role,
            created_at,
            branches:branch_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.warn('Account requests table may not exist:', requestsError);
      }

      // Load branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (branchesError) throw branchesError;

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name, display_name')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (rolesError) {
        console.warn('Roles table may not exist:', rolesError);
      }

      setStaffMembers(staffData || []);
      setAccountRequests(requestsData || []);
      setBranches(branchesData || []);
      setRoles(rolesData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkIfStaffHasAccount = (staffId: string): boolean => {
    // Check if staff member already has a user account
    return accountRequests.some(request => 
      request.staff_id === staffId && 
      (request.status === 'approved' || request.status === 'pending')
    );
  };

  const checkIfRequestExists = (staffId: string): boolean => {
    return accountRequests.some(request => 
      request.staff_id === staffId && request.status === 'pending'
    );
  };

  const handleRequestAccount = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedStaff) return;

    if (!selectedRole) {
      alert('Please select a role for the account request.');
      return;
    }

    try {
      setRequesting(true);
      const currentUser = customAuth.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Create account request
      const { data: requestData, error: requestError } = await supabase
        .from('account_requests')
        .insert({
          staff_id: selectedStaff.id,
          staff_name: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
          staff_email: selectedStaff.email,
          requested_by: currentUser.id,
          requested_by_name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Unknown User',
          status: 'pending',
          email_sent: false,
          role: selectedRole
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // NOTE: No audit logging for account request creation
      // Audit logs are only created when accounts are actually approved and created
      // This prevents cluttering the audit log with request-only actions
      // The actual account creation will be logged in the approveAndCreateAccount function

      // Reload data
      await loadData();
      
      setShowRequestModal(false);
      setSelectedStaff(null);
      setSelectedRole('');
      
      // Show success message
      alert('Account request submitted successfully!');
    } catch (err: any) {
      console.error('Error creating account request:', err);
      alert(err.message || 'Failed to submit account request');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
          <p className="text-sm text-gray-600">Request user accounts for staff members who don't have them yet</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff) => {
                const hasAccount = checkIfStaffHasAccount(staff.id);
                const hasPendingRequest = checkIfRequestExists(staff.id);
                
                return (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
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
                      <div className="text-sm text-gray-900">{staff.department}</div>
                      <div className="text-sm text-gray-500">{staff.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.branches?.name || 'Unknown Branch'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasAccount ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Account Exists
                        </span>
                      ) : hasPendingRequest ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Request Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Account
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!hasAccount && !hasPendingRequest && (
                        <button
                          onClick={() => handleRequestAccount(staff)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Request Account
                        </button>
                      )}
                      {hasPendingRequest && (
                        <span className="text-sm text-gray-500">Request pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Requests Summary */}
      {accountRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Account Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accountRequests.slice(0, 5).map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.staff_name}
                      </div>
                      <div className="text-sm text-gray-500">{request.staff_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requested_by_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Account Modal */}
      {showRequestModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Request Account</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Staff Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedStaff.first_name} {selectedStaff.last_name}</div>
                    <div><span className="font-medium">Email:</span> {selectedStaff.email}</div>
                    <div><span className="font-medium">Employee ID:</span> {selectedStaff.employee_id}</div>
                    <div><span className="font-medium">Department:</span> {selectedStaff.department}</div>
                    <div><span className="font-medium">Position:</span> {selectedStaff.position}</div>
                    <div><span className="font-medium">Branch:</span> {selectedStaff.branches?.name}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">
                    Select Role for Account
                  </label>
                  <select
                    id="role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.display_name || role.name}
                      </option>
                    ))}
                  </select>
                  {selectedRole && (
                    <p className="text-xs text-gray-500">
                      Selected role: {roles.find(r => r.name === selectedRole)?.display_name || selectedRole}
                    </p>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>This will create an account request that will be reviewed by the User Management team. The staff member will receive an email invitation once approved.</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedRole('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={requesting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestAccount;
