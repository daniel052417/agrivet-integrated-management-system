import React, { useState, useEffect } from 'react';
import { Building, Phone, Mail, Calendar, DollarSign, User, Briefcase, Save, UserPlus, Shield, CheckCircle, XCircle, MapPin, UserCog, Clock, Hash, Camera } from 'lucide-react';
import { staffManagementApi, CreateStaffData } from '../../lib/staffApi';
import { ValidationService } from '../../lib/validation';
import { supabase } from '../../lib/supabase';
import { emailService } from '../../lib/emailService';
import FaceRegistration from './FaceRegistration';
import { faceRegistrationService, StaffFaceData } from '../../lib/faceRegistrationService';

const WORK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatTimeForInput = (value?: string | null) => {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

const normalizeTimePayload = (value?: string) => {
  if (!value) return undefined;
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
};

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
};

interface AddStaffProps {
  onBack?: () => void;
  initialData?: any; // Staff data for edit mode
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
  use_default_schedule: boolean;
  work_days: string[];
  time_in: string;
  time_out: string;
  break_start: string;
  break_end: string;
}

const AddStaff: React.FC<AddStaffProps> = ({ onBack, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; display_name: string; description?: string; is_active: boolean }>>([]);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [faceData, setFaceData] = useState<StaffFaceData | null>(null);
  const [existingFaceData, setExistingFaceData] = useState<StaffFaceData | null>(null);
  const isEditMode = !!initialData;
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
    },
  use_default_schedule: true,
  work_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  time_in: '',
  time_out: '',
  break_start: '',
  break_end: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoGenerateId, setAutoGenerateId] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleUseDefaultScheduleToggle = (checked: boolean) => {
    setForm(prev => ({
      ...prev,
      use_default_schedule: checked,
      work_days: checked
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        : (prev.work_days.length ? prev.work_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    }));
    setErrors(prev => {
      if (!prev.work_days && !prev.time_in && !prev.time_out) return prev;
      const newErrors = { ...prev };
      if (checked) {
        delete newErrors.work_days;
        delete newErrors.time_in;
        delete newErrors.time_out;
      }
      return newErrors;
    });
  };

  const handleWorkDayToggle = (day: string) => {
    setForm(prev => {
      const exists = prev.work_days.includes(day);
      const updatedDays = exists
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day].sort((a, b) => WORK_DAYS.indexOf(a) - WORK_DAYS.indexOf(b));
      return { ...prev, work_days: updatedDays };
    });
    setErrors(prev => {
      if (!prev.work_days) return prev;
      const newErrors = { ...prev };
      delete newErrors.work_days;
      return newErrors;
    });
  };

  const syncUserRoleAssignment = async (userId: string, roleId: string, roleName: string) => {
    try {
      await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: roleId,
          is_primary: true,
          assigned_at: new Date().toISOString(),
          is_active: true
        }, { onConflict: 'user_id,role_id' });

      await supabase
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .neq('role_id', roleId);

      await supabase
        .from('users')
        .update({
          role: roleName,
          role_id: roleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (roleError) {
      console.error('Error syncing user role:', roleError);
    }
  };

  useEffect(() => {
    loadBranches();
    loadRoles();
    
    // If in edit mode, load existing face data
    if (initialData?.id) {
      loadExistingFaceData(initialData.id);
    }
    
    // If in edit mode, populate form with initial data
    if (initialData) {
      setForm({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        middle_name: initialData.middle_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        date_of_birth: formatDateForInput(initialData.date_of_birth) || '',
        gender: initialData.gender || '',
        marital_status: initialData.marital_status || 'single',
        position: initialData.position || '',
        department: initialData.department || '',
        hire_date: formatDateForInput(initialData.hire_date) || new Date().toISOString().slice(0, 10),
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        employee_id: initialData.employee_id || '',
        role: initialData.role || initialData.position || 'staff',
        branch_id: initialData.branch_id || undefined,
        salary: initialData.salary || undefined,
        employment_type: initialData.employment_type || 'Regular',
        salary_type: initialData.salary_type || 'Monthly',
        work_schedule: initialData.work_schedule || '',
        payment_method: initialData.payment_method || '',
        createUserAccount: false,
        accountDetails: {
          role: initialData.role || initialData.position || 'staff',
          sendEmailInvite: false,
        },
        use_default_schedule: initialData.use_default_schedule ?? true,
        work_days: initialData.work_days && Array.isArray(initialData.work_days) && initialData.work_days.length > 0
          ? initialData.work_days
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        time_in: formatTimeForInput(initialData.time_in),
        time_out: formatTimeForInput(initialData.time_out),
        break_start: formatTimeForInput(initialData.break_start),
        break_end: formatTimeForInput(initialData.break_end)
      });
    }
  }, [initialData]);

  const loadExistingFaceData = async (staffId: string) => {
    try {
      const existingFace = await faceRegistrationService.getStaffFace(staffId);
      setExistingFaceData(existingFace);
    } catch (error) {
      console.error('Error loading existing face data:', error);
    }
  };

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

    if (isEditMode) {
      return duplicateErrors;
    }

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

    if (!form.use_default_schedule) {
      if (!form.work_days || form.work_days.length === 0) {
        newErrors.work_days = 'Select at least one work day';
      }
      if (!form.time_in?.trim()) {
        newErrors.time_in = 'Time in is required';
      }
      if (!form.time_out?.trim()) {
        newErrors.time_out = 'Time out is required';
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
      // Generate employee ID if auto-generate is enabled (creation only)
      const generatedEmployeeId = autoGenerateId ? generateEmployeeId() : form.employee_id;
      const finalEmployeeId = isEditMode ? (initialData?.employee_id || form.employee_id) : generatedEmployeeId;
      
      const selectedRoleRecord = roles.find(role => role.name === form.position || role.id === form.position);
      const scheduleSummary = form.use_default_schedule
        ? 'Default schedule'
        : `${form.work_days.join(', ')} • ${(form.time_in || '--:--')} - ${(form.time_out || '--:--')}${form.break_start && form.break_end ? ` (Break ${form.break_start}-${form.break_end})` : ''}`;
      const positionDisplay = selectedRoleRecord?.display_name || selectedRoleRecord?.name || form.position;
      const roleName = selectedRoleRecord?.name || form.role;

      let userAccountIdForSync = initialData?.user_account_id || null;
      let roleSynced = false;

      const baseStaffData = {
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        phone: form.phone,
        address: form.address,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        marital_status: form.marital_status,
        position: positionDisplay || '',
        hire_date: form.hire_date,
        is_active: form.is_active,
        role: roleName,
        branch_id: form.branch_id,
        salary: form.salary,
        employment_type: form.employment_type,
        salary_type: form.salary_type,
        work_schedule: scheduleSummary,
        use_default_schedule: form.use_default_schedule,
        work_days: form.use_default_schedule ? null : form.work_days,
        time_in: form.use_default_schedule ? null : normalizeTimePayload(form.time_in),
        time_out: form.use_default_schedule ? null : normalizeTimePayload(form.time_out),
        break_start: form.use_default_schedule ? null : normalizeTimePayload(form.break_start),
        break_end: form.use_default_schedule ? null : normalizeTimePayload(form.break_end)
      };
      
      const createPayload: CreateStaffData = {
        ...baseStaffData,
        email: form.email,
        employee_id: finalEmployeeId
      };

      let createdStaff;
      if (isEditMode && initialData?.id) {
        // Update existing staff
        const updatePayload = {
          id: initialData.id,
          ...baseStaffData
        };
        createdStaff = await staffManagementApi.staff.updateStaff(updatePayload);
        
        // Update face data if it was registered
        if (faceData && faceData.staff_id !== createdStaff.id) {
          try {
            faceData.staff_id = createdStaff.id;
            if (existingFaceData?.id) {
              await faceRegistrationService.updateFaceDescriptor(existingFaceData.id, faceData);
            } else {
              await faceRegistrationService.saveFaceDescriptor(faceData);
            }
            console.log('✅ Face data updated for staff member');
          } catch (faceError) {
            console.error('Error updating face data:', faceError);
            // Don't fail the entire operation if face update fails
          }
        }
      } else {
        // Create new staff
        createdStaff = await staffManagementApi.staff.createStaff(createPayload);
        
        // Save face data if it was registered before staff creation
        if (faceData && !faceData.staff_id) {
          try {
            faceData.staff_id = createdStaff.id;
            await faceRegistrationService.saveFaceDescriptor(faceData);
            console.log('✅ Face data saved for new staff member');
          } catch (faceError) {
            console.error('Error saving face data:', faceError);
            // Don't fail the entire operation if face save fails
          }
        }
      }

      userAccountIdForSync = userAccountIdForSync || createdStaff?.user_account_id || null;
      
      // If user account creation is requested, create account with magic link
      if (form.createUserAccount) {
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
              role: roleName || form.accountDetails.role,
              role_id: selectedRoleRecord?.id || null,
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
            const preferredRoleNames = [
              selectedRoleRecord?.name,
              form.accountDetails?.role,
              'staff',
              'user'
            ].filter(Boolean) as string[];

            const roleToAssign =
              allRoles.find(role => preferredRoleNames.includes(role.name)) ||
              allRoles[0];

            if (roleToAssign) {
              await supabase
                .from('user_roles')
                .insert({
                  user_id: userData.id,
                  role_id: roleToAssign.id,
                  assigned_at: new Date().toISOString()
                });
              await syncUserRoleAssignment(userData.id, roleToAssign.id, roleToAssign.name);
              roleSynced = true;
            }
          }

          // Link staff to user account
          await supabase
            .from('staff')
            .update({ user_account_id: userData.id })
            .eq('id', createdStaff.id);

          userAccountIdForSync = userData.id;

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
      
      if (!roleSynced && userAccountIdForSync && selectedRoleRecord) {
        await syncUserRoleAssignment(userAccountIdForSync, selectedRoleRecord.id, selectedRoleRecord.name);
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
        },
        use_default_schedule: true,
        work_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        time_in: '',
        time_out: '',
        break_start: '',
        break_end: ''
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
    if (isEditMode) return;
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
    if (isEditMode) return;
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h1>
                <p className="text-gray-600">
                  {isEditMode 
                    ? 'Update staff member information and optionally register face' 
                    : 'Create a new staff member and optionally a user account'}
                </p>
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
                      if (isEditMode) return;
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
                    disabled={isEditMode}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } ${isEditMode ? 'bg-gray-100 text-gray-500' : ''}`}
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
                        if (isEditMode) return;
                        setForm(prev => ({ ...prev, employee_id: e.target.value }));
                        if (errors.employee_id === 'A staff member with this employee ID already exists') {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.employee_id;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={(e) => checkEmployeeIdDuplicate(e.target.value)}
                      disabled={autoGenerateId || isEditMode}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.employee_id ? 'border-red-300' : 'border-gray-300'
                      } ${(autoGenerateId || isEditMode) ? 'bg-gray-100 text-gray-500' : ''}`}
                      placeholder={autoGenerateId || isEditMode ? 'Auto-generated' : 'Enter employee ID'}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditMode) return;
                      setAutoGenerateId(!autoGenerateId);
                      if (!autoGenerateId) {
                        setForm(prev => ({ ...prev, employee_id: generateEmployeeId() }));
                      } else {
                        setForm(prev => ({ ...prev, employee_id: '' }));
                      }
                    }}
                    disabled={isEditMode}
                    className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  onChange={(e) => {
                    const newPosition = e.target.value;
                    setForm((prev: StaffFormData) => ({
                      ...prev,
                      position: newPosition,
                      role: newPosition || prev.role,
                      accountDetails: {
                        ...prev.accountDetails,
                        role: prev.createUserAccount && newPosition ? newPosition : prev.accountDetails.role
                      }
                    }));
                  }}
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
                  <option value="Part-time">Part-time</option>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Schedule
                </label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Use default company schedule</p>
                      <p className="text-xs text-gray-500">Disable to customize this staff member&apos;s working days and hours.</p>
                    </div>
                    <label className="inline-flex items-center gap-2">
                      <span className="text-sm text-gray-600">Default</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.use_default_schedule}
                          onChange={(e) => handleUseDefaultScheduleToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:bg-blue-600"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </div>
                      <span className="text-sm text-gray-600">Custom</span>
                    </label>
                  </div>

                  {form.use_default_schedule ? (
                    <p className="mt-3 text-sm text-gray-600">
                      This staff member will follow the default branch/company work schedule.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Work Days</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {WORK_DAYS.map(day => {
                            const active = form.work_days.includes(day);
                            return (
                              <label
                                key={day}
                                className={`px-3 py-1 rounded-full border cursor-pointer text-sm transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={active}
                                  onChange={() => handleWorkDayToggle(day)}
                                />
                                {day}
                              </label>
                            );
                          })}
                        </div>
                        {errors.work_days && (
                          <p className="mt-2 text-sm text-red-600">{errors.work_days}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time In *
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="time"
                              value={form.time_in}
                              onChange={(e) => {
                                const value = e.target.value;
                                setForm(prev => ({ ...prev, time_in: value }));
                                setErrors(prev => {
                                  if (!prev.time_in) return prev;
                                  const newErrors = { ...prev };
                                  delete newErrors.time_in;
                                  return newErrors;
                                });
                              }}
                              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.time_in ? 'border-red-300' : 'border-gray-300'}`}
                            />
                          </div>
                          {errors.time_in && (
                            <p className="mt-2 text-sm text-red-600">{errors.time_in}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Out *
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="time"
                              value={form.time_out}
                              onChange={(e) => {
                                const value = e.target.value;
                                setForm(prev => ({ ...prev, time_out: value }));
                                setErrors(prev => {
                                  if (!prev.time_out) return prev;
                                  const newErrors = { ...prev };
                                  delete newErrors.time_out;
                                  return newErrors;
                                });
                              }}
                              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.time_out ? 'border-red-300' : 'border-gray-300'}`}
                            />
                          </div>
                          {errors.time_out && (
                            <p className="mt-2 text-sm text-red-600">{errors.time_out}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Break Start (optional)
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="time"
                              value={form.break_start}
                              onChange={(e) => setForm(prev => ({ ...prev, break_start: e.target.value }))}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Break End (optional)
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="time"
                              value={form.break_end}
                              onChange={(e) => setForm(prev => ({ ...prev, break_end: e.target.value }))}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

          {/* Face Registration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Face Registration {isEditMode ? '(Optional)' : '(Optional)'}
            </h3>
            
            <div className="space-y-4">
              {existingFaceData && !showFaceRegistration && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">
                        Face is already registered for this staff member
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFaceRegistration(true)}
                      className="text-sm text-green-700 hover:text-green-900 underline"
                    >
                      Re-register
                    </button>
                  </div>
                </div>
              )}
              
              {!existingFaceData && !showFaceRegistration && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 mb-3">
                    Register the staff member's face for attendance tracking using facial recognition.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFaceRegistration(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Register Face</span>
                  </button>
                </div>
              )}
              
              {showFaceRegistration && (
                <FaceRegistration
                  staffId={isEditMode ? initialData?.id : undefined}
                  branchId={form.branch_id}
                  staffName={isEditMode ? `${form.first_name} ${form.last_name}` : undefined}
                  existingFaceData={existingFaceData}
                  onFaceRegistered={(data) => {
                    setFaceData(data);
                    setShowFaceRegistration(false);
                    if (isEditMode && initialData?.id) {
                      setExistingFaceData(data);
                    }
                  }}
                  onCancel={() => setShowFaceRegistration(false)}
                />
              )}
              
              {faceData && !showFaceRegistration && !existingFaceData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">
                        Face registered successfully {isEditMode ? '' : '(will be saved when staff is created)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFaceRegistration(true)}
                      className="text-sm text-green-700 hover:text-green-900 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
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
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((prev: StaffFormData) => ({
                      ...prev,
                      createUserAccount: checked,
                      accountDetails: {
                        ...prev.accountDetails,
                        role: checked && prev.position ? prev.position : prev.accountDetails.role
                      }
                    }));
                  }}
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
              <span>
                {loading
                  ? (isEditMode ? 'Updating...' : 'Creating...')
                  : (isEditMode ? 'Update Staff Member' : 'Create Staff Member')}
              </span>
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



















