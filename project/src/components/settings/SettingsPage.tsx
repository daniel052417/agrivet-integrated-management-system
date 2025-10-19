import React, { useEffect, useState } from 'react';
import { 
  Settings, Lock, Bell, Mail, Shield, Download, Upload, 
  Save, RefreshCw, Monitor, 
  Smartphone, MapPin, Phone, Building, X, Search, Plus,
  Palette, AlertTriangle, CheckCircle, Trash2,
  FileText, HardDrive, Edit3, Ban,
  TestTube, ShieldCheck, Activity, Settings2, User,
  Clock, DollarSign, Calendar, BarChart3, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { settingsService } from '../../lib/settingsService';
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
  const [autoSave, setAutoSave] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [receiptHeader, setReceiptHeader] = useState('Thank you for your business!');
  const [receiptFooter, setReceiptFooter] = useState('Visit us again soon!');
  const [defaultBranch, setDefaultBranch] = useState('main');

  // Security settings state
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [require2FA, setRequire2FA] = useState(false);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true);
  const [passwordExpiration, setPasswordExpiration] = useState(90);
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(15);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [ipBanlist, setIpBanlist] = useState<string[]>([]);
  const [auditLogVisibility, setAuditLogVisibility] = useState(true);
  const [newIpAddress, setNewIpAddress] = useState('');

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesAlerts, setSalesAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [staffActivityAlerts, setStaffActivityAlerts] = useState(true);
  const [bccManager, setBccManager] = useState(true);
  const [managerEmail, setManagerEmail] = useState('manager@agrivet.com');

  // Data settings state
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [retentionPeriod, setRetentionPeriod] = useState(365);
  const [dataEncryption, setDataEncryption] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv');
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupLocation, setBackupLocation] = useState('cloud');

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
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
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
      monday: { start: '08:00', end: '18:00', isOpen: true },
      tuesday: { start: '08:00', end: '18:00', isOpen: true },
      wednesday: { start: '08:00', end: '18:00', isOpen: true },
      thursday: { start: '08:00', end: '18:00', isOpen: true },
      friday: { start: '08:00', end: '18:00', isOpen: true },
      saturday: { start: '08:00', end: '18:00', isOpen: true },
      sunday: { start: '08:00', end: '18:00', isOpen: false }
    },
    managerId: '',
    status: 'active'
  });

  // PWA settings state
  const [pwaName, setPwaName] = useState('Agrivet Kiosk');
  const [pwaTheme, setPwaTheme] = useState('dark-green');
  const [pwaLogo, setPwaLogo] = useState<string | null>(null);
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(true);
  const [defaultBranchForOrders, setDefaultBranchForOrders] = useState('main');
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [pwaVersion, setPwaVersion] = useState('1.0.5');

  // POS Terminal settings state
  const [posTerminals, setPosTerminals] = useState<any[]>([]);
  const [posAccounts, setPosAccounts] = useState<any[]>([]);
  const [editingTerminal, setEditingTerminal] = useState<any>(null);
  const [showAddTerminalModal, setShowAddTerminalModal] = useState(false);
  const [terminalFormData, setTerminalFormData] = useState({
    terminal_name: '',
    terminal_code: '',
    branch_id: '',
    status: 'active',
    assigned_user_id: '',
    notes: ''
  });
  const [posSettings, setPosSettings] = useState({
    defaultTaxRate: 12,
    currencySymbol: '₱',
    receiptWidth: 80,
    autoPrintReceipt: true,
    showItemImages: true,
    enableQuickKeys: true,
    enableBulkOperations: true,
    enableInventoryTracking: true,
    lowStockThreshold: 10,
    enablePriceOverrides: true,
    requireManagerForOverrides: true,
    enableCustomerSearch: true,
    enableBarcodeGeneration: true,
    enableOfflineMode: true,
    syncInterval: 5,
    enableAuditLog: true,
    enableReceiptNumbering: true,
    receiptNumberPrefix: 'RCP',
    enableMultiPayment: true,
    enablePartialPayments: true,
    enableLayaway: false,
    enableInstallments: false
  });

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Settings2,
      description: 'Business info, branding, and system preferences',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: ShieldCheck,
      description: 'Authentication, access control, and audit logging',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      description: 'Alerts, communication channels, and preferences',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'hr',
      title: 'HR Management',
      icon: Users,
      description: 'Control HR features such as attendance tracking, payroll computation, and leave management',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'pwa',
      title: 'PWA Settings',
      icon: Smartphone,
      description: 'Progressive Web App configuration and branding',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: HardDrive,
      description: 'Backup, export/import, and data protection',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'branches',
      title: 'Branch Management',
      icon: Building,
      description: 'Branch locations, settings, and configurations',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'pos',
      title: 'POS Terminal Management',
      icon: Monitor,
      description: 'POS terminals, accounts, and terminal configurations',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    testDatabaseConnection();
    loadAuditLogs();
    loadBranches();
    loadUsers();
    loadSettings();
    loadPosTerminals();
    loadPosAccounts();
  }, []);

  const testDatabaseConnection = async () => {
    console.log('🔍 [DEBUG] Testing database connection...');
    try {
      const { error } = await supabase
        .from('branches')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ [DEBUG] Database connection test failed:', error);
        setError('Database connection failed: ' + error.message);
      } else {
        console.log('✅ [DEBUG] Database connection test successful!');
      }
    } catch (err: any) {
      console.error('❌ [DEBUG] Critical error in database connection test:', err);
      setError('Database connection test failed: ' + err.message);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_setting', {
        setting_key: 'app_settings'
      });

      if (error) {
        console.log('Settings not found, using defaults:', error.message);
        return;
      }
      
      if (data) {
        const settings = data;
        
        // Load all existing settings...
        if (settings.app_name) setAppName(settings.app_name);
        if (settings.company_name) setCompanyName(settings.company_name);
        // ... (other settings remain the same)

        // Load HR settings
        if (settings.enable_deduction_for_absences !== undefined) setEnableDeductionForAbsences(settings.enable_deduction_for_absences);
        if (settings.enable_overtime_tracking !== undefined) setEnableOvertimeTracking(settings.enable_overtime_tracking);
        if (settings.auto_mark_late_employees !== undefined) setAutoMarkLateEmployees(settings.auto_mark_late_employees);
        if (settings.late_threshold_minutes) setLateThresholdMinutes(settings.late_threshold_minutes);
        if (settings.include_allowance_in_pay !== undefined) setIncludeAllowanceInPay(settings.include_allowance_in_pay);
        if (settings.enable_tax_computation !== undefined) setEnableTaxComputation(settings.enable_tax_computation);
        if (settings.include_sss_deductions !== undefined) setIncludeSSSDeductions(settings.include_sss_deductions);
        if (settings.include_philhealth_deductions !== undefined) setIncludePhilHealthDeductions(settings.include_philhealth_deductions);
        if (settings.include_pagibig_deductions !== undefined) setIncludePagIBIGDeductions(settings.include_pagibig_deductions);
        if (settings.payroll_period) setPayrollPeriod(settings.payroll_period);
        if (settings.enable_leave_management !== undefined) setEnableLeaveManagement(settings.enable_leave_management);
        if (settings.max_leave_days_per_month) setMaxLeaveDaysPerMonth(settings.max_leave_days_per_month);
        if (settings.require_leave_approval !== undefined) setRequireLeaveApproval(settings.require_leave_approval);
        if (settings.enable_hr_reports_dashboard !== undefined) setEnableHRReportsDashboard(settings.enable_hr_reports_dashboard);
        if (settings.include_attendance_summary !== undefined) setIncludeAttendanceSummary(settings.include_attendance_summary);
        if (settings.enable_performance_reviews !== undefined) setEnablePerformanceReviews(settings.enable_performance_reviews);
        if (settings.enable_employee_self_service !== undefined) setEnableEmployeeSelfService(settings.enable_employee_self_service);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    }
  };

  const testNotification = async () => {
    setShowTestNotification(true);
    setTimeout(() => {
      setShowTestNotification(false);
      setSuccess('Test notification sent successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }, 2000);
  };

  const addIpAddress = (list: 'whitelist' | 'banlist') => {
    if (!newIpAddress.trim()) return;
    
    if (list === 'whitelist') {
      setIpWhitelist([...ipWhitelist, newIpAddress.trim()]);
    } else {
      setIpBanlist([...ipBanlist, newIpAddress.trim()]);
    }
    setNewIpAddress('');
  };

  const removeIpAddress = (ip: string, list: 'whitelist' | 'banlist') => {
    if (list === 'whitelist') {
      setIpWhitelist(ipWhitelist.filter(addr => addr !== ip));
    } else {
      setIpBanlist(ipBanlist.filter(addr => addr !== ip));
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('is_active', true)
        .in('role', ['manager', 'admin', 'super-admin'])
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('view_branch_cards')
        .select('*')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
      setError('Failed to load branches: ' + err.message);
    }
  };

  const loadPosTerminals = async () => {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select(`
          id,
          terminal_name,
          terminal_code,
          branch_id,
          status,
          assigned_user_id,
          last_sync,
          created_at,
          updated_at,
          notes,
          branches!inner(id, name),
          users!left(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedTerminals = data?.map(terminal => ({
        id: terminal.id,
        name: terminal.terminal_name,
        terminalId: terminal.terminal_code,
        branchId: terminal.branch_id,
        branchName: terminal.branches?.name || 'Unknown Branch',
        status: terminal.status,
        assignedUserId: terminal.assigned_user_id,
        assignedUser: terminal.users ? {
          id: terminal.users.id,
          name: `${terminal.users.first_name} ${terminal.users.last_name}`,
          email: terminal.users.email
        } : null,
        lastSync: terminal.last_sync,
        notes: terminal.notes,
        created_at: terminal.created_at,
        updated_at: terminal.updated_at
      })) || [];

      setPosTerminals(transformedTerminals);
    } catch (err: any) {
      console.error('Error loading POS terminals:', err);
      setError('Failed to load POS terminals: ' + err.message);
    }
  };

  const loadPosAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('is_active', true)
        .in('role', ['cashier', 'manager', 'admin', 'super-admin'])
        .order('first_name');

      if (error) throw error;
      setPosAccounts(data || []);
    } catch (err: any) {
      console.error('Error loading POS accounts:', err);
      setError('Failed to load POS accounts: ' + err.message);
    }
  };

  const handleSaveSettings = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Get a user from the users table to use as the updater
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'super-admin')
      .limit(1)
      .single();

    if (userError || !currentUser) {
      console.error('User lookup error:', userError);
      throw new Error('Unable to identify user. Please ensure you are logged in.');
    }

    const settings = {
      app_name: appName,
      company_name: companyName,
      contact_email: contactEmail,
      support_phone: supportPhone,
      company_address: companyAddress,
      company_logo: companyLogo,
      brand_color: brandColor,
      currency,
      auto_save: autoSave,
      show_tooltips: showTooltips,
      compact_view: compactView,
      items_per_page: itemsPerPage,
      date_format: dateFormat,
      receipt_header: receiptHeader,
      receipt_footer: receiptFooter,
      default_branch: defaultBranch,
      selected_timezone: selectedTimezone,
      selected_theme: selectedTheme,
      selected_language: selectedLanguage,
      session_timeout: sessionTimeout,
      require_2fa: require2FA,
      password_min_length: passwordMinLength,
      password_require_special: passwordRequireSpecial,
      password_expiration: passwordExpiration,
      login_attempts: loginAttempts,
      lockout_duration: lockoutDuration,
      ip_whitelist: ipWhitelist,
      ip_banlist: ipBanlist,
      audit_log_visibility: auditLogVisibility,
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      sms_notifications: smsNotifications,
      low_stock_alerts: lowStockAlerts,
      sales_alerts: salesAlerts,
      system_alerts: systemAlerts,
      new_order_alerts: newOrderAlerts,
      staff_activity_alerts: staffActivityAlerts,
      bcc_manager: bccManager,
      manager_email: managerEmail,
      backup_frequency: backupFrequency,
      retention_period: retentionPeriod,
      data_encryption: dataEncryption,
      audit_logging: auditLogging,
      export_format: exportFormat,
      auto_backup: autoBackup,
      backup_location: backupLocation,
      pwa_name: pwaName,
      pwa_theme: pwaTheme,
      pwa_logo: pwaLogo,
      online_ordering_enabled: onlineOrderingEnabled,
      default_branch_for_orders: defaultBranchForOrders,
      delivery_enabled: deliveryEnabled,
      pickup_enabled: pickupEnabled,
      maintenance_mode: maintenanceMode,
      push_notifications_enabled: pushNotificationsEnabled,
      pwa_version: pwaVersion,
      // HR Management Settings
      enable_deduction_for_absences: enableDeductionForAbsences,
      enable_overtime_tracking: enableOvertimeTracking,
      auto_mark_late_employees: autoMarkLateEmployees,
      late_threshold_minutes: lateThresholdMinutes,
      include_allowance_in_pay: includeAllowanceInPay,
      enable_tax_computation: enableTaxComputation,
      include_sss_deductions: includeSSSDeductions,
      include_philhealth_deductions: includePhilHealthDeductions,
      include_pagibig_deductions: includePagIBIGDeductions,
      payroll_period: payrollPeriod,
      enable_leave_management: enableLeaveManagement,
      max_leave_days_per_month: maxLeaveDaysPerMonth,
      require_leave_approval: requireLeaveApproval,
      enable_hr_reports_dashboard: enableHRReportsDashboard,
      include_attendance_summary: includeAttendanceSummary,
      enable_performance_reviews: enablePerformanceReviews,
      enable_employee_self_service: enableEmployeeSelfService
    };

    console.log('Saving settings with user ID:', currentUser.id);
    console.log('Settings payload:', settings);

    const { data, error: saveError } = await supabase.rpc('set_system_setting', {
      setting_key: 'app_settings',
      setting_value: settings,
      setting_description: 'Main application settings',
      is_public_setting: false,
      user_id: currentUser.id
    });

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }
    
    // ✅ ADD THESE 2 LINES - Clear the settings cache
    settingsService.clearCache();
    console.log('✅ Settings cache cleared - HR modules will use new settings');
    
    console.log('Settings saved successfully:', data);
    
    setError(null);
    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    console.error('Error saving settings:', err);
    setError('Failed to save settings: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      {/* Existing general settings content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure your basic business details and branding.</p>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Authentication Settings</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Manage security and authentication preferences.</p>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure how you receive alerts and notifications.</p>
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
                <p className="text-xs text-gray-500 font-normal mt-1">How often payroll is processed</p>
              </label>
              <select
                value={payrollPeriod}
                onChange={(e) => setPayrollPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="monthly">Monthly</option>
                <option value="semi-monthly">Semi-Monthly (15th & 30th)</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Management Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Leave Management Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Leave Management</span>
                  <p className="text-xs text-gray-500 mt-1">Allow employees to request leave</p>
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
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Require Leave Approval</span>
                  <p className="text-xs text-gray-500 mt-1">Manager must approve all leave requests</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireLeaveApproval}
                  onChange={(e) => setRequireLeaveApproval(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                  disabled={!enableLeaveManagement}
                />
              </label>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Leave Days Per Month
                <p className="text-xs text-gray-500 font-normal mt-1">Maximum number of leave days an employee can take per month</p>
              </label>
              <input
                type="number"
                min="0"
                max="31"
                value={maxLeaveDaysPerMonth}
                onChange={(e) => setMaxLeaveDaysPerMonth(Number(e.target.value))}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!enableLeaveManagement}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">HR Reports Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable HR Reports Dashboard</span>
                  <p className="text-xs text-gray-500 mt-1">Show HR analytics and reports section</p>
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
                  <p className="text-xs text-gray-500 mt-1">Include attendance data in HR reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeAttendanceSummary}
                  onChange={(e) => setIncludeAttendanceSummary(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 ml-4"
                  disabled={!enableHRReportsDashboard}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced HR Features Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Advanced Features</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Performance Reviews</span>
                  <p className="text-xs text-gray-500 mt-1">Allow managers to conduct employee reviews</p>
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
                  <p className="text-xs text-gray-500 mt-1">Let employees view their own records</p>
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

      {/* HR Settings Summary Card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Current HR Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Attendance</div>
            <div className="text-lg font-semibold text-gray-900">
              {enableDeductionForAbsences && enableOvertimeTracking ? '✓ Active' : '⚠ Partial'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Payroll</div>
            <div className="text-lg font-semibold text-gray-900">
              {payrollPeriod === 'monthly' ? 'Monthly' : payrollPeriod === 'semi-monthly' ? 'Semi-Monthly' : 'Bi-Weekly'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Leave Management</div>
            <div className="text-lg font-semibold text-gray-900">
              {enableLeaveManagement ? '✓ Enabled' : '✗ Disabled'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">HR Reports</div>
            <div className="text-lg font-semibold text-gray-900">
              {enableHRReportsDashboard ? '✓ Active' : '✗ Inactive'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <HardDrive className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Backup & Restore</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Manage your data backups and restoration options.</p>
      </div>
    </div>
  );

  const renderPWASettings = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">PWA Branding & Identity</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure your Progressive Web App settings.</p>
      </div>
    </div>
  );

  const renderBranchManagement = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Building className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Branch Management</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Manage your branch locations and settings.</p>
      </div>
    </div>
  );

  const renderPosTerminalManagement = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Monitor className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">POS Terminal Management</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure your POS terminals and accounts.</p>
      </div>
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
              {activeSection === 'pwa' && renderPWASettings()}
              {activeSection === 'data' && renderDataSettings()}
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