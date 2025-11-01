import React, { useState, useEffect } from 'react';
import { Building, Phone, Mail, Calendar, DollarSign, User, Briefcase, Save, UserPlus, Shield, CheckCircle, XCircle, MapPin, UserCog, Clock, Hash } from 'lucide-react';
import { staffManagementApi, CreateStaffData } from '../../lib/staffApi';
import { ValidationService } from '../../lib/validation';
import { supabase } from '../../lib/supabase';
import { emailService } from '../../lib/emailService';

interface AddStaffProps {
  onBack?: () => void;
}

interface StaffFormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  position: string;
  department: string;
  hire_date: string;
  is_active: boolean;
  employee_id: string;
  role: string;
  branch_id?: string;
  salary?: number;
  employment_type: string;
  salary_type: string;
  work_schedule: string;
  payment_method: string;
  createUserAccount: boolean;
  accountDetails: {
    role: string;
    sendEmailInvite: boolean;
  };
}

const AddStaff: React.FC<AddStaffProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; display_name: string; description?: string; is_active: boolean }>>([]);
  const [form, setForm] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    marital_status: 'single',
    position: '',
    department: '',
    hire_date: new Date().toISOString().slice(0, 10),
    is_active: true,
    employee_id: '',
    role: 'staff',
    branch_id: undefined,
    salary: undefined,
    employment_type: 'Regular',
    salary_type: 'Monthly',
    work_schedule: '',
    payment_method: '',
    createUserAccount: false,
    accountDetails: {
      role: 'staff',
      sendEmailInvite: false,
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoGenerateId, setAutoGenerateId] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadBranches();
    loadRoles();
  }, []);

  const loadBranches = async () => {
    try {
      const branchesData = await staffManagementApi.branches.getAllBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await staffManagementApi.roles.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const generateEmployeeId = () => {
    const prefix = form.branch_id ? branches.find(b => b.id === form.branch_id)?.name.substring(0, 3).toUpperCase() : 'EMP';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const checkForDuplicates = async (): Promise<Record<string, string>> => {
    const duplicateErrors: Record<string, string> = {};

    try {
      // Check for email duplication in staff table
      const { data: staffEmailCheck, error: staffEmailError } = await supabase
        .from('staff')
        .select('id, email')
        .eq('email', form.email)
        .single();

      if (staffEmailCheck && !staffEmailError) {
        duplicateErrors.email = 'A staff member with this email already exists';
      }

      // Check for email duplication in users table
      const { data: userEmailCheck, error: userEmailError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', form.email)
        .single();

      if (userEmailCheck && !userEmailError) {
        duplicateErrors.email = 'A user with this email already exists';
      }

      // Check for employee_id duplication (if not auto-generating)
      if (!autoGenerateId && form.employee_id?.trim()) {
        const { data: employeeIdCheck, error: employeeIdError } = await supabase
          .from('staff')
          .select('id, employee_id')
          .eq('employee_id', form.employee_id)
          .single();

        if (employeeIdCheck && !employeeIdError) {
          duplicateErrors.employee_id = 'A staff member with this employee ID already exists';
        }
      }

      // Check for composite unique constraint (first_name + last_name + birth_date)
      if (form.first_name?.trim() && form.last_name?.trim() && form.date_of_birth) {
        const { data: compositeCheck, error: compositeError } = await supabase
          .from('staff')
          .select('id, first_name, last_name, date_of_birth')
          .eq('first_name', form.first_name.trim())
          .eq('last_name', form.last_name.trim())
          .eq('date_of_birth', form.date_of_birth)
          .single();

        if (compositeCheck && !compositeError) {
          duplicateErrors.duplicate_person = 'A staff member with the same name and birth date already exists';
        }
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      // Don't throw error, just log it and continue
    }

    return duplicateErrors;
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

    if (!form.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!ValidationService.isValidPhone(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!form.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!form.date_of_birth) {
      newErrors.date_of_birth = 'Birth date is required';
    }

    if (!form.position?.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!form.branch_id) {
      newErrors.branch_id = 'Branch is required';
    }

    if (!form.employee_id?.trim() && !autoGenerateId) {
      newErrors.employee_id = 'Employee ID is required';
    }

    if (!form.salary || form.salary <= 0) {
      newErrors.salary = 'Salary rate is required';
    }

    if (form.createUserAccount) {
      if (!form.accountDetails?.role) {
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
    setShowSuccessAlert(false);
    setShowErrorAlert(false);

    // Check for duplicates before proceeding
    const duplicateErrors = await checkForDuplicates();
    if (Object.keys(duplicateErrors).length > 0) {
      setErrors(duplicateErrors);
      setLoading(false);
      return;
    }

    try {
      // Generate employee ID if auto-generate is enabled
      const finalEmployeeId = autoGenerateId ? generateEmployeeId() : form.employee_id;
      
      // Create staff member
      const staffData: CreateStaffData = {
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        marital_status: form.marital_status,
        position: form.position,
        department: form.department,
        hire_date: form.hire_date,
        is_active: form.is_active,
        employee_id: finalEmployeeId,
        role: form.role,
        branch_id: form.branch_id,
        salary: form.salary,
        employment_type: form.employment_type,
        salary_type: form.salary_type,
        work_schedule: form.work_schedule,
        payment_method: form.payment_method
      };
      
      const createdStaff = await staffManagementApi.staff.createStaff(staffData);
      
      // If user account creation is requested, create account with magic link
      if (form.createUserAccount && form.accountDetails?.role) {
        try {
          // Generate verification token (UUID)
          const activationToken = crypto.randomUUID();
          const tokenExpiry = new Date();
          tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours from now

          // Create user account with Pending Activation status
          const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
              email: form.email,
              first_name: form.first_name,
              last_name: form.last_name,
              phone: form.phone || '',
              role: form.accountDetails.role,
              branch_id: form.branch_id,
              is_active: true,
              account_status: 'pending_activation',
              user_type: 'staff',
              password_hash: null, // No password until activation
              email_verified: false,
              verification_token: activationToken,
              token_expiry: tokenExpiry.toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (userError) throw userError;

          // Assign role to the user
          const { data: allRoles, error: allRolesError } = await supabase
            .from('roles')
            .select('id, name, display_name')
            .eq('is_active', true);

          if (!allRolesError && allRoles && allRoles.length > 0) {
            const targetRole = allRoles.find(role => 
              role.name === form.accountDetails?.role || 
              role.name === 'staff' || 
              role.name === 'user'
            );

            const roleToAssign = targetRole || allRoles[0];
            
            if (roleToAssign) {
              await supabase
                .from('user_roles')
                .insert({
                  user_id: userData.id,
                  role_id: roleToAssign.id,
                  assigned_at: new Date().toISOString()
                });
            }
          }

          // Link staff to user account
          await supabase
            .from('staff')
            .update({ user_account_id: userData.id })
            .eq('id', createdStaff.id);

          // Send activation email
          try {
            const emailResult = await emailService.sendActivationEmail({
              to: form.email,
              name: `${form.first_name} ${form.last_name}`,
              activationToken: activationToken
            });

            if (emailResult.success) {
              setAlertMessage('Staff member and user account created successfully! Activation email has been sent to the staff member.');
            } else {
              setAlertMessage('Staff member and user account created successfully! However, the activation email could not be sent. Please send the activation link manually.');
            }
          } catch (emailError: any) {
            console.error('Error sending activation email:', emailError);
            setAlertMessage('Staff member and user account created successfully! However, the activation email could not be sent. Please send the activation link manually.');
          }
        } catch (accountError: any) {
          console.error('Error creating user account:', accountError);
          setAlertMessage(`Staff member created successfully! However, user account creation failed: ${accountError.message || 'Unknown error'}`);
        }
      } else {
        setAlertMessage('Staff member created successfully!');
      }
      
      setShowSuccessAlert(true);

      // Reset form
      setForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: '',
        marital_status: 'single',
        position: '',
        department: '',
        hire_date: new Date().toISOString().slice(0, 10),
        is_active: true,
        employee_id: '',
        role: 'staff',
        branch_id: undefined,
        salary: undefined,
        employment_type: 'Regular',
        salary_type: 'Monthly',
        work_schedule: '',
        payment_method: '',
        createUserAccount: false,
        accountDetails: {
          role: 'staff',
          sendEmailInvite: false,
        }
      });
      setAutoGenerateId(false);
    } catch (error: any) {
      console.error('Error creating staff:', error);
      setAlertMessage(error.message || 'Failed to create staff member');
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };


  const checkEmailDuplicate = async (email: string) => {
    if (!email.trim() || !ValidationService.isValidEmail(email)) return;
    
    try {
      // Check staff table
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, email')
        .eq('email', email)
        .single();

      // Check users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if ((staffData && !staffError) || (userData && !userError)) {
        setErrors(prev => ({
          ...prev,
          email: 'A user with this email already exists'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.email === 'A user with this email already exists') {
            delete newErrors.email;
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking email duplicate:', error);
    }
  };

  const checkEmployeeIdDuplicate = async (employeeId: string) => {
    if (!employeeId.trim() || autoGenerateId) return;
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, employee_id')
        .eq('employee_id', employeeId)
        .single();

      if (data && !error) {
        setErrors(prev => ({
          ...prev,
          employee_id: 'A staff member with this employee ID already exists'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.employee_id === 'A staff member with this employee ID already exists') {
            delete newErrors.employee_id;
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking employee ID duplicate:', error);
    }
  };

  const closeSuccessAlert = () => {
    setShowSuccessAlert(false);
    setAlertMessage('');
  };

  const closeErrorAlert = () => {
    setShowErrorAlert(false);
    setAlertMessage('');
  };

  // Handle escape key to close alerts
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSuccessAlert) {
          closeSuccessAlert();
        } else if (showErrorAlert) {
          closeErrorAlert();
        }
      }
    };

    if (showSuccessAlert || showErrorAlert) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSuccessAlert, showErrorAlert]);

  return (
    <div className="add-staff">
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            
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


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duplicate Person Error */}
          {errors.duplicate_person && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700">{errors.duplicate_person}</p>
              </div>
            </div>
          )}

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
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, first_name: e.target.value }))}
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
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, last_name: e.target.value }))}
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
                  Middle Name
                </label>
                <input
                  type="text"
                  value={form.middle_name}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, middle_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter middle name (optional)"
                />
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
                    onChange={(e) => {
                      setForm((prev: StaffFormData) => ({ ...prev, email: e.target.value }));
                      // Clear any existing email error when user starts typing
                      if (errors.email === 'A staff member with this email already exists') {
                        setErrors((prev: Record<string, string>) => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    onBlur={(e) => checkEmailDuplicate(e.target.value)}
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
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, phone: e.target.value }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, address: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter address"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, date_of_birth: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, gender: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marital Status
                </label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={form.marital_status}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, marital_status: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
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
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={form.employee_id}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, employee_id: e.target.value }));
                        // Clear any existing employee ID error when user starts typing
                        if (errors.employee_id === 'A staff member with this employee ID already exists') {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.employee_id;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={(e) => checkEmployeeIdDuplicate(e.target.value)}
                      disabled={autoGenerateId}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.employee_id ? 'border-red-300' : 'border-gray-300'
                      } ${autoGenerateId ? 'bg-gray-100' : ''}`}
                      placeholder={autoGenerateId ? 'Auto-generated' : 'Enter employee ID'}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoGenerateId(!autoGenerateId);
                      if (!autoGenerateId) {
                        setForm(prev => ({ ...prev, employee_id: generateEmployeeId() }));
                      } else {
                        setForm(prev => ({ ...prev, employee_id: '' }));
                      }
                    }}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      autoGenerateId 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {autoGenerateId ? 'Manual' : 'Auto'}
                  </button>
                </div>
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <select
                  value={form.position}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, position: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.position ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Position</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="Sales">Sales</option>
                  <option value="Inventory">Inventory</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={form.branch_id || ''}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, branch_id: e.target.value || undefined }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.branch_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                {errors.branch_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
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
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, hire_date: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type *
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, employment_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Rate *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={form.salary || ''}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, salary: e.target.value ? Number(e.target.value) : undefined }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.salary ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter salary rate"
                  />
                </div>
                {errors.salary && (
                  <p className="mt-1 text-sm text-red-600">{errors.salary}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Type *
                </label>
                <select
                  value={form.salary_type}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, salary_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Schedule
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={form.work_schedule}
                    onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, work_schedule: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 8:00 AM - 5:00 PM, Mon-Fri"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="payroll_card">Payroll Card</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, is_active: e.target.checked }))}
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
                  onChange={(e) => setForm((prev: StaffFormData) => ({ ...prev, createUserAccount: e.target.checked }))}
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
                      value={form.accountDetails?.role || ''}
                      onChange={(e) => setForm((prev: StaffFormData) => ({
                        ...prev,
                        accountDetails: { 
                          role: e.target.value,
                          sendEmailInvite: prev.accountDetails?.sendEmailInvite || false
                        }
                      }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.role ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select User Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.name}>
                          {role.display_name}
                        </option>
                      ))}
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                      When this checkbox is checked, a user account will be created for the staff member and an activation email with a magic link will be sent to their email address. The staff member will need to click the link to set their password and activate their account.
                    </p>
                  </div>
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

        {/* Success Alert Dialog */}
        {showSuccessAlert && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeSuccessAlert}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Success</h3>
              </div>
              <p className="text-gray-700 mb-6">{alertMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeSuccessAlert}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Dialog */}
        {showErrorAlert && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeErrorAlert}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <XCircle className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              </div>
              <p className="text-gray-700 mb-6">{alertMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeErrorAlert}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default AddStaff;



















