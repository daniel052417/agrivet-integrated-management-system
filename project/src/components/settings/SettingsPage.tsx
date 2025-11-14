import React, { useEffect, useState } from 'react';
import { 
  Settings, Lock, Bell, Mail, Shield, Upload, 
  Save, RefreshCw, Monitor, 
  MapPin, Phone, Building, X, Search, Plus,
  Palette, AlertTriangle, CheckCircle, Trash2,
  FileText, Edit3, Ban,
  TestTube, ShieldCheck, Activity, Settings2, User,
  Clock, DollarSign, Calendar, BarChart3, Users, LogOut,
  Eye, Key, ShoppingCart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { settingsService } from '../../lib/settingsService';
import { simplifiedAuth } from '../../lib/simplifiedAuth';
import { 
  branchManagementService, 
  Branch, 
  ManagerCandidate, 
  AttendanceSecuritySettings 
} from '../../lib/branchManagementService';
import { posTerminalManagementService, POSTerminal, UserCandidate } from '../../lib/posTerminalManagementService';
import { 
  attendanceTerminalDeviceService,
  AttendanceTerminalDevice,
  AttendanceTerminalActivityLog
} from '../../lib/attendanceTerminalDeviceService';
import {
  attendanceTerminalOTPService,
  AttendanceTerminalOTPLog
} from '../../lib/attendanceTerminalOTPService';

const SettingsPage: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Manila');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showTestNotification, setShowTestNotification] = useState(false);

  // App settings state
  const [appName, setAppName] = useState('AGRIVET Admin Dashboard');
  const [companyName, setCompanyName] = useState('AGRIVET Supply Co.');
  const [contactEmail, setContactEmail] = useState('admin@agrivet.com');
  const [supportPhone, setSupportPhone] = useState('+63 2 8123 4567');
  const [companyAddress, setCompanyAddress] = useState('123 Business St, Manila, Philippines');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#3B82F6');
  const [currency, setCurrency] = useState('PHP');
  const [showTooltips, setShowTooltips] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [receiptHeader, setReceiptHeader] = useState('Thank you for your business!');
  const [receiptFooter, setReceiptFooter] = useState('Visit us again soon!');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [receiptNumberPrefix, setReceiptNumberPrefix] = useState('RCP');
  const [defaultBranch, setDefaultBranch] = useState<string>('');
  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; name: string }>>([]);

  // Security settings state
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(15);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [requireMFA, setRequireMFA] = useState(false);
  const [mfaAppliesTo, setMfaAppliesTo] = useState({
    superAdmin: true,
    cashier: true
  });
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true);
  const [passwordRequireMixedCase, setPasswordRequireMixedCase] = useState(false);
  const [allowLoginOnlyVerifiedBrowsers, setAllowLoginOnlyVerifiedBrowsers] = useState(false);
  const [notifyOwnerOnNewDevice, setNotifyOwnerOnNewDevice] = useState(false);

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [dailySalesSummary, setDailySalesSummary] = useState(false);
  const [attendanceAlerts, setAttendanceAlerts] = useState(false);
  const [bccManager, setBccManager] = useState(true);
  const [managerEmail, setManagerEmail] = useState('manager@agrivet.com');
  const [dailySummaryRecipients, setDailySummaryRecipients] = useState<string[]>([]);

  // HR Management Settings State
  const [enableDeductionForAbsences, setEnableDeductionForAbsences] = useState(true);
  const [enableOvertimeTracking, setEnableOvertimeTracking] = useState(true);
  const [autoMarkLateEmployees, setAutoMarkLateEmployees] = useState(true);
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(15);
  const [includeAllowanceInPay, setIncludeAllowanceInPay] = useState(true);
  const [enableTaxComputation, setEnableTaxComputation] = useState(true);
  const [includeSSSDeductions, setIncludeSSSDeductions] = useState(true);
  const [includePhilHealthDeductions, setIncludePhilHealthDeductions] = useState(true);
  const [includePagIBIGDeductions, setIncludePagIBIGDeductions] = useState(true);
  const [payrollPeriod, setPayrollPeriod] = useState('semi-monthly');
  const [enableLeaveManagement, setEnableLeaveManagement] = useState(true);
  const [maxLeaveDaysPerMonth, setMaxLeaveDaysPerMonth] = useState(2);
  const [requireLeaveApproval, setRequireLeaveApproval] = useState(true);
  const [enableHRReportsDashboard, setEnableHRReportsDashboard] = useState(true);
  const [includeAttendanceSummary, setIncludeAttendanceSummary] = useState(true);
  const [enablePerformanceReviews, setEnablePerformanceReviews] = useState(false);
  const [enableEmployeeSelfService, setEnableEmployeeSelfService] = useState(true);

  // Branch management state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [managerCandidates, setManagerCandidates] = useState<ManagerCandidate[]>([]);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  
  // Attendance Terminal Security state
  const [selectedBranchForSecurity, setSelectedBranchForSecurity] = useState<string | null>(null);
  const [branchDevices, setBranchDevices] = useState<AttendanceTerminalDevice[]>([]);
  const [branchActivityLogs, setBranchActivityLogs] = useState<AttendanceTerminalActivityLog[]>([]);
  const [branchOTPLogs, setBranchOTPLogs] = useState<AttendanceTerminalOTPLog[]>([]);
  const [allOTPLogs, setAllOTPLogs] = useState<AttendanceTerminalOTPLog[]>([]);
  const [registeredDeviceUuids, setRegisteredDeviceUuids] = useState<Set<string>>(new Set());
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showBranchSelectionModal, setShowBranchSelectionModal] = useState(false);
  const [selectedOTPLogForRegistration, setSelectedOTPLogForRegistration] = useState<AttendanceTerminalOTPLog | null>(null);
  const [selectedBranchForRegistration, setSelectedBranchForRegistration] = useState<string>('');
  const [showActivityLogsModal, setShowActivityLogsModal] = useState(false);
  const [deviceFormData, setDeviceFormData] = useState({
    device_name: '',
    device_uuid: '', // Stable UUID (preferred)
    device_fingerprint: '', // Fallback for manual entry
    device_type: 'kiosk' as 'desktop' | 'laptop' | 'tablet' | 'kiosk'
  });
  const [activityLogsFilters, setActivityLogsFilters] = useState({
    action_type: '',
    status: '',
    start_date: '',
    end_date: ''
  });
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    type: 'main' as 'main' | 'satellite',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    operatingHours: {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '18:00', isOpen: true },
      saturday: { open: '08:00', close: '18:00', isOpen: true },
      sunday: { open: '08:00', close: '18:00', isOpen: false }
    },
    managerId: '',
    status: 'active' as 'active' | 'inactive',
    // Attendance Terminal Security Fields
    latitude: null as number | null,
    longitude: null as number | null,
    attendancePin: '',
    attendanceSecuritySettings: {
      enableDeviceVerification: false,
      enableGeoLocationVerification: false,
      enablePinAccessControl: false,
      geoLocationToleranceMeters: 100,
      requirePinForEachSession: false,
      pinSessionDurationHours: 24,
      enableActivityLogging: true
    } as AttendanceSecuritySettings,
    // POS Device Access
    allow_attendance_device_for_pos: false
  });
  
  // Branch settings state
  const [branchSettings, setBranchSettings] = useState({
    allowInterBranchTransfers: false,
    shareInventoryAcrossBranches: false,
    enableBranchSpecificPricing: false,
    allow_device_registration: false
  });

  // POS Terminal management state
  const [posTerminals, setPosTerminals] = useState<POSTerminal[]>([]);
  const [userCandidates, setUserCandidates] = useState<UserCandidate[]>([]);
  const [editingTerminal, setEditingTerminal] = useState<POSTerminal | null>(null);
  const [showAddTerminalModal, setShowAddTerminalModal] = useState(false);
  const [terminalFormData, setTerminalFormData] = useState({
    terminal_name: '',
    terminal_code: '',
    branch_id: '',
    status: 'active' as 'active' | 'inactive',
    assigned_user_id: '',
    notes: ''
  });
  const [posSettings, setPosSettings] = useState({
    // Standard POS Configuration
    defaultTaxRate: 12,
    lowStockThreshold: 10,
    receiptPrefix: 'RCP',
    autoPrintReceipt: true,
    enableInventoryDeduction: true,
    enableAuditLog: true,
    enableReceiptNumbering: true,
    
    // POS User Permissions
    allowPriceOverride: true,
    requireManagerApprovalForPriceOverride: true,
    restrictVoidTransactionsToAdmin: true,
    requireLoginForTransactions: true,
    requireShiftStartEnd: true,
    requireCashCountAtEndShift: true,
    
    // Payments
    allowedPaymentMethods: ['cash', 'gcash'] as string[],
    enableMultiPayment: false,
    
    // Hardware Settings
    receiptPrinter: '',
    openDrawerOnPayment: true,
    enableScannerSupport: true,
    cameraForAttendanceTerminal: 'laptop' as 'usb' | 'laptop',
    
    // Connectivity
    showInternetConnectionWarning: true,
    disableTransactionsWhenOffline: false,
    
    // Advanced Settings
    maxOfflineGracePeriod: 30, // minutes
    autoLockPosAfterInactivity: 15 // minutes
  });

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Settings2,
      description: 'Business info, branding, and system preferences',
      bgColor: 'bg-blue-50',
      color: 'text-blue-600'
    },
    {
      id: 'security',
      title: 'Security & Access',
      icon: Shield,
      description: 'Authentication, permissions, and access control',
      bgColor: 'bg-red-50',
      color: 'text-red-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Email, SMS, and push notification preferences',
      bgColor: 'bg-yellow-50',
      color: 'text-yellow-600'
    },
    {
      id: 'hr',
      title: 'HR Management',
      icon: Users,
      description: 'Attendance, payroll, and employee settings',
      bgColor: 'bg-purple-50',
      color: 'text-purple-600'
    },
    {
      id: 'branches',
      title: 'Branch Management',
      icon: Building,
      description: 'Multi-location settings and permissions',
      bgColor: 'bg-orange-50',
      color: 'text-orange-600'
    },
    {
      id: 'pos',
      title: 'POS Terminal',
      icon: Monitor,
      description: 'Point of sale terminal configurations',
      bgColor: 'bg-teal-50',
      color: 'text-teal-600'
    }
  ];

  const [activeSection, setActiveSection] = useState('general');

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
    fetchBranches();
    if (activeSection === 'branches') {
      fetchAllBranches();
      fetchManagerCandidates();
      fetchBranchSettings();
      fetchAllOTPLogs(); // Fetch all OTP logs when branches section is active
    }
    if (activeSection === 'pos') {
      fetchAllTerminals();
      fetchUserCandidates();
    }
  }, [activeSection]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setAvailableBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchAllBranches = async () => {
    try {
      setLoading(true);
      const data = await branchManagementService.getAllBranches();
      setBranches(data);
    } catch (error: any) {
      console.error('Error fetching all branches:', error);
      setError(error.message || 'Failed to fetch branches');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerCandidates = async () => {
    try {
      const data = await branchManagementService.getManagerCandidates();
      setManagerCandidates(data);
    } catch (error: any) {
      console.error('Error fetching manager candidates:', error);
    }
  };

  const fetchBranchSettings = async () => {
    try {
      const settings = await branchManagementService.getBranchSettings();
      setBranchSettings(settings);
    } catch (error: any) {
      console.error('Error fetching branch settings:', error);
    }
  };

  const fetchAllTerminals = async () => {
    try {
      setLoading(true);
      const data = await posTerminalManagementService.getAllTerminals();
      setPosTerminals(data);
    } catch (error: any) {
      console.error('Error fetching all terminals:', error);
      setError(error.message || 'Failed to fetch terminals');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCandidates = async () => {
    try {
      const data = await posTerminalManagementService.getUserCandidates();
      setUserCandidates(data);
    } catch (error: any) {
      console.error('Error fetching user candidates:', error);
    }
  };

  // Attendance Terminal Security Functions
  const fetchBranchDevices = async (branchId: string) => {
    try {
      setLoading(true);
      const devices = await attendanceTerminalDeviceService.getBranchDevices(branchId);
      setBranchDevices(devices);
    } catch (error: any) {
      console.error('Error fetching branch devices:', error);
      setError(error.message || 'Failed to fetch devices');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchActivityLogs = async (branchId: string, limit: number = 100) => {
    try {
      setLoading(true);
      const { logs } = await attendanceTerminalDeviceService.getBranchActivityLogs(branchId, limit, 0);
      setBranchActivityLogs(logs);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      setError(error.message || 'Failed to fetch activity logs');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchOTPLogs = async (branchId: string, limit: number = 100) => {
    try {
      setLoading(true);
      const { logs } = await attendanceTerminalOTPService.getOTPLogs(branchId, limit, 0);
      setBranchOTPLogs(logs);
    } catch (error: any) {
      console.error('Error fetching OTP logs:', error);
      setError(error.message || 'Failed to fetch OTP logs');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOTPLogs = async (limit: number = 100) => {
    try {
      setLoading(true);
      const { logs } = await attendanceTerminalOTPService.getAllOTPLogs(limit, 0);
      
      // Get all registered devices to check which OTPs have already been registered
      const allDevices = await attendanceTerminalDeviceService.getAllDevices();
      const registeredUuids = new Set<string>();
      
      allDevices.forEach(device => {
        if (device.device_uuid && device.is_active) {
          registeredUuids.add(device.device_uuid);
        }
      });
      
      setRegisteredDeviceUuids(registeredUuids);
      
      // Filter out verified OTPs that have already been registered
      // Only show pending OTPs and verified OTPs that haven't been registered yet
      const filteredLogs = logs.filter(log => {
        // Always show pending OTPs
        if (log.status === 'pending') {
          return true;
        }
        
        // For verified OTPs, only show if device is not yet registered
        if (log.status === 'verified' && log.device_uuid) {
          return !registeredUuids.has(log.device_uuid);
        }
        
        // Show verified OTPs without device_uuid (shouldn't happen, but just in case)
        if (log.status === 'verified' && !log.device_uuid) {
          return true;
        }
        
        // Show expired/failed OTPs (for reference)
        return log.status === 'expired' || log.status === 'failed';
      });
      
      setAllOTPLogs(filteredLogs);
    } catch (error: any) {
      console.error('Error fetching all OTP logs:', error);
      setError(error.message || 'Failed to fetch OTP logs');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDeviceFromOTP = async (otpLog: AttendanceTerminalOTPLog) => {
    if (!otpLog.device_uuid) {
      setError('Device UUID not available in OTP log. Please request a new OTP.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Show branch selection modal
    setSelectedOTPLogForRegistration(otpLog);
    setSelectedBranchForRegistration('');
    setShowBranchSelectionModal(true);
  };

  const handleConfirmRegisterDeviceFromOTP = async () => {
    if (!selectedOTPLogForRegistration) {
      setError('No OTP log selected for registration.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (!selectedOTPLogForRegistration.device_uuid) {
      setError('Device UUID not available in OTP log. Please request a new OTP.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (!selectedBranchForRegistration) {
      setError('Please select a branch to register the device.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current user
      let currentUser = simplifiedAuth.getCurrentUser();
      let userId: string | null = null;

      if (currentUser) {
        userId = currentUser.id;
      } else {
        // Try to get user from localStorage
        try {
          const storedSession = localStorage.getItem('agrivet_session');
          if (storedSession) {
            const session = JSON.parse(storedSession);
            if (session.userId) {
              userId = session.userId;
              try {
                currentUser = await simplifiedAuth.getUserById(session.userId);
                simplifiedAuth.setCurrentUser(currentUser);
              } catch (err) {
                // Use userId directly
              }
            }
          }
        } catch (err) {
          console.warn('Could not get user from localStorage:', err);
        }

        // Try Supabase auth as fallback
        if (!userId) {
          try {
            const sessionResponse = await supabase.auth.getSession();
            const session = sessionResponse.data?.session;
            if (session?.user) {
              userId = session.user.id;
              try {
                currentUser = await simplifiedAuth.getUserById(session.user.id);
                simplifiedAuth.setCurrentUser(currentUser);
              } catch (err) {
                // Use userId directly
              }
            }
          } catch (err) {
            console.warn('Could not get user from Supabase:', err);
          }
        }
      }

      if (!userId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Get selected branch info
      const selectedBranch = branches.find(b => b.id === selectedBranchForRegistration);
      if (!selectedBranch) {
        throw new Error('Selected branch not found.');
      }

      // Register device using UUID from OTP log (primary identifier)
      // Use the selected branch from the modal, not the OTP log's branch_id
      await attendanceTerminalDeviceService.registerDevice(
        {
          branch_id: selectedBranchForRegistration, // Use selected branch from modal
          device_uuid: selectedOTPLogForRegistration.device_uuid, // Stable UUID (primary identifier)
          device_fingerprint: selectedOTPLogForRegistration.device_fingerprint || 'unknown', // Metadata fingerprint
          device_name: selectedOTPLogForRegistration.device_name || `Device from OTP ${selectedOTPLogForRegistration.otp_code}`,
          device_type: (selectedOTPLogForRegistration.device_type as 'desktop' | 'laptop' | 'tablet' | 'kiosk') || 'kiosk',
          browser_info: selectedOTPLogForRegistration.browser_info || null
        },
        userId
      );

      setSuccess(`Device registered successfully to ${selectedBranch.name}!`);
      
      // Close modal
      setShowBranchSelectionModal(false);
      setSelectedOTPLogForRegistration(null);
      setSelectedBranchForRegistration('');
      
      // Refresh devices if the selected branch matches the security branch
      if (selectedBranchForSecurity === selectedBranchForRegistration) {
        await fetchBranchDevices(selectedBranchForSecurity);
      }
      
            // Refresh all OTP logs to update the display (this will also update registeredDeviceUuids)
            await fetchAllOTPLogs();
            setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error registering device from OTP:', error);
      setError(error.message || 'Failed to register device');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDevice = async () => {
    if (!selectedBranchForSecurity) {
      setError('Please select a branch first');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (!deviceFormData.device_name) {
      setError('Please provide a device name');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // For manual registration, we need either device_uuid or device_fingerprint
    if (!deviceFormData.device_fingerprint && !deviceFormData.device_uuid) {
      setError('Please provide either a device UUID or device fingerprint');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Debug: Log authentication check
      console.log('🔍 Checking user authentication...');

      // Declare variables in outer scope for access later
      let currentUser = simplifiedAuth.getCurrentUser();
      let userId: string | null = null;
      let authSource = 'unknown';
      
      // Method 1: Try to get user from simplifiedAuth service (in-memory)
      if (currentUser) {
        userId = currentUser.id;
        authSource = 'simplifiedAuth (in-memory)';
        console.log('✅ User found in simplifiedAuth (in-memory):', {
          userId: currentUser.id,
          email: currentUser.email,
          role: currentUser.role_name
        });
      } else {
        console.log('⚠️ No user in simplifiedAuth, trying alternative methods...');
        
        // Method 2: Try to get user ID from customAuth (localStorage)
        try {
          const storedSession = localStorage.getItem('agrivet_session');
          if (storedSession) {
            try {
              const session = JSON.parse(storedSession);
              if (session.userId) {
                console.log('✅ Found user ID in customAuth session:', {
                  userId: session.userId
                });
                
                // Try to fetch user profile from database
                try {
                  currentUser = await simplifiedAuth.getUserById(session.userId);
                  simplifiedAuth.setCurrentUser(currentUser);
                  userId = currentUser.id;
                  authSource = 'customAuth (localStorage) → database';
                  console.log('✅ User profile loaded from database via customAuth:', {
                    userId: currentUser.id,
                    email: currentUser.email,
                    role: currentUser.role_name
                  });
                } catch (profileErr: any) {
                  console.warn('⚠️ Could not fetch user profile, using user ID directly:', profileErr);
                  userId = session.userId;
                  authSource = 'customAuth (localStorage)';
                }
              }
            } catch (parseErr: any) {
              console.warn('⚠️ Could not parse customAuth session:', parseErr);
            }
          }
        } catch (customAuthErr: any) {
          console.warn('⚠️ Error checking customAuth:', customAuthErr);
        }

        // Method 3: Try Supabase auth (only if we don't have a user ID yet)
        if (!userId) {
          console.log('⚠️ No user ID from customAuth, trying Supabase auth...');
          
          try {
            // Try session first (non-blocking)
            const sessionResponse = await supabase.auth.getSession();
            const session = sessionResponse.data?.session;
            
            if (session?.user) {
              console.log('✅ Supabase session found:', {
                userId: session.user.id,
                email: session.user.email
              });
              
              try {
                currentUser = await simplifiedAuth.getUserById(session.user.id);
                simplifiedAuth.setCurrentUser(currentUser);
                userId = currentUser.id;
                authSource = 'Supabase session → database';
                console.log('✅ User profile loaded from database via Supabase session:', {
                  userId: currentUser.id,
                  email: currentUser.email,
                  role: currentUser.role_name
                });
              } catch (profileErr: any) {
                console.warn('⚠️ Could not fetch user profile, using Supabase user ID:', profileErr);
                userId = session.user.id;
                authSource = 'Supabase session';
              }
            } else {
              console.log('⚠️ No Supabase session found');
            }
          } catch (supabaseErr: any) {
            console.warn('⚠️ Supabase auth check failed (non-blocking):', supabaseErr.message);
            // Don't throw - Supabase auth is optional
          }
        }
      }

      // Final check - we need at least a user ID
      if (!userId) {
        console.error('❌ No user ID found after all authentication attempts');
        console.error('❌ Tried: simplifiedAuth, customAuth (localStorage), Supabase session');
        throw new Error('User not authenticated. Please log in again to continue.');
      }
      
      console.log('✅ User authenticated successfully:', {
        userId: userId,
        email: currentUser?.email || 'unknown',
        role: currentUser?.role_name || 'unknown',
        hasFullProfile: !!currentUser,
        authSource: authSource
      });

      // Generate browser info
      const browserInfo = {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform
      };

      // Debug: Log device registration attempt
      console.log('🔄 Registering device...', {
        branchId: selectedBranchForSecurity,
        deviceName: deviceFormData.device_name,
        deviceType: deviceFormData.device_type,
        fingerprint: deviceFormData.device_fingerprint.substring(0, 20) + '...', // First 20 chars only for security
        registeredBy: userId
      });

      // Use device_uuid if provided, otherwise generate one
      const deviceUuid = deviceFormData.device_uuid || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
      const deviceFingerprint = deviceFormData.device_fingerprint || 'manual-entry-' + Date.now();
      
      const registeredDevice = await attendanceTerminalDeviceService.registerDevice(
        {
          branch_id: selectedBranchForSecurity,
          device_uuid: deviceUuid,
          device_fingerprint: deviceFingerprint,
          device_name: deviceFormData.device_name,
          device_type: deviceFormData.device_type,
          browser_info: browserInfo
        },
        userId
      );

      // Debug: Log successful registration from UI
      console.log('✅ Device registration completed successfully in UI!', {
        deviceId: registeredDevice.id,
        deviceName: registeredDevice.device_name,
        branchId: registeredDevice.branch_id,
        branchName: registeredDevice.branch?.name,
        registeredAt: registeredDevice.registered_at
      });

      setSuccess('Device registered successfully!');
      setShowDeviceModal(false);
      setDeviceFormData({
        device_name: '',
        device_uuid: '',
        device_fingerprint: '',
        device_type: 'kiosk'
      });
      await fetchBranchDevices(selectedBranchForSecurity);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      // Debug: Log registration error
      console.error('❌ Device registration failed in UI:', {
        error: error.message,
        branchId: selectedBranchForSecurity,
        deviceName: deviceFormData.device_name,
        deviceType: deviceFormData.device_type,
        errorDetails: error
      });
      
      setError(error.message || 'Failed to register device');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceFingerprint = (): string => {
    // Generate a simple fingerprint based on browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Device fingerprint', 2, 2);
    const canvasFingerprint = canvas.toDataURL();

    const fingerprint = btoa(
      navigator.userAgent +
      navigator.language +
      screen.width + screen.height +
      new Date().getTimezoneOffset() +
      canvasFingerprint
    ).substring(0, 64);

    return fingerprint;
  };

  const fetchSettings = async () => {
    try {
      const s = await settingsService.getAllSettings();

      // Support both sectioned and flat settings
      const g = s.general || {};
      const sec = s.security || {};
      const notif = s.notifications || {};
      const hr = s.hr || {};

      // General
      setAppName((g.appName ?? s.app_name) ?? appName);
      setCompanyName((g.companyName ?? s.company_name) ?? companyName);
      setContactEmail((g.contactEmail ?? s.contact_email) ?? contactEmail);
      setSupportPhone((g.supportPhone ?? s.support_phone) ?? supportPhone);
      setCompanyAddress((g.companyAddress ?? s.company_address) ?? companyAddress);
      setCompanyLogo((g.companyLogo ?? s.company_logo) ?? companyLogo ?? null);
      setBrandColor((g.brandColor ?? s.brand_color) ?? brandColor);
      setCurrency((g.currency ?? s.currency) ?? currency);
      setShowTooltips((g.showTooltips ?? s.show_tooltips) ?? showTooltips);
      setCompactView((g.compactView ?? s.compact_view) ?? compactView);
      setItemsPerPage((g.itemsPerPage ?? s.items_per_page) ?? itemsPerPage);
      setDateFormat((g.dateFormat ?? s.date_format) ?? dateFormat);
      setReceiptHeader((g.receiptHeader ?? s.receipt_header) ?? receiptHeader);
      setReceiptFooter((g.receiptFooter ?? s.receipt_footer) ?? receiptFooter);
      setShowLogoOnReceipt((g.showLogoOnReceipt ?? s.show_logo_on_receipt) ?? showLogoOnReceipt);
      setReceiptNumberPrefix((g.receiptNumberPrefix ?? s.receipt_number_prefix) ?? receiptNumberPrefix);
      // Handle defaultBranch - can be UUID or 'main' string, convert 'main' to empty string
      const branchValue = (g.defaultBranch ?? s.default_branch) ?? '';
      setDefaultBranch(branchValue === 'main' ? '' : branchValue);

      // Security
      setSessionTimeout((sec.sessionTimeout ?? s.session_timeout) ?? sessionTimeout);
      setLoginAttempts((sec.loginAttempts ?? s.login_attempts) ?? loginAttempts);
      setLockoutDuration((sec.lockoutDuration ?? s.lockout_duration) ?? lockoutDuration);
      setRequireEmailVerification((sec.requireEmailVerification ?? s.require_email_verification) ?? requireEmailVerification);
      setRequireMFA((sec.requireMFA ?? s.require_mfa ?? sec.require2FA ?? s.require_2fa) ?? requireMFA);
      // Handle mfaAppliesTo with proper object structure
      // Support both old (owner/admin/manager) and new (superAdmin/cashier) formats
      const loadedMfaAppliesTo = sec.mfaAppliesTo ?? s.mfa_applies_to;
      if (loadedMfaAppliesTo && typeof loadedMfaAppliesTo === 'object') {
        // Check if old format exists (backward compatibility)
        if ('owner' in loadedMfaAppliesTo || 'admin' in loadedMfaAppliesTo || 'manager' in loadedMfaAppliesTo) {
          // Migrate from old format: if any of owner/admin/manager was enabled, enable superAdmin
          const hadOldFormat = loadedMfaAppliesTo.owner || loadedMfaAppliesTo.admin || loadedMfaAppliesTo.manager;
          setMfaAppliesTo({
            superAdmin: loadedMfaAppliesTo.superAdmin ?? hadOldFormat ?? true,
            cashier: loadedMfaAppliesTo.cashier ?? true
          });
        } else {
          // New format
          setMfaAppliesTo({
            superAdmin: loadedMfaAppliesTo.superAdmin ?? true,
            cashier: loadedMfaAppliesTo.cashier ?? true
          });
        }
      }
      setPasswordMinLength((sec.passwordMinLength ?? s.password_min_length) ?? passwordMinLength);
      setPasswordRequireSpecial((sec.passwordRequireSpecial ?? s.password_require_special) ?? passwordRequireSpecial);
      setPasswordRequireMixedCase((sec.passwordRequireMixedCase ?? s.password_require_mixed_case) ?? passwordRequireMixedCase);
      setAllowLoginOnlyVerifiedBrowsers((sec.allowLoginOnlyVerifiedBrowsers ?? s.allow_login_only_verified_browsers) ?? allowLoginOnlyVerifiedBrowsers);
      setNotifyOwnerOnNewDevice((sec.notifyOwnerOnNewDevice ?? s.notify_owner_on_new_device) ?? notifyOwnerOnNewDevice);

      // Notifications
      setEmailNotifications((notif.emailNotifications ?? s.email_notifications) ?? emailNotifications);
      setPushNotifications((notif.pushNotifications ?? s.push_notifications) ?? pushNotifications);
      setLowStockAlerts((notif.lowStockAlerts ?? s.low_stock_alerts) ?? lowStockAlerts);
      setNewOrderAlerts((notif.newOrderAlerts ?? s.new_order_alerts) ?? newOrderAlerts);
      setSystemAlerts((notif.systemAlerts ?? s.system_alerts) ?? systemAlerts);
      setDailySalesSummary((notif.dailySalesSummary ?? s.daily_sales_summary) ?? dailySalesSummary);
      setAttendanceAlerts((notif.attendanceAlerts ?? s.attendance_alerts) ?? attendanceAlerts);
      setBccManager((notif.bccManager ?? s.bcc_manager) ?? bccManager);
      setManagerEmail((notif.managerEmail ?? s.manager_email) ?? managerEmail);
      setDailySummaryRecipients((notif.dailySummaryRecipients ?? s.daily_summary_recipients) ?? []);

      // HR
      setEnableDeductionForAbsences((hr.enableDeductionForAbsences ?? s.enable_deduction_for_absences) ?? enableDeductionForAbsences);
      setEnableOvertimeTracking((hr.enableOvertimeTracking ?? s.enable_overtime_tracking) ?? enableOvertimeTracking);
      setAutoMarkLateEmployees((hr.autoMarkLateEmployees ?? s.auto_mark_late_employees) ?? autoMarkLateEmployees);
      setLateThresholdMinutes((hr.lateThresholdMinutes ?? s.late_threshold_minutes) ?? lateThresholdMinutes);
      setIncludeAllowanceInPay((hr.includeAllowanceInPay ?? s.include_allowance_in_pay) ?? includeAllowanceInPay);
      setEnableTaxComputation((hr.enableTaxComputation ?? s.enable_tax_computation) ?? enableTaxComputation);
      setIncludeSSSDeductions((hr.includeSSSDeductions ?? s.include_sss_deductions) ?? includeSSSDeductions);
      setIncludePhilHealthDeductions((hr.includePhilHealthDeductions ?? s.include_philhealth_deductions) ?? includePhilHealthDeductions);
      setIncludePagIBIGDeductions((hr.includePagIBIGDeductions ?? s.include_pagibig_deductions) ?? includePagIBIGDeductions);
      setPayrollPeriod((hr.payrollPeriod ?? s.payroll_period) ?? payrollPeriod);
      setEnableLeaveManagement((hr.enableLeaveManagement ?? s.enable_leave_management) ?? enableLeaveManagement);
      setMaxLeaveDaysPerMonth((hr.maxLeaveDaysPerMonth ?? s.max_leave_days_per_month) ?? maxLeaveDaysPerMonth);
      setRequireLeaveApproval((hr.requireLeaveApproval ?? s.require_leave_approval) ?? requireLeaveApproval);
      setEnableHRReportsDashboard((hr.enableHRReportsDashboard ?? s.enable_hr_reports_dashboard) ?? enableHRReportsDashboard);
      setIncludeAttendanceSummary((hr.includeAttendanceSummary ?? s.include_attendance_summary) ?? includeAttendanceSummary);
      setEnablePerformanceReviews((hr.enablePerformanceReviews ?? s.enable_performance_reviews) ?? enablePerformanceReviews);
      setEnableEmployeeSelfService((hr.enableEmployeeSelfService ?? s.enable_employee_self_service) ?? enableEmployeeSelfService);

      // Branch Settings (load if available)
      const branchSettings = (s as any).branchSettings || {};
      if (Object.keys(branchSettings).length > 0) {
        setBranchSettings({
          allowInterBranchTransfers: branchSettings.allowInterBranchTransfers || false,
          shareInventoryAcrossBranches: branchSettings.shareInventoryAcrossBranches || false,
          enableBranchSpecificPricing: branchSettings.enableBranchSpecificPricing || false,
          allow_device_registration: branchSettings.allow_device_registration || false
        });
      }

      // POS Settings (load if available)
      const pos = (s as any).pos || {};
      if (Object.keys(pos).length > 0) {
        setPosSettings({
          defaultTaxRate: pos.defaultTaxRate ?? 12,
          lowStockThreshold: pos.lowStockThreshold ?? 10,
          receiptPrefix: pos.receiptPrefix ?? 'RCP',
          autoPrintReceipt: pos.autoPrintReceipt ?? true,
          enableInventoryDeduction: pos.enableInventoryDeduction ?? true,
          enableAuditLog: pos.enableAuditLog ?? true,
          enableReceiptNumbering: pos.enableReceiptNumbering ?? true,
          allowPriceOverride: pos.allowPriceOverride ?? true,
          requireManagerApprovalForPriceOverride: pos.requireManagerApprovalForPriceOverride ?? true,
          restrictVoidTransactionsToAdmin: pos.restrictVoidTransactionsToAdmin ?? true,
          requireLoginForTransactions: pos.requireLoginForTransactions ?? true,
          requireShiftStartEnd: pos.requireShiftStartEnd ?? true,
          requireCashCountAtEndShift: pos.requireCashCountAtEndShift ?? true,
          allowedPaymentMethods: pos.allowedPaymentMethods ?? ['cash', 'gcash'],
          enableMultiPayment: pos.enableMultiPayment ?? false,
          receiptPrinter: pos.receiptPrinter ?? '',
          openDrawerOnPayment: pos.openDrawerOnPayment ?? true,
          enableScannerSupport: pos.enableScannerSupport ?? true,
          cameraForAttendanceTerminal: pos.cameraForAttendanceTerminal ?? 'laptop',
          showInternetConnectionWarning: pos.showInternetConnectionWarning ?? true,
          disableTransactionsWhenOffline: pos.disableTransactionsWhenOffline ?? false,
          maxOfflineGracePeriod: pos.maxOfflineGracePeriod ?? 30,
          autoLockPosAfterInactivity: pos.autoLockPosAfterInactivity ?? 15
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const settings = {
        general: {
          appName,
          companyName,
          contactEmail,
          supportPhone,
          companyAddress,
          companyLogo,
          brandColor,
          currency,
          showTooltips,
          compactView,
          itemsPerPage,
          dateFormat,
          receiptHeader,
          receiptFooter,
          showLogoOnReceipt,
          receiptNumberPrefix,
          defaultBranch
        },
        security: {
          sessionTimeout,
          loginAttempts,
          lockoutDuration,
          requireEmailVerification,
          requireMFA,
          mfaAppliesTo,
          passwordMinLength,
          passwordRequireSpecial,
          passwordRequireMixedCase,
          allowLoginOnlyVerifiedBrowsers,
          notifyOwnerOnNewDevice
        },
        notifications: {
          emailNotifications,
          pushNotifications,
          lowStockAlerts,
          newOrderAlerts,
          systemAlerts,
          dailySalesSummary,
          attendanceAlerts,
          bccManager,
          managerEmail,
          dailySummaryRecipients
        },
        hr: {
          enableDeductionForAbsences,
          enableOvertimeTracking,
          autoMarkLateEmployees,
          lateThresholdMinutes,
          includeAllowanceInPay,
          enableTaxComputation,
          includeSSSDeductions,
          includePhilHealthDeductions,
          includePagIBIGDeductions,
          payrollPeriod,
          enableLeaveManagement,
          maxLeaveDaysPerMonth,
          requireLeaveApproval,
          enableHRReportsDashboard,
          includeAttendanceSummary,
          enablePerformanceReviews,
          enableEmployeeSelfService
        },
        pos: activeSection === 'pos' ? posSettings : undefined,
        branchSettings: activeSection === 'branches' ? branchSettings : undefined
      };

      // Remove undefined sections if not in the active section
      if (activeSection !== 'branches') {
        delete (settings as any).branchSettings;
      }
      if (activeSection !== 'pos') {
        delete (settings as any).pos;
      }

      await settingsService.updateSettings(settings);
      
      // Save branch settings separately if in branches section
      if (activeSection === 'branches') {
        await branchManagementService.updateBranchSettings(branchSettings);
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, SVG, or WebP image.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('File size exceeds 2MB limit.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      
      // Use a folder path for organization
      const filePath = `settings/${fileName}`;

      let logoUrl = null;
      let uploadError = null;

      // Try multiple buckets in order of preference
      const bucketsToTry = [
        'settings',        // Preferred bucket for settings
        'product-images',  // Fallback to existing bucket
        'public'           // Last resort
      ];

      for (const bucketName of bucketsToTry) {
        try {
          const { data: uploadData, error: bucketError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!bucketError && uploadData) {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            logoUrl = urlData.publicUrl;
            uploadError = null;
            console.log(`✅ Logo uploaded successfully to ${bucketName} bucket`);
            break; // Success, exit loop
          } else {
            uploadError = bucketError;
            console.log(`⚠️ Failed to upload to ${bucketName}: ${bucketError?.message}`);
          }
        } catch (err: any) {
          uploadError = err;
          console.log(`⚠️ Error with ${bucketName} bucket: ${err.message}`);
        }
      }

      // If all buckets failed, show helpful error
      if (!logoUrl) {
        const errorMessage = uploadError?.message || 'Bucket not found';
        throw new Error(
          `${errorMessage}. Please create a 'settings' storage bucket in your Supabase dashboard, ` +
          `or ensure 'product-images' bucket exists. See GENERAL_SETTINGS_REQUIREMENTS.md for setup instructions.`
        );
      }

      // Update the logo state
      setCompanyLogo(logoUrl);

      // Automatically save the logo URL to settings
      try {
        const currentSettings = await settingsService.getAllSettings();
        await settingsService.updateSettings({
          general: {
            ...(currentSettings.general || {}),
            companyLogo: logoUrl
          }
        });
        setSuccess('Logo uploaded and saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (saveError) {
        console.error('Error saving logo URL:', saveError);
        setSuccess('Logo uploaded successfully, but failed to save. Please save settings manually.');
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setError(error.message || 'Failed to upload logo');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      {/* Business Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter app name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Address
            </label>
            <textarea
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Phone
            </label>
            <input
              type="tel"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+63 2 8123 4567"
            />
          </div>

          {/* Business Logo Upload */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Logo
            </label>
            <div className="flex items-center space-x-4">
              {companyLogo && (
                <div className="relative">
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="h-20 w-20 object-contain border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={async () => {
                      setCompanyLogo(null);
                      // Automatically save the removal
                      try {
                        const currentSettings = await settingsService.getAllSettings();
                        await settingsService.updateSettings({
                          general: {
                            ...(currentSettings.general || {}),
                            companyLogo: null
                          }
                        });
                        setSuccess('Logo removed successfully!');
                        setTimeout(() => setSuccess(null), 3000);
                      } catch (error) {
                        console.error('Error removing logo:', error);
                        setError('Failed to save logo removal. Please save settings manually.');
                        setTimeout(() => setError(null), 5000);
                      }
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Remove logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, SVG (MAX. 2MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Preferences Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">System Preferences</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PHP">Philippine Peso (₱)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="JPY">Japanese Yen (¥)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items Per Page
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Branch for Admin Dashboard
            </label>
            <select
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a branch</option>
              {availableBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Color <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={showTooltips}
              onChange={(e) => setShowTooltips(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show tooltips <span className="text-gray-400 text-xs">(Optional)</span></span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={compactView}
              onChange={(e) => setCompactView(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Compact view mode <span className="text-gray-400 text-xs">(Optional)</span></span>
          </label>
        </div>
      </div>

      {/* Receipt Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Receipt Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Header Message
            </label>
            <input
              type="text"
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Thank you for your business!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Footer Message
            </label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Visit us again soon!"
            />
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showLogoOnReceipt}
                onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Show Business Logo on Receipt</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Number Prefix <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={receiptNumberPrefix}
              onChange={(e) => setReceiptNumberPrefix(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="RCP"
              maxLength={10}
            />
            <p className="mt-1 text-xs text-gray-500">Used to prefix receipt numbers (e.g., RCP-001, RCP-002)</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Branch Management Functions
  const handleCreateBranch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!branchFormData.name || !branchFormData.code || !branchFormData.address || !branchFormData.city || !branchFormData.province) {
        throw new Error('Please fill in all required fields (Name, Code, Address, City, Province)');
      }

      // Convert form operating hours to database format (only include open days)
      const dbOperatingHours: any = {};
      Object.keys(branchFormData.operatingHours).forEach((day) => {
        const dayData = branchFormData.operatingHours[day as keyof typeof branchFormData.operatingHours];
        if (dayData.isOpen) {
          dbOperatingHours[day] = {
            open: dayData.open,
            close: dayData.close
          };
        }
      });

      await branchManagementService.createBranch({
        name: branchFormData.name,
        code: branchFormData.code,
        address: branchFormData.address,
        city: branchFormData.city,
        province: branchFormData.province,
        postal_code: branchFormData.postalCode || undefined,
        phone: branchFormData.phone || undefined,
        email: branchFormData.email || undefined,
        manager_id: branchFormData.managerId || undefined,
        is_active: branchFormData.status === 'active',
        operating_hours: Object.keys(dbOperatingHours).length > 0 ? dbOperatingHours : null,
        branch_type: branchFormData.type,
        // Attendance Terminal Security Fields
        latitude: branchFormData.latitude || null,
        longitude: branchFormData.longitude || null,
        attendance_pin: branchFormData.attendancePin || undefined,
        attendance_security_settings: branchFormData.attendanceSecuritySettings,
        // POS Device Access
        allow_attendance_device_for_pos: branchFormData.allow_attendance_device_for_pos
      });

      setSuccess('Branch created successfully!');
      setShowAddBranchModal(false);
      resetBranchForm();
      await fetchAllBranches();
      await fetchBranches(); // Refresh dropdown
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to create branch');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!branchFormData.name || !branchFormData.code || !branchFormData.address || !branchFormData.city || !branchFormData.province) {
        throw new Error('Please fill in all required fields (Name, Code, Address, City, Province)');
      }

      // Convert form operating hours to database format (only include open days)
      const dbOperatingHours: any = {};
      Object.keys(branchFormData.operatingHours).forEach((day) => {
        const dayData = branchFormData.operatingHours[day as keyof typeof branchFormData.operatingHours];
        if (dayData.isOpen) {
          dbOperatingHours[day] = {
            open: dayData.open,
            close: dayData.close
          };
        }
      });

      await branchManagementService.updateBranch({
        id: editingBranch.id,
        name: branchFormData.name,
        code: branchFormData.code,
        address: branchFormData.address,
        city: branchFormData.city,
        province: branchFormData.province,
        postal_code: branchFormData.postalCode || undefined,
        phone: branchFormData.phone || undefined,
        email: branchFormData.email || undefined,
        manager_id: branchFormData.managerId || undefined,
        is_active: branchFormData.status === 'active',
        operating_hours: Object.keys(dbOperatingHours).length > 0 ? dbOperatingHours : null,
        branch_type: branchFormData.type,
        // Attendance Terminal Security Fields
        latitude: branchFormData.latitude || null,
        longitude: branchFormData.longitude || null,
        attendance_pin: branchFormData.attendancePin || undefined,
        attendance_security_settings: branchFormData.attendanceSecuritySettings,
        // POS Device Access
        allow_attendance_device_for_pos: branchFormData.allow_attendance_device_for_pos
      });

      setSuccess('Branch updated successfully!');
      setShowAddBranchModal(false);
      setEditingBranch(null);
      resetBranchForm();
      await fetchAllBranches();
      await fetchBranches(); // Refresh dropdown
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update branch');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('Are you sure you want to deactivate this branch? This will set it as inactive.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await branchManagementService.deleteBranch(branchId);
      setSuccess('Branch deactivated successfully!');
      await fetchAllBranches();
      await fetchBranches(); // Refresh dropdown
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete branch');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    
    // Convert database operating hours (open/close) to form format (with isOpen flag for all days)
    const dbHours = branch.operating_hours || {};
    const formHours: any = {
      monday: { open: '08:00', close: '18:00', isOpen: false },
      tuesday: { open: '08:00', close: '18:00', isOpen: false },
      wednesday: { open: '08:00', close: '18:00', isOpen: false },
      thursday: { open: '08:00', close: '18:00', isOpen: false },
      friday: { open: '08:00', close: '18:00', isOpen: false },
      saturday: { open: '08:00', close: '18:00', isOpen: false },
      sunday: { open: '08:00', close: '18:00', isOpen: false }
    };
    
    // Populate form hours from database hours
    Object.keys(formHours).forEach((day) => {
      const dbDayData = dbHours[day as keyof typeof dbHours];
      if (dbDayData && typeof dbDayData === 'object' && 'open' in dbDayData && 'close' in dbDayData) {
        formHours[day] = {
          open: dbDayData.open,
          close: dbDayData.close,
          isOpen: true
        };
      }
    });
    
    // Get default security settings if not set
    const defaultSecuritySettings: AttendanceSecuritySettings = {
      enableDeviceVerification: false,
      enableGeoLocationVerification: false,
      enablePinAccessControl: false,
      geoLocationToleranceMeters: 100,
      requirePinForEachSession: false,
      pinSessionDurationHours: 24,
      enableActivityLogging: true
    };

    setBranchFormData({
      name: branch.name,
      code: branch.code,
      type: branch.branch_type,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      postalCode: branch.postal_code || '',
      phone: branch.phone || '',
      email: branch.email || '',
      operatingHours: formHours,
      managerId: branch.manager_id || '',
      status: branch.is_active ? 'active' : 'inactive',
      // Attendance Terminal Security Fields
      latitude: branch.latitude || null,
      longitude: branch.longitude || null,
      attendancePin: branch.attendance_pin || '',
      attendanceSecuritySettings: branch.attendance_security_settings || defaultSecuritySettings,
      // POS Device Access
      allow_attendance_device_for_pos: branch.allow_attendance_device_for_pos || false
    });
    setShowAddBranchModal(true);
  };

  const resetBranchForm = () => {
    setBranchFormData({
      name: '',
      code: '',
      type: 'main',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
      operatingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '18:00', isOpen: true },
        sunday: { open: '08:00', close: '18:00', isOpen: false }
      },
      managerId: '',
      status: 'active',
      // Attendance Terminal Security Fields
      latitude: null,
      longitude: null,
      attendancePin: '',
      attendanceSecuritySettings: {
        enableDeviceVerification: false,
        enableGeoLocationVerification: false,
        enablePinAccessControl: false,
        geoLocationToleranceMeters: 100,
        requirePinForEachSession: false,
        pinSessionDurationHours: 24,
        enableActivityLogging: true
      },
      // POS Device Access
      allow_attendance_device_for_pos: false
    });
    setEditingBranch(null);
  };

  // POS Terminal Management Functions
  const handleCreateTerminal = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!terminalFormData.terminal_name || !terminalFormData.terminal_code || !terminalFormData.branch_id) {
        throw new Error('Please fill in all required fields (Terminal Name, Terminal Code, Branch)');
      }

      await posTerminalManagementService.createTerminal({
        terminal_name: terminalFormData.terminal_name,
        terminal_code: terminalFormData.terminal_code,
        branch_id: terminalFormData.branch_id,
        status: terminalFormData.status,
        assigned_user_id: terminalFormData.assigned_user_id || undefined,
        notes: terminalFormData.notes || undefined
      });

      setSuccess('Terminal created successfully!');
      setShowAddTerminalModal(false);
      resetTerminalForm();
      await fetchAllTerminals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to create terminal');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTerminal = async () => {
    if (!editingTerminal) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!terminalFormData.terminal_name || !terminalFormData.terminal_code || !terminalFormData.branch_id) {
        throw new Error('Please fill in all required fields (Terminal Name, Terminal Code, Branch)');
      }

      await posTerminalManagementService.updateTerminal({
        id: editingTerminal.id,
        terminal_name: terminalFormData.terminal_name,
        terminal_code: terminalFormData.terminal_code,
        branch_id: terminalFormData.branch_id,
        status: terminalFormData.status,
        assigned_user_id: terminalFormData.assigned_user_id || undefined,
        notes: terminalFormData.notes || undefined
      });

      setSuccess('Terminal updated successfully!');
      setShowAddTerminalModal(false);
      setEditingTerminal(null);
      resetTerminalForm();
      await fetchAllTerminals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update terminal');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerminal = async (terminalId: string) => {
    if (!confirm('Are you sure you want to deactivate this terminal? This will set it as inactive.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await posTerminalManagementService.deleteTerminal(terminalId);
      setSuccess('Terminal deactivated successfully!');
      await fetchAllTerminals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete terminal');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTerminal = (terminal: POSTerminal) => {
    setEditingTerminal(terminal);
    setTerminalFormData({
      terminal_name: terminal.terminal_name,
      terminal_code: terminal.terminal_code,
      branch_id: terminal.branch_id,
      status: terminal.status,
      assigned_user_id: terminal.assigned_user_id || '',
      notes: terminal.notes || ''
    });
    setShowAddTerminalModal(true);
  };

  const resetTerminalForm = () => {
    setTerminalFormData({
      terminal_name: '',
      terminal_code: '',
      branch_id: '',
      status: 'active',
      assigned_user_id: '',
      notes: ''
    });
    setEditingTerminal(null);
  };

  // Custom payment method removal handler
  const removeCustomPaymentMethod = (method: string) => {
    setPosSettings({
      ...posSettings,
      allowedPaymentMethods: posSettings.allowedPaymentMethods.filter(m => m !== method)
    });
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm('Are you sure you want to logout all active sessions? This will force all users to login again and close all active POS sessions.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Update all active sessions to inactive
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          status: 'inactive',
          logout_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true);

      if (updateError) throw updateError;

      // Close all active POS sessions
      const { error: posSessionError } = await supabase
        .from('pos_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .is('closed_at', null) // Only close sessions that aren't already closed
        .eq('status', 'open'); // Only close open sessions

      if (posSessionError) {
        console.warn('Error closing POS sessions (non-critical):', posSessionError);
        // Don't throw - POS session closure is not critical for logout functionality
      }

      // Update all users to offline
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          status: 'offline',
          current_session_id: null
        })
        .neq('status', 'offline');

      if (userError) throw userError;

      setSuccess('All sessions have been logged out successfully! Active POS sessions have been closed.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error logging out all sessions:', error);
      setError(error.message || 'Failed to logout all sessions');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const renderSecuritySettings = () => (
    <div className="space-y-8">
      {/* Account & Login Security Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Account & Login Security</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="5"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={loginAttempts}
                onChange={(e) => setLoginAttempts(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="3"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                value={lockoutDuration}
                onChange={(e) => setLockoutDuration(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="5"
                max="60"
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Require Email Verification</span>
                <p className="text-xs text-gray-500 mt-1">Users must verify their email before accessing the system</p>
              </div>
              <input
                type="checkbox"
                checked={requireEmailVerification}
                onChange={(e) => setRequireEmailVerification(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Require MFA (Email OTP)</span>
                <p className="text-xs text-gray-500 mt-1">Enable multi-factor authentication via email OTP</p>
              </div>
              <input
                type="checkbox"
                checked={requireMFA}
                onChange={(e) => setRequireMFA(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </label>

            {requireMFA && (
              <div className="ml-6 pl-6 border-l-2 border-gray-200 space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">MFA applies to:</p>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={mfaAppliesTo.superAdmin}
                    onChange={(e) => setMfaAppliesTo({ ...mfaAppliesTo, superAdmin: e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Super Admin</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={mfaAppliesTo.cashier}
                    onChange={(e) => setMfaAppliesTo({ ...mfaAppliesTo, cashier: e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Cashier</span>
                </label>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLogoutAllSessions}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout All Sessions</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">Force all users to logout and login again</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Policy Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Password Length
            </label>
            <input
              type="number"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="6"
              max="20"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={passwordRequireSpecial}
                onChange={(e) => setPasswordRequireSpecial(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Require Special Characters</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={passwordRequireMixedCase}
                onChange={(e) => setPasswordRequireMixedCase(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Require Mixed Case</span>
            </label>
          </div>
        </div>
      </div>

      {/* Optional Access Restrictions Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Shield className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Optional Access Restrictions</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Allow Login Only on Verified Browsers</span>
              <p className="text-xs text-gray-500 mt-1">Restrict login to previously verified browsers/devices</p>
            </div>
            <input
              type="checkbox"
              checked={allowLoginOnlyVerifiedBrowsers}
              onChange={(e) => setAllowLoginOnlyVerifiedBrowsers(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Notify Owner on New Device Login</span>
              <p className="text-xs text-gray-500 mt-1">Send notification when user logs in from a new device</p>
            </div>
            <input
              type="checkbox"
              checked={notifyOwnerOnNewDevice}
              onChange={(e) => setNotifyOwnerOnNewDevice(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-8">
      {/* Notification Channels Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive updates via email (most reliable and free)</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-500">Browser and mobile push notifications for PWA</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </label>
        </div>
      </div>

      {/* Alert Types Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Alert Types</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={lowStockAlerts}
              onChange={(e) => setLowStockAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">Low Stock Alerts</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={newOrderAlerts}
              onChange={(e) => setNewOrderAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">New Order Alerts</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={systemAlerts}
              onChange={(e) => setSystemAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">System Alerts</span>
            <span className="text-xs text-gray-400">(Critical issues only)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={dailySalesSummary}
              onChange={(e) => setDailySalesSummary(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">Daily Sales Summary</span>
            <span className="text-xs text-gray-400">(Once daily at closing)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={attendanceAlerts}
              onChange={(e) => setAttendanceAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">Attendance Alerts</span>
            <span className="text-xs text-gray-400">(If HR module enabled)</span>
          </label>
        </div>
      </div>

      {/* Email Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Email Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Email (CC)
            </label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="manager@example.com"
            />
          </div>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={bccManager}
              onChange={(e) => setBccManager(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">BCC manager on all notification emails</span>
          </label>

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Send Daily Summary To
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select recipients for daily automated sales summary (sent once daily at closing time)
            </p>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dailySummaryRecipients.includes('owner')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDailySummaryRecipients([...dailySummaryRecipients, 'owner']);
                    } else {
                      setDailySummaryRecipients(dailySummaryRecipients.filter(r => r !== 'owner'));
                    }
                  }}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Owner</span>
                  <p className="text-xs text-gray-500">Business owner receives daily summary</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dailySummaryRecipients.includes('manager')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDailySummaryRecipients([...dailySummaryRecipients, 'manager']);
                    } else {
                      setDailySummaryRecipients(dailySummaryRecipients.filter(r => r !== 'manager'));
                    }
                  }}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Manager</span>
                  <p className="text-xs text-gray-500">Store manager receives daily summary</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dailySummaryRecipients.includes('cashier_lead')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDailySummaryRecipients([...dailySummaryRecipients, 'cashier_lead']);
                    } else {
                      setDailySummaryRecipients(dailySummaryRecipients.filter(r => r !== 'cashier_lead'));
                    }
                  }}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Cashier Lead</span>
                  <p className="text-xs text-gray-500">Lead cashier receives daily summary</p>
                </div>
              </label>
            </div>
            <p className="mt-3 text-xs text-gray-500 italic">
              💡 Daily summaries include: sales totals, order count, low stock items, and key metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHRSettings = () => (
    <div className="space-y-8">
      {/* HR Settings Information Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-purple-900">Important Notice</h4>
            <p className="text-sm text-purple-700 mt-1">
              Changes in HR Settings will affect payroll computation, attendance tracking, and reports system-wide. 
              Please review carefully before saving.
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Deduction for Absences</span>
                  <p className="text-xs text-gray-500 mt-1">Automatically deduct pay for absent days</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableDeductionForAbsences}
                  onChange={(e) => setEnableDeductionForAbsences(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Overtime Tracking</span>
                  <p className="text-xs text-gray-500 mt-1">Track and compute overtime hours</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableOvertimeTracking}
                  onChange={(e) => setEnableOvertimeTracking(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Auto-Mark Late Employees</span>
                  <p className="text-xs text-gray-500 mt-1">Automatically flag employees who are late</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoMarkLateEmployees}
                  onChange={(e) => setAutoMarkLateEmployees(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Threshold (minutes)
                <p className="text-xs text-gray-500 font-normal mt-1">Consider employee late after this many minutes</p>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={lateThresholdMinutes}
                onChange={(e) => setLateThresholdMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Payroll Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Include Allowance in Pay</span>
                  <p className="text-xs text-gray-500 mt-1">Add employee allowances to base salary</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeAllowanceInPay}
                  onChange={(e) => setIncludeAllowanceInPay(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Tax Computation</span>
                  <p className="text-xs text-gray-500 mt-1">Automatically calculate income tax</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableTaxComputation}
                  onChange={(e) => setEnableTaxComputation(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Include SSS Deductions</span>
                  <p className="text-xs text-gray-500 mt-1">Deduct Social Security System contributions</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeSSSDeductions}
                  onChange={(e) => setIncludeSSSDeductions(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Include PhilHealth Deductions</span>
                  <p className="text-xs text-gray-500 mt-1">Deduct PhilHealth insurance contributions</p>
                </div>
                <input
                  type="checkbox"
                  checked={includePhilHealthDeductions}
                  onChange={(e) => setIncludePhilHealthDeductions(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Include Pag-IBIG Deductions</span>
                  <p className="text-xs text-gray-500 mt-1">Deduct Pag-IBIG fund contributions</p>
                </div>
                <input
                  type="checkbox"
                  checked={includePagIBIGDeductions}
                  onChange={(e) => setIncludePagIBIGDeductions(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payroll Period
              </label>
              <select
                value={payrollPeriod}
                onChange={(e) => setPayrollPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="semi-monthly">Semi-Monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Management Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Calendar className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Leave Management</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Leave Management</span>
                  <p className="text-xs text-gray-500 mt-1">Track employee leaves and vacation days</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableLeaveManagement}
                  onChange={(e) => setEnableLeaveManagement(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Leave Days per Month
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={maxLeaveDaysPerMonth}
                onChange={(e) => setMaxLeaveDaysPerMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Require Leave Approval</span>
                  <p className="text-xs text-gray-500 mt-1">Leaves must be approved by manager</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireLeaveApproval}
                  onChange={(e) => setRequireLeaveApproval(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Reports & Analytics Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable HR Reports Dashboard</span>
                  <p className="text-xs text-gray-500 mt-1">Show HR analytics on dashboard</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableHRReportsDashboard}
                  onChange={(e) => setEnableHRReportsDashboard(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Include Attendance Summary</span>
                  <p className="text-xs text-gray-500 mt-1">Show attendance data in reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeAttendanceSummary}
                  onChange={(e) => setIncludeAttendanceSummary(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Performance Reviews</span>
                  <p className="text-xs text-gray-500 mt-1">Track employee performance metrics</p>
                </div>
                <input
                  type="checkbox"
                  checked={enablePerformanceReviews}
                  onChange={(e) => setEnablePerformanceReviews(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
            
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Employee Self-Service</span>
                  <p className="text-xs text-gray-500 mt-1">Let employees view their own data</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableEmployeeSelfService}
                  onChange={(e) => setEnableEmployeeSelfService(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranchManagement = () => (
    <div className="space-y-8">
      {/* OTP Request Logs Section - Show at top, before branch selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">OTP Request Logs</h3>
              <p className="text-sm text-gray-500">View and manage device registration OTP requests from all branches</p>
            </div>
          </div>
          <button
            onClick={() => fetchAllOTPLogs()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && allOTPLogs.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading OTP logs...</p>
          </div>
        ) : allOTPLogs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No OTP requests yet.</p>
            <p className="text-xs text-gray-400 mt-2">OTP requests will appear here when users request device registration.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter by status */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <button
                onClick={() => fetchAllOTPLogs()}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                All
              </button>
              <button
                onClick={async () => {
                  const { logs } = await attendanceTerminalOTPService.getAllOTPLogs(100, 0);
                  // Get registered devices to filter properly
                  const allDevices = await attendanceTerminalDeviceService.getAllDevices();
                  const registeredUuids = new Set<string>();
                  allDevices.forEach(device => {
                    if (device.device_uuid && device.is_active) {
                      registeredUuids.add(device.device_uuid);
                    }
                  });
                  setRegisteredDeviceUuids(registeredUuids);
                  // Show only pending OTPs
                  setAllOTPLogs(logs.filter(log => log.status === 'pending'));
                }}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              >
                Pending
              </button>
              <button
                onClick={async () => {
                  const { logs } = await attendanceTerminalOTPService.getAllOTPLogs(100, 0);
                  // Get registered devices to filter properly
                  const allDevices = await attendanceTerminalDeviceService.getAllDevices();
                  const registeredUuids = new Set<string>();
                  allDevices.forEach(device => {
                    if (device.device_uuid && device.is_active) {
                      registeredUuids.add(device.device_uuid);
                    }
                  });
                  setRegisteredDeviceUuids(registeredUuids);
                  // Show only verified OTPs that haven't been registered yet
                  setAllOTPLogs(logs.filter(log => 
                    log.status === 'verified' && 
                    (!log.device_uuid || !registeredUuids.has(log.device_uuid))
                  ));
                }}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
              >
                Verified
              </button>
            </div>

            {allOTPLogs.map((otpLog) => (
              <div key={otpLog.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        otpLog.status === 'verified' ? 'bg-green-100 text-green-700' :
                        otpLog.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        otpLog.status === 'expired' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {otpLog.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 font-mono">
                        OTP: {otpLog.otp_code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(otpLog.created_at).toLocaleString()}
                      </span>
                    </div>
                    {otpLog.device_uuid && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs font-medium text-blue-700 mb-1">Device UUID (Primary Identifier):</p>
                        <p className="text-xs font-mono text-blue-800 break-all">
                          {otpLog.device_uuid}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(otpLog.device_uuid || '');
                            alert('Device UUID copied to clipboard!');
                          }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Copy UUID to Clipboard
                        </button>
                      </div>
                    )}
                    {otpLog.device_fingerprint && (
                      <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-300">
                        <p className="text-xs font-medium text-gray-700 mb-1">Device Fingerprint (Metadata):</p>
                        <p className="text-xs font-mono text-gray-800 break-all">
                          {otpLog.device_fingerprint}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(otpLog.device_fingerprint || '');
                            alert('Device fingerprint copied to clipboard!');
                          }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                    )}
                    {otpLog.location_latitude && otpLog.location_longitude && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          <strong>Location:</strong> {otpLog.location_latitude.toFixed(6)}, {otpLog.location_longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                    {otpLog.verified_by_user && (
                      <p className="text-xs text-gray-500 mt-2">
                        Verified by: {otpLog.verified_by_user.first_name} {otpLog.verified_by_user.last_name} 
                        {otpLog.verified_at && ` on ${new Date(otpLog.verified_at).toLocaleString()}`}
                      </p>
                    )}
                    {otpLog.expires_at && new Date(otpLog.expires_at) < new Date() && otpLog.status === 'pending' && (
                      <p className="text-xs text-red-600 mt-1">⚠️ OTP Expired</p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    {otpLog.status === 'verified' && otpLog.device_uuid && !registeredDeviceUuids.has(otpLog.device_uuid) && (
                      <button
                        onClick={() => handleRegisterDeviceFromOTP(otpLog)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        title="Register device using this OTP log"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register Device</span>
                      </button>
                    )}
                    {otpLog.status === 'verified' && otpLog.device_uuid && registeredDeviceUuids.has(otpLog.device_uuid) && (
                      <div className="px-3 py-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">Device Registered</p>
                        <p className="text-green-700 mt-1">This device has already been registered.</p>
                      </div>
                    )}
                    {otpLog.status === 'verified' && !otpLog.device_uuid && (
                      <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">Missing Device UUID</p>
                        <p className="text-red-700 mt-1">Cannot register device without UUID. Please request a new OTP.</p>
                      </div>
                    )}
                    {otpLog.status === 'pending' && (
                      <div className="px-3 py-2 text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-medium text-yellow-800">Pending Verification</p>
                        <p className="text-yellow-700 mt-1">Waiting for user to verify OTP</p>
                        <p className="text-yellow-600 mt-1">OTP Code: <span className="font-mono font-bold">{otpLog.otp_code}</span></p>
                      </div>
                    )}
                    {(otpLog.status === 'expired' || otpLog.status === 'failed') && (
                      <span className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center">
                        {otpLog.status === 'expired' ? 'OTP Expired' : 'OTP Failed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            💡 <strong>How it works:</strong> When a user requests device registration, an OTP code is sent to administrators. Once the OTP is verified by the user, click "Register Device" to select a branch and register the device to that branch.
          </p>
        </div>
      </div>

      {/* Branch List Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Building className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Branch Locations</h3>
          </div>
          <button
            onClick={() => {
              resetBranchForm();
              setShowAddBranchModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {loading && branches.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading branches...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No branches found. Click "Add Branch" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {branches.map((branch) => (
                <div key={branch.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{branch.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          branch.branch_type === 'main' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {branch.branch_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{branch.address}, {branch.city}, {branch.province}</p>
                      <p className="text-xs text-gray-400">Branch Code: {branch.code}</p>
                      {branch.manager && (
                        <p className="text-xs text-gray-400 mt-1">
                          Manager: {branch.manager.first_name} {branch.manager.last_name}
                        </p>
                      )}
                      {branch.phone && (
                        <p className="text-xs text-gray-400">Phone: {branch.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        branch.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleEditBranch(branch)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit branch"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Deactivate branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Branch Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Settings className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Branch Settings</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <input
              type="checkbox"
              checked={branchSettings.allow_device_registration}
              onChange={(e) => setBranchSettings({ ...branchSettings, allow_device_registration: e.target.checked })}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Allow Device Registration</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                When enabled, unregistered devices can request OTP for device registration. Automatically disabled after a device is registered to prevent spam.
              </p>
            </div>
          </label>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>How it works:</strong> When enabled, unregistered devices accessing the attendance terminal 
            will see a "Request OTP for registration" option. Once a device is successfully registered via OTP, 
            this setting automatically turns off to prevent spam. You can re-enable it when you need to register 
            another device.
          </p>
        </div>
      </div>

      {/* Attendance Terminal Security Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Terminal Security</h3>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Branch to Configure Security
          </label>
          <select
            value={selectedBranchForSecurity || ''}
            onChange={(e) => {
              const branchId = e.target.value;
              setSelectedBranchForSecurity(branchId || null);
              if (branchId) {
                fetchBranchDevices(branchId);
                fetchBranchActivityLogs(branchId);
                fetchBranchOTPLogs(branchId);
              } else {
                setBranchDevices([]);
                setBranchActivityLogs([]);
                setBranchOTPLogs([]);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select a branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.code})
              </option>
            ))}
          </select>
        </div>

        {selectedBranchForSecurity && (
          <div className="space-y-6">
            {/* Branch Security Status */}
            {(() => {
              const selectedBranch = branches.find(b => b.id === selectedBranchForSecurity);
              if (!selectedBranch) return null;

              const securitySettings = selectedBranch.attendance_security_settings || {
                enableDeviceVerification: false,
                enableGeoLocationVerification: false,
                enablePinAccessControl: false,
                enableActivityLogging: true
              };

              return (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Security Status for {selectedBranch.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${securitySettings.enableDeviceVerification ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm text-gray-700">Device Verification: {securitySettings.enableDeviceVerification ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${securitySettings.enableGeoLocationVerification ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm text-gray-700">Geo-location: {securitySettings.enableGeoLocationVerification ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${securitySettings.enablePinAccessControl ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm text-gray-700">PIN Access: {securitySettings.enablePinAccessControl ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${selectedBranch.latitude && selectedBranch.longitude ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm text-gray-700">Coordinates: {selectedBranch.latitude && selectedBranch.longitude ? 'Set' : 'Not Set'}</span>
                    </div>
                  </div>
                  {securitySettings.enableGeoLocationVerification && selectedBranch.latitude && selectedBranch.longitude && (
                    <p className="text-xs text-gray-600 mt-3">
                      📍 Location: {selectedBranch.latitude}, {selectedBranch.longitude} (Tolerance: {securitySettings.geoLocationToleranceMeters || 100}m)
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Device Management */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Verified Devices</h4>
                </div>
                <button
                  onClick={() => {
                    setDeviceFormData({
                      device_name: '',
                      device_uuid: '',
                      device_fingerprint: '',
                      device_type: 'kiosk'
                    });
                    setShowDeviceModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Device</span>
                </button>
              </div>

              {loading && branchDevices.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Loading devices...</p>
                </div>
              ) : branchDevices.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No devices registered. Click "Register Device" to add one.</p>
                  <p className="text-xs text-gray-400 mt-2">Devices must be registered to access the attendance terminal when device verification is enabled.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branchDevices.map((device) => (
                    <div key={device.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-gray-900">{device.device_name}</h5>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                              {device.device_type || 'unknown'}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              device.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {device.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mb-1">Fingerprint: {device.device_fingerprint.substring(0, 20)}...</p>
                          {device.registered_by_user && (
                            <p className="text-xs text-gray-500">Registered by: {device.registered_by_user.first_name} {device.registered_by_user.last_name}</p>
                          )}
                          {device.last_used_at && (
                            <p className="text-xs text-gray-400 mt-1">Last used: {new Date(device.last_used_at).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to deactivate this device?')) {
                                try {
                                  setLoading(true);
                                  await attendanceTerminalDeviceService.deactivateDevice(device.id);
                                  setSuccess('Device deactivated successfully!');
                                  if (selectedBranchForSecurity) {
                                    await fetchBranchDevices(selectedBranchForSecurity);
                                  }
                                  setTimeout(() => setSuccess(null), 3000);
                                } catch (error: any) {
                                  setError(error.message || 'Failed to deactivate device');
                                  setTimeout(() => setError(null), 5000);
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Deactivate device"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
                                try {
                                  setLoading(true);
                                  await attendanceTerminalDeviceService.deleteDevice(device.id);
                                  setSuccess('Device deleted successfully!');
                                  if (selectedBranchForSecurity) {
                                    await fetchBranchDevices(selectedBranchForSecurity);
                                  }
                                  setTimeout(() => setSuccess(null), 3000);
                                } catch (error: any) {
                                  setError(error.message || 'Failed to delete device');
                                  setTimeout(() => setError(null), 5000);
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete device"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>How to Register a Device:</strong> When device verification is enabled, open the attendance terminal page on the device you want to register. The system will prompt for device registration and generate a unique fingerprint. Copy the fingerprint and register it here.
                </p>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Activity Logs</h4>
                </div>
                <button
                  onClick={() => {
                    if (selectedBranchForSecurity) {
                      setShowActivityLogsModal(true);
                      fetchBranchActivityLogs(selectedBranchForSecurity);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  <span>View All Logs</span>
                </button>
              </div>

              {branchActivityLogs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No activity logs yet.</p>
                  <p className="text-xs text-gray-400 mt-2">Activity logs will appear here once attendance terminal is used.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {branchActivityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' :
                          log.status === 'blocked' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.status_reason && (
                        <p className="text-xs text-gray-600 mt-1">{log.status_reason}</p>
                      )}
                      {log.device && (
                        <p className="text-xs text-gray-500 mt-1">Device: {log.device.device_name}</p>
                      )}
                      {log.staff && (
                        <p className="text-xs text-gray-500">Staff: {log.staff.first_name} {log.staff.last_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {!selectedBranchForSecurity && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Select a branch to configure attendance terminal security settings.</p>
          </div>
        )}
      </div>

      {/* Register Device Modal */}
      {showDeviceModal && selectedBranchForSecurity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Register Attendance Terminal Device</h3>
              <button
                  onClick={() => {
                    setShowDeviceModal(false);
                    setDeviceFormData({
                      device_name: '',
                      device_uuid: '',
                      device_fingerprint: '',
                      device_type: 'kiosk'
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Device Registration:</strong> For OTP-based registration, devices are automatically registered with a stable UUID. For manual registration, you can paste the device UUID from the OTP log or use a device fingerprint.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deviceFormData.device_name}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, device_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Main Branch Kiosk, Office Laptop"
                />
                <p className="text-xs text-gray-500 mt-1">A friendly name to identify this device</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device UUID (Recommended) <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  value={deviceFormData.device_uuid}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, device_uuid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  placeholder="Paste device UUID from OTP log (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stable UUID from browser localStorage. Get this from the OTP Request Logs.
                </p>
                <button
                  onClick={() => {
                    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                    setDeviceFormData({ ...deviceFormData, device_uuid: uuid });
                  }}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Generate New UUID
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Fingerprint (Alternative/Backward Compatibility)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={deviceFormData.device_fingerprint}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, device_fingerprint: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste device fingerprint here (optional)"
                  />
                  <button
                    onClick={() => {
                      const fingerprint = generateDeviceFingerprint();
                      setDeviceFormData({ ...deviceFormData, device_fingerprint: fingerprint });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Legacy method. Use Device UUID for stable identification. Fingerprint is for metadata only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type
                </label>
                <select
                  value={deviceFormData.device_type}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, device_type: e.target.value as 'desktop' | 'laptop' | 'tablet' | 'kiosk' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="kiosk">Kiosk</option>
                  <option value="desktop">Desktop</option>
                  <option value="laptop">Laptop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Important:</strong> Only register devices that will be used at the branch location. Unauthorized devices will be blocked from accessing the attendance terminal when device verification is enabled.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeviceModal(false);
                  setDeviceFormData({
                    device_name: '',
                    device_uuid: '',
                    device_fingerprint: '',
                    device_type: 'kiosk'
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterDevice}
                disabled={loading || !deviceFormData.device_name || (!deviceFormData.device_uuid && !deviceFormData.device_fingerprint)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Registering...' : 'Register Device'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Selection Modal for Device Registration */}
      {showBranchSelectionModal && selectedOTPLogForRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Register Device</h3>
              <button
                onClick={() => {
                  setShowBranchSelectionModal(false);
                  setSelectedOTPLogForRegistration(null);
                  setSelectedBranchForRegistration('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>OTP Code:</strong> <span className="font-mono">{selectedOTPLogForRegistration.otp_code}</span>
                </p>
                {selectedOTPLogForRegistration.device_uuid && (
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Device UUID:</strong> <span className="font-mono break-all">{selectedOTPLogForRegistration.device_uuid}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Branch to Register Device <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBranchForRegistration}
                  onChange={(e) => setSelectedBranchForRegistration(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select a branch --</option>
                  {branches
                    .filter(branch => branch.is_active)
                    .map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} {branch.code && `(${branch.code})`}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the branch where this device will be registered for attendance terminal access.
                </p>
              </div>

              {selectedOTPLogForRegistration.device_uuid && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Device UUID (Primary Identifier):</p>
                  <p className="text-xs font-mono text-gray-800 break-all mb-2">
                    {selectedOTPLogForRegistration.device_uuid}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOTPLogForRegistration.device_uuid || '');
                      alert('Device UUID copied to clipboard!');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copy UUID to Clipboard
                  </button>
                </div>
              )}

              {selectedOTPLogForRegistration.device_fingerprint && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Device Fingerprint (Metadata):</p>
                  <p className="text-xs font-mono text-gray-800 break-all mb-2">
                    {selectedOTPLogForRegistration.device_fingerprint}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOTPLogForRegistration.device_fingerprint || '');
                      alert('Device fingerprint copied to clipboard!');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}

              {selectedOTPLogForRegistration.location_latitude && selectedOTPLogForRegistration.location_longitude && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600">
                    <strong>Location:</strong> {selectedOTPLogForRegistration.location_latitude.toFixed(6)}, {selectedOTPLogForRegistration.location_longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBranchSelectionModal(false);
                  setSelectedOTPLogForRegistration(null);
                  setSelectedBranchForRegistration('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegisterDeviceFromOTP}
                disabled={loading || !selectedBranchForRegistration}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Register Device</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {showActivityLogsModal && selectedBranchForSecurity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Activity Logs</h3>
              <button
                onClick={() => {
                  setShowActivityLogsModal(false);
                  setActivityLogsFilters({
                    action_type: '',
                    status: '',
                    start_date: '',
                    end_date: ''
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                  <select
                    value={activityLogsFilters.action_type}
                    onChange={(e) => setActivityLogsFilters({ ...activityLogsFilters, action_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Actions</option>
                    <option value="time_in">Time In</option>
                    <option value="time_out">Time Out</option>
                    <option value="access_denied">Access Denied</option>
                    <option value="device_verified">Device Verified</option>
                    <option value="pin_verified">PIN Verified</option>
                    <option value="location_verified">Location Verified</option>
                    <option value="location_failed">Location Failed</option>
                    <option value="device_blocked">Device Blocked</option>
                    <option value="pin_failed">PIN Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={activityLogsFilters.status}
                    onChange={(e) => setActivityLogsFilters({ ...activityLogsFilters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="blocked">Blocked</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={activityLogsFilters.start_date}
                    onChange={(e) => setActivityLogsFilters({ ...activityLogsFilters, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={activityLogsFilters.end_date}
                    onChange={(e) => setActivityLogsFilters({ ...activityLogsFilters, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  if (selectedBranchForSecurity) {
                    try {
                      setLoading(true);
                      const { logs } = await attendanceTerminalDeviceService.getActivityLogs({
                        branch_id: selectedBranchForSecurity,
                        action_type: activityLogsFilters.action_type || undefined,
                        status: activityLogsFilters.status || undefined,
                        start_date: activityLogsFilters.start_date || undefined,
                        end_date: activityLogsFilters.end_date || undefined,
                        limit: 500
                      });
                      setBranchActivityLogs(logs);
                    } catch (error: any) {
                      setError(error.message || 'Failed to fetch logs');
                      setTimeout(() => setError(null), 5000);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && branchActivityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Loading logs...</p>
                        </td>
                      </tr>
                    ) : branchActivityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No activity logs found
                        </td>
                      </tr>
                    ) : (
                      branchActivityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                              {log.action_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              log.status === 'success' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              log.status === 'blocked' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {log.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.device ? log.device.device_name : log.device_fingerprint?.substring(0, 10) + '...' || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.staff ? `${log.staff.first_name} ${log.staff.last_name}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.status_reason || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.location_latitude && log.location_longitude ? (
                              <span className="text-xs">
                                {log.location_latitude.toFixed(4)}, {log.location_longitude.toFixed(4)}
                                {log.distance_from_branch_meters && (
                                  <span className="block text-gray-500">
                                    {log.distance_from_branch_meters.toFixed(2)}m away
                                  </span>
                                )}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <button
                onClick={() => {
                  setShowAddBranchModal(false);
                  resetBranchForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Main Branch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={branchFormData.code}
                    onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="MAIN"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={branchFormData.type}
                    onChange={(e) => setBranchFormData({ ...branchFormData, type: e.target.value as 'main' | 'satellite' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="main">Main Branch</option>
                    <option value="satellite">Satellite Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={branchFormData.status}
                    onChange={(e) => setBranchFormData({ ...branchFormData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="123 Business Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={branchFormData.city}
                      onChange={(e) => setBranchFormData({ ...branchFormData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Manila"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={branchFormData.province}
                      onChange={(e) => setBranchFormData({ ...branchFormData, province: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Metro Manila"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={branchFormData.postalCode}
                      onChange={(e) => setBranchFormData({ ...branchFormData, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1000"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={branchFormData.phone}
                    onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+63 2 8123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={branchFormData.email}
                    onChange={(e) => setBranchFormData({ ...branchFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="branch@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager
                  </label>
                  <select
                    value={branchFormData.managerId}
                    onChange={(e) => setBranchFormData({ ...branchFormData, managerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select a manager (optional)</option>
                    {managerCandidates.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.first_name} {manager.last_name} ({manager.email}) - {manager.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Operating Hours
                </label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-4">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={branchFormData.operatingHours[day].isOpen}
                            onChange={(e) => {
                              const newHours = { ...branchFormData.operatingHours };
                              newHours[day] = { ...newHours[day], isOpen: e.target.checked };
                              setBranchFormData({ ...branchFormData, operatingHours: newHours });
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        </label>
                      </div>
                      {branchFormData.operatingHours[day].isOpen && (
                        <>
                          <input
                            type="time"
                            value={branchFormData.operatingHours[day].open}
                            onChange={(e) => {
                              const newHours = { ...branchFormData.operatingHours };
                              newHours[day] = { ...newHours[day], open: e.target.value };
                              setBranchFormData({ ...branchFormData, operatingHours: newHours });
                            }}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={branchFormData.operatingHours[day].close}
                            onChange={(e) => {
                              const newHours = { ...branchFormData.operatingHours };
                              newHours[day] = { ...newHours[day], close: e.target.value };
                              setBranchFormData({ ...branchFormData, operatingHours: newHours });
                            }}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </>
                      )}
                      {!branchFormData.operatingHours[day].isOpen && (
                        <span className="text-sm text-gray-400">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Terminal Security Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Attendance Terminal Security</h4>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Configure security settings for the attendance terminal at this branch. These settings help prevent unauthorized access and ensure attendance is only recorded from authorized locations and devices.
                </p>

                {/* Device Verification */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-green-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900">Enable Device Verification</label>
                        <p className="text-xs text-gray-600">Only allow pre-registered devices to access attendance terminal</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={branchFormData.attendanceSecuritySettings.enableDeviceVerification}
                      onChange={(e) => setBranchFormData({
                        ...branchFormData,
                        attendanceSecuritySettings: {
                          ...branchFormData.attendanceSecuritySettings,
                          enableDeviceVerification: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  {branchFormData.attendanceSecuritySettings.enableDeviceVerification && (
                    <div className="ml-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">
                        💡 Device registration can be managed in the "Attendance Terminal Devices" section below.
                      </p>
                    </div>
                  )}
                </div>

                {/* Activity Logging */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900">Enable Activity Logging</label>
                        <p className="text-xs text-gray-600">Log all attendance terminal access attempts for auditing</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={branchFormData.attendanceSecuritySettings.enableActivityLogging}
                      onChange={(e) => setBranchFormData({
                        ...branchFormData,
                        attendanceSecuritySettings: {
                          ...branchFormData.attendanceSecuritySettings,
                          enableActivityLogging: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* POS Device Access Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">POS Device Access</h4>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Control whether attendance terminal devices registered for this branch can access the POS interface.
                </p>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900">Allow Attendance Device to Access POS</label>
                      <p className="text-xs text-gray-600">
                        When enabled, attendance terminal devices registered for this branch can access POS. 
                        When disabled, only POS-registered devices can access POS.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={branchFormData.allow_attendance_device_for_pos}
                    onChange={(e) => setBranchFormData({
                      ...branchFormData,
                      allow_attendance_device_for_pos: e.target.checked
                    })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddBranchModal(false);
                  resetBranchForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingBranch ? handleUpdateBranch : handleCreateBranch}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPosTerminalManagement = () => (
    <div className="space-y-8">
      {/* Terminal List Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Monitor className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">POS Terminals</h3>
          </div>
          <button
            onClick={() => {
              resetTerminalForm();
              setShowAddTerminalModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Terminal</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {loading && posTerminals.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading terminals...</p>
            </div>
          ) : posTerminals.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No terminals found. Click "Add Terminal" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {posTerminals.map((terminal) => (
                <div key={terminal.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{terminal.terminal_name}</h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {terminal.terminal_code}
                        </span>
                      </div>
                      {terminal.branch && (
                        <p className="text-sm text-gray-500">Branch: {terminal.branch.name} ({terminal.branch.code})</p>
                      )}
                      {terminal.assigned_user && (
                        <p className="text-xs text-gray-400 mt-1">
                          Assigned to: {terminal.assigned_user.first_name} {terminal.assigned_user.last_name} ({terminal.assigned_user.email})
                        </p>
                      )}
                      {terminal.notes && (
                        <p className="text-xs text-gray-400 mt-1">Notes: {terminal.notes}</p>
                      )}
                      {terminal.last_sync && (
                        <p className="text-xs text-gray-400">Last Sync: {new Date(terminal.last_sync).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        terminal.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {terminal.status}
                      </span>
                      <button
                        onClick={() => handleEditTerminal(terminal)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit terminal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTerminal(terminal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Deactivate terminal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Standard POS Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings2 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Standard POS Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Tax Rate (%)
            </label>
            <input
              type="number"
              value={posSettings.defaultTaxRate}
              onChange={(e) => setPosSettings({...posSettings, defaultTaxRate: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min="0"
              max="50"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={posSettings.lowStockThreshold}
              onChange={(e) => setPosSettings({...posSettings, lowStockThreshold: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Prefix
            </label>
            <input
              type="text"
              value={posSettings.receiptPrefix}
              onChange={(e) => setPosSettings({...posSettings, receiptPrefix: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="RCP"
              maxLength={10}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.autoPrintReceipt}
              onChange={(e) => setPosSettings({...posSettings, autoPrintReceipt: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable Auto-Print Receipts</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableInventoryDeduction}
              onChange={(e) => setPosSettings({...posSettings, enableInventoryDeduction: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable Inventory Deduction</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableAuditLog}
              onChange={(e) => setPosSettings({...posSettings, enableAuditLog: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable Audit Logs</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableReceiptNumbering}
              onChange={(e) => setPosSettings({...posSettings, enableReceiptNumbering: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable Receipt Numbering</span>
          </label>
        </div>
      </div>

      {/* POS User Permissions Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">POS User Permissions</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.allowPriceOverride}
              onChange={(e) => setPosSettings({...posSettings, allowPriceOverride: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Allow Price Override</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.requireManagerApprovalForPriceOverride}
              onChange={(e) => setPosSettings({...posSettings, requireManagerApprovalForPriceOverride: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Require Manager Approval for Price Override</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.restrictVoidTransactionsToAdmin}
              onChange={(e) => setPosSettings({...posSettings, restrictVoidTransactionsToAdmin: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Restrict Void Transactions to Admin</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.requireLoginForTransactions}
              onChange={(e) => setPosSettings({...posSettings, requireLoginForTransactions: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Require Login for Transactions</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.requireShiftStartEnd}
              onChange={(e) => setPosSettings({...posSettings, requireShiftStartEnd: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Require Shift Start / End</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.requireCashCountAtEndShift}
              onChange={(e) => setPosSettings({...posSettings, requireCashCountAtEndShift: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Require Cash Count at End Shift</span>
          </label>
        </div>
      </div>

      {/* Payment Options Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Options</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Allowed Payment Methods
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={posSettings.allowedPaymentMethods.includes('cash')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPosSettings({
                        ...posSettings,
                        allowedPaymentMethods: [...posSettings.allowedPaymentMethods, 'cash']
                      });
                    } else {
                      setPosSettings({
                        ...posSettings,
                        allowedPaymentMethods: posSettings.allowedPaymentMethods.filter(m => m !== 'cash')
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Cash</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={posSettings.allowedPaymentMethods.includes('gcash')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPosSettings({
                        ...posSettings,
                        allowedPaymentMethods: [...posSettings.allowedPaymentMethods, 'gcash']
                      });
                    } else {
                      setPosSettings({
                        ...posSettings,
                        allowedPaymentMethods: posSettings.allowedPaymentMethods.filter(m => m !== 'gcash')
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">GCash</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={posSettings.allowedPaymentMethods.includes('combination')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPosSettings({
                        ...posSettings,
                        allowedPaymentMethods: [...posSettings.allowedPaymentMethods, 'combination']
                      });
                    } else {
                      setPosSettings({
                        ...posSettings,
                        allowedPaymentMethods: posSettings.allowedPaymentMethods.filter(m => m !== 'combination')
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Combination (Cash + GCash)</span>
              </label>

              {/* Custom payment methods */}
              {posSettings.allowedPaymentMethods
                .filter(m => !['cash', 'gcash', 'combination'].includes(m))
                .map((method) => (
                  <div key={method} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 capitalize">{method}</span>
                    <button
                      onClick={() => removeCustomPaymentMethod(method)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => {
                  const customMethod = prompt('Enter custom payment method name:');
                  if (customMethod && customMethod.trim() && !posSettings.allowedPaymentMethods.includes(customMethod.trim().toLowerCase())) {
                    setPosSettings({
                      ...posSettings,
                      allowedPaymentMethods: [...posSettings.allowedPaymentMethods, customMethod.trim().toLowerCase()]
                    });
                  } else if (customMethod && posSettings.allowedPaymentMethods.includes(customMethod.trim().toLowerCase())) {
                    alert('This payment method already exists.');
                  }
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                + Add Custom Payment Method
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={posSettings.enableMultiPayment}
                onChange={(e) => setPosSettings({...posSettings, enableMultiPayment: e.target.checked})}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Enable Multiple Payments</span>
            </label>
          </div>
        </div>
      </div>

      {/* Hardware Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Monitor className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Hardware Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Receipt Printer
            </label>
            <select
              value={posSettings.receiptPrinter}
              onChange={(e) => setPosSettings({...posSettings, receiptPrinter: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">No printer selected</option>
              <option value="default">Default Printer</option>
              <option value="epson-tm-t20">Epson TM-T20</option>
              <option value="epson-tm-t82">Epson TM-T82</option>
              <option value="star-tsp100">Star TSP100</option>
              <option value="custom">Custom Printer</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={posSettings.openDrawerOnPayment}
                onChange={(e) => setPosSettings({...posSettings, openDrawerOnPayment: e.target.checked})}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Open Drawer on Payment</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={posSettings.enableScannerSupport}
                onChange={(e) => setPosSettings({...posSettings, enableScannerSupport: e.target.checked})}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Enable Scanner Support</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Camera for Attendance Terminal
            </label>
            <select
              value={posSettings.cameraForAttendanceTerminal}
              onChange={(e) => setPosSettings({...posSettings, cameraForAttendanceTerminal: e.target.value as 'usb' | 'laptop'})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="laptop">Laptop Camera</option>
              <option value="usb">USB Camera</option>
            </select>
          </div>
        </div>
      </div>

      {/* Connectivity Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Connectivity</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.showInternetConnectionWarning}
              onChange={(e) => setPosSettings({...posSettings, showInternetConnectionWarning: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Show Internet Connection Warning</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.disableTransactionsWhenOffline}
              onChange={(e) => setPosSettings({...posSettings, disableTransactionsWhenOffline: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Disable Transactions When Offline</span>
          </label>
        </div>
      </div>

      {/* Advanced Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Offline Grace Period (minutes)
            </label>
            <input
              type="number"
              value={posSettings.maxOfflineGracePeriod}
              onChange={(e) => setPosSettings({...posSettings, maxOfflineGracePeriod: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min="0"
              max="120"
            />
            <p className="mt-1 text-xs text-gray-500">Allow transactions for this many minutes after losing internet connection</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Lock POS after Inactivity (minutes)
            </label>
            <input
              type="number"
              value={posSettings.autoLockPosAfterInactivity}
              onChange={(e) => setPosSettings({...posSettings, autoLockPosAfterInactivity: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min="1"
              max="60"
            />
            <p className="mt-1 text-xs text-gray-500">Automatically lock POS screen after period of inactivity</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Terminal Modal */}
      {showAddTerminalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTerminal ? 'Edit Terminal' : 'Add New Terminal'}
              </h3>
              <button
                onClick={() => {
                  setShowAddTerminalModal(false);
                  resetTerminalForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={terminalFormData.terminal_name}
                    onChange={(e) => setTerminalFormData({ ...terminalFormData, terminal_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Terminal 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={terminalFormData.terminal_code}
                    onChange={(e) => setTerminalFormData({ ...terminalFormData, terminal_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="POS-001"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={terminalFormData.branch_id}
                    onChange={(e) => setTerminalFormData({ ...terminalFormData, branch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select a branch</option>
                    {availableBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={terminalFormData.status}
                    onChange={(e) => setTerminalFormData({ ...terminalFormData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned User
                  </label>
                  <select
                    value={terminalFormData.assigned_user_id}
                    onChange={(e) => setTerminalFormData({ ...terminalFormData, assigned_user_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select a user (optional)</option>
                    {userCandidates.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={terminalFormData.notes}
                    onChange={(e) => setTerminalFormData({ ...terminalFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Additional notes about this terminal..."
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddTerminalModal(false);
                  resetTerminalForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingTerminal ? handleUpdateTerminal : handleCreateTerminal}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving...' : editingTerminal ? 'Update Terminal' : 'Create Terminal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="settings-page min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage application settings and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Settings Navigation - Desktop */}
        <div className={`hidden lg:block lg:w-80 xl:w-96 bg-white border-r border-gray-200 min-h-screen ${
          sidebarCollapsed ? 'lg:hidden' : ''
        }`}>
          <div className="p-6">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    activeSection === section.id
                      ? `${section.bgColor} ${section.color} shadow-sm`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm opacity-75">{section.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                {(() => {
                  const section = settingsSections.find(s => s.id === activeSection);
                  return section ? (
                    <>
                      <div className={`p-2 rounded-lg ${section.bgColor}`}>
                        <section.icon className={`w-6 h-6 ${section.color}`} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    </>
                  ) : null;
                })()}
              </div>
              <p className="text-gray-600">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {/* Settings Content */}
            <div className="space-y-8">
              {activeSection === 'general' && renderGeneralSettings()}
              {activeSection === 'security' && renderSecuritySettings()}
              {activeSection === 'notifications' && renderNotificationSettings()}
              {activeSection === 'hr' && renderHRSettings()}
              {activeSection === 'branches' && renderBranchManagement()}
              {activeSection === 'pos' && renderPosTerminalManagement()}
            </div>

            {/* Sticky Save Button */}
            <div className="sticky bottom-6 mt-12">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Changes are saved automatically
                  </div>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;