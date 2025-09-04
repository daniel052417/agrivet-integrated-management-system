import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle, Building, Phone, Mail, Calendar, DollarSign, User, Briefcase, Save, ArrowLeft, UserPlus, Shield, CheckCircle, XCircle, Key } from 'lucide-react';
import { staffManagementApi, CreateStaffData, CreateStaffWithAccountData } from '../../../lib/staffApi';
import { ValidationService, SecurityService } from '../../../lib/validation';

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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchesData = await staffManagementApi.branches.getAllBranches();
        setBranches(branchesData.map(b => ({ id: b.id, name: b.name })));
      } catch (error) {
        console.error('Failed to load branches:', error);
      }
    };
    loadBranches();
  }, []);

  const validateForm = (): boolean => {
    const validation = ValidationService.validateStaffWithAccount(form);
    setErrors(validation.errors);
    setWarnings(validation.warnings);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (form.createUserAccount) {
        // Use enhanced API to create staff with account
        await staffManagementApi.enhancedStaff.createStaffWithAccount(form);
      } else {
        // Use regular API to create staff only
        const { createUserAccount, accountDetails, ...staffData } = form;
        await staffManagementApi.staff.createStaff(staffData);
      }
      
      setSuccess(true);
      
      // Reset form after successful submission
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
      setErrors({});
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Failed to create staff:', error);
      setErrors({ general: 'Failed to create staff member. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateStaffData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
                     <button
             onClick={onBack}
             className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
           >
             <ArrowLeft className="w-5 h-5 text-gray-600" />
           </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-blue-600" />
              Add Staff Member
            </h1>
            <p className="text-gray-600 mt-1">Create a new staff member account with complete profile information</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800">Staff member created successfully!</h3>
            <p className="text-sm text-green-600">The new staff member has been added to the system.</p>
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Please Review</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.first_name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.last_name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.email}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Employment Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.position ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Sales Associate, Manager"
                />
                {errors.position && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.position}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Sales, Operations, HR"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={form.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.branch_id || ''}
                    onChange={(e) => handleInputChange('branch_id', e.target.value || undefined)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hire Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) => handleInputChange('hire_date', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={form.salary || ''}
                    onChange={(e) => handleInputChange('salary', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.salary ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter salary amount"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.salary && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.salary}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account Creation Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">User Account Creation</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="createUserAccount"
                  checked={form.createUserAccount}
                  onChange={(e) => {
                    setForm(prev => ({ 
                      ...prev, 
                      createUserAccount: e.target.checked,
                      accountDetails: e.target.checked ? prev.accountDetails : undefined
                    }));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createUserAccount" className="text-sm font-medium text-gray-700">
                  Create User Account
                </label>
                <span className="text-xs text-gray-500">
                  (Create a system login account for this staff member)
                </span>
              </div>

              {form.createUserAccount && form.accountDetails && (
                <div className="ml-7 space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Role
                      </label>
                      <select
                        value={form.accountDetails.role}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          accountDetails: {
                            ...prev.accountDetails!,
                            role: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={form.accountDetails.username || ''}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          accountDetails: {
                            ...prev.accountDetails!,
                            username: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="sendEmailInvite"
                        checked={form.accountDetails.sendEmailInvite}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          accountDetails: {
                            ...prev.accountDetails!,
                            sendEmailInvite: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sendEmailInvite" className="text-sm font-medium text-gray-700">
                        Send Email Invitation
                      </label>
                      <span className="text-xs text-gray-500">
                        (Staff will receive an email to set up their password)
                      </span>
                    </div>

                    {!form.accountDetails.sendEmailInvite && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initial Password
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={form.accountDetails.password || ''}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              accountDetails: {
                                ...prev.accountDetails!,
                                password: e.target.value
                              }
                            }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter initial password"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const generatedPassword = SecurityService.generateSecurePassword();
                              setForm(prev => ({
                                ...prev,
                                accountDetails: {
                                  ...prev.accountDetails!,
                                  password: generatedPassword
                                }
                              }));
                            }}
                            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            title="Generate secure password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Staff will be required to change this password on first login
                        </p>
                        {form.accountDetails.password && (
                          <div className="mt-2">
                            {(() => {
                              const validation = ValidationService.validatePassword(form.accountDetails.password!);
                              return (
                                <div className={`text-xs p-2 rounded ${
                                  validation.isValid 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  <div className="font-medium mb-1">
                                    Password Strength: {validation.score}/5
                                  </div>
                                  {validation.feedback.length > 0 && (
                                    <ul className="space-y-1">
                                      {validation.feedback.map((item, index) => (
                                        <li key={index}>• {item}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Account will be created with permissions matching the selected role
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active Account
              </label>
              <span className="text-xs text-gray-500">
                (Uncheck to create an inactive account)
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                         <button
               type="button"
               onClick={onBack}
               className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
             >
               Cancel
             </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Staff Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;
