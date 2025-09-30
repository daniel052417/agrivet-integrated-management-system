import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle, Building, Phone, Mail, Calendar, DollarSign, User, Briefcase, Save, ArrowLeft, UserPlus, Shield, CheckCircle, XCircle, Key } from 'lucide-react';
import { staffManagementApi, CreateStaffData, CreateStaffWithAccountData } from '../../lib/staffApi';
import { ValidationService, SecurityService } from '../../lib/validation';

interface AddStaffProps {
  onBack?: () => void;
}

const AddStaff: React.FC<AddStaffProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState<CreateStaffWithAccountData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().slice(0, 10),
    is_active: true,
    employee_id: '',
    role: 'staff',
    branch_id: undefined,
    salary: undefined,
    createUserAccount: false,
    accountDetails: {
      role: 'staff',
      sendEmailInvite: false,
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const branchesData = await staffManagementApi.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!ValidationService.isValidEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!ValidationService.isValidPhone(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!form.position.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!form.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!form.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
    }

    if (form.createUserAccount) {
      if (!form.accountDetails.role) {
        newErrors.role = 'User role is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(null);

    try {
      if (form.createUserAccount) {
        await staffManagementApi.createStaffWithAccount(form);
        setSuccess('Staff member and user account created successfully!');
      } else {
        const staffData: CreateStaffData = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          position: form.position,
          department: form.department,
          hire_date: form.hire_date,
          is_active: form.is_active,
          employee_id: form.employee_id,
          role: form.role,
          branch_id: form.branch_id,
          salary: form.salary
        };
        await staffManagementApi.createStaff(staffData);
        setSuccess('Staff member created successfully!');
      }

      // Reset form
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        hire_date: new Date().toISOString().slice(0, 10),
        is_active: true,
        employee_id: '',
        role: 'staff',
        branch_id: undefined,
        salary: undefined,
        createUserAccount: false,
        accountDetails: {
          role: 'staff',
          sendEmailInvite: false,
        }
      });
    } catch (error: any) {
      console.error('Error creating staff:', error);
      setErrors({ submit: error.message || 'Failed to create staff member' });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const password = SecurityService.generateSecurePassword();
    setGeneratedPassword(password);
    setForm(prev => ({
      ...prev,
      accountDetails: {
        ...prev.accountDetails,
        password: password
      }
    }));
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
  };

  return (
    <div className="add-staff">
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Staff Member</h1>
                <p className="text-gray-600">Create a new staff member and optionally a user account</p>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Employment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID *
                </label>
                <input
                  type="text"
                  value={form.employee_id}
                  onChange={(e) => setForm(prev => ({ ...prev, employee_id: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.employee_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter employee ID"
                />
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm(prev => ({ ...prev, position: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.position ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter position"
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter department"
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hire Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) => setForm(prev => ({ ...prev, hire_date: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  value={form.branch_id || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, branch_id: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={form.salary || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter salary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active employee</span>
              </label>
            </div>
          </div>

          {/* User Account Creation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              User Account Creation
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.createUserAccount}
                  onChange={(e) => setForm(prev => ({ ...prev, createUserAccount: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Create user account for this staff member</span>
              </label>

              {form.createUserAccount && (
                <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Role *
                    </label>
                    <select
                      value={form.accountDetails.role}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        accountDetails: { ...prev.accountDetails, role: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.role ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="hr">HR</option>
                      <option value="inventory-clerk">Inventory Clerk</option>
                      <option value="cashier">Cashier</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.accountDetails.password || ''}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            accountDetails: { ...prev.accountDetails, password: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <XCircle className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                    {generatedPassword && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Generated Password:</span>
                          <button
                            type="button"
                            onClick={copyPassword}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-sm font-mono text-gray-900">{generatedPassword}</code>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.accountDetails.sendEmailInvite}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        accountDetails: { ...prev.accountDetails, sendEmailInvite: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Send email invitation</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Creating...' : 'Create Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
  );
};

export default AddStaff;










