import React, { useEffect, useState } from 'react';
import { 
  Settings, Lock, Bell, Mail, Shield, Download, Upload, 
  Save, RefreshCw, Monitor, 
  Smartphone, MapPin, Phone, Building, X, Search, Plus,
  Palette, AlertTriangle, CheckCircle, Trash2,
  FileText, HardDrive, Edit3, Ban,
  TestTube, ShieldCheck, Activity, Settings2, User,
  Clock, DollarSign, Calendar, BarChart3, Users, LogOut
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
      id: 'pwa',
      title: 'PWA Settings',
      icon: Smartphone,
      description: 'Progressive web app and kiosk configurations',
      bgColor: 'bg-indigo-50',
      color: 'text-indigo-600'
    },
    {
      id: 'data',
      title: 'Data & Backup',
      icon: HardDrive,
      description: 'Database, backup, and data retention policies',
      bgColor: 'bg-green-50',
      color: 'text-green-600'
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
  }, []);

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

  const fetchSettings = async () => {
    try {
      const s = await settingsService.getAllSettings();

      // Support both sectioned and flat settings
      const g = s.general || {};
      const sec = s.security || {};
      const notif = s.notifications || {};
      const hr = s.hr || {};
      const data = s.data || {};
      const pwa = s.pwa || {};

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
      setSmsNotifications((notif.smsNotifications ?? s.sms_notifications) ?? smsNotifications);
      setLowStockAlerts((notif.lowStockAlerts ?? s.low_stock_alerts) ?? lowStockAlerts);
      setSalesAlerts((notif.salesAlerts ?? s.sales_alerts) ?? salesAlerts);
      setSystemAlerts((notif.systemAlerts ?? s.system_alerts) ?? systemAlerts);
      setNewOrderAlerts((notif.newOrderAlerts ?? s.new_order_alerts) ?? newOrderAlerts);
      setStaffActivityAlerts((notif.staffActivityAlerts ?? s.staff_activity_alerts) ?? staffActivityAlerts);
      setBccManager((notif.bccManager ?? s.bcc_manager) ?? bccManager);
      setManagerEmail((notif.managerEmail ?? s.manager_email) ?? managerEmail);

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

      // Data
      setBackupFrequency((data.backupFrequency ?? s.backup_frequency) ?? backupFrequency);
      setRetentionPeriod((data.retentionPeriod ?? s.retention_period) ?? retentionPeriod);
      setDataEncryption((data.dataEncryption ?? s.data_encryption) ?? dataEncryption);
      setAuditLogging((data.auditLogging ?? s.audit_logging) ?? auditLogging);
      setExportFormat((data.exportFormat ?? s.export_format) ?? exportFormat);
      setAutoBackup((data.autoBackup ?? s.auto_backup) ?? autoBackup);
      setBackupLocation((data.backupLocation ?? s.backup_location) ?? backupLocation);

      // PWA
      setPwaName((pwa.pwaName ?? s.pwa_name) ?? pwaName);
      setPwaTheme((pwa.pwaTheme ?? s.pwa_theme) ?? pwaTheme);
      setOnlineOrderingEnabled((pwa.onlineOrderingEnabled ?? s.online_ordering_enabled) ?? onlineOrderingEnabled);
      setDefaultBranchForOrders((pwa.defaultBranchForOrders ?? s.default_branch_for_orders) ?? defaultBranchForOrders);
      setDeliveryEnabled((pwa.deliveryEnabled ?? s.delivery_enabled) ?? deliveryEnabled);
      setPickupEnabled((pwa.pickupEnabled ?? s.pickup_enabled) ?? pickupEnabled);
      setMaintenanceMode((pwa.maintenanceMode ?? s.maintenance_mode) ?? maintenanceMode);
      setPushNotificationsEnabled((pwa.pushNotificationsEnabled ?? s.push_notifications_enabled) ?? pushNotificationsEnabled);
      if (s.pwa_version) setPwaVersion(s.pwa_version);
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
          smsNotifications,
          lowStockAlerts,
          salesAlerts,
          systemAlerts,
          newOrderAlerts,
          staffActivityAlerts,
          bccManager,
          managerEmail
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
        data: {
          backupFrequency,
          retentionPeriod,
          dataEncryption,
          auditLogging,
          exportFormat,
          autoBackup,
          backupLocation
        },
        pwa: {
          pwaName,
          pwaTheme,
          onlineOrderingEnabled,
          defaultBranchForOrders,
          deliveryEnabled,
          pickupEnabled,
          maintenanceMode,
          pushNotificationsEnabled
        }
      };

      await settingsService.updateSettings(settings);
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
                <div className="text-sm text-gray-500">Receive updates via email</div>
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
                <div className="text-sm text-gray-500">Browser and mobile push notifications</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">SMS Notifications</div>
                <div className="text-sm text-gray-500">Text message alerts for critical updates</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
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
              checked={salesAlerts}
              onChange={(e) => setSalesAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">Sales Alerts</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={systemAlerts}
              onChange={(e) => setSystemAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">System Alerts</span>
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
              checked={staffActivityAlerts}
              onChange={(e) => setStaffActivityAlerts(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">Staff Activity Alerts</span>
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
        
        <div className="space-y-4">
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

  const renderDataSettings = () => (
    <div className="space-y-8">
      {/* Backup Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Backup Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Frequency
            </label>
            <select
              value={backupFrequency}
              onChange={(e) => setBackupFrequency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Location
            </label>
            <select
              value={backupLocation}
              onChange={(e) => setBackupLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="cloud">Cloud Storage</option>
              <option value="local">Local Storage</option>
              <option value="both">Both Cloud & Local</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retention Period (days)
            </label>
            <input
              type="number"
              value={retentionPeriod}
              onChange={(e) => setRetentionPeriod(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="30"
              max="3650"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              id="autoBackup"
            />
            <label htmlFor="autoBackup" className="text-sm text-gray-700">
              Enable automatic backups
            </label>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Backup Now
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            View Backup History
          </button>
        </div>
      </div>

      {/* Data Security Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Data Security</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={dataEncryption}
              onChange={(e) => setDataEncryption(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Enable data encryption at rest</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={auditLogging}
              onChange={(e) => setAuditLogging(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Enable audit logging for all data changes</span>
          </label>
        </div>
      </div>

      {/* Export Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Upload className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Export Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPWASettings = () => (
    <div className="space-y-8">
      {/* PWA Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">PWA Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PWA Name
            </label>
            <input
              type="text"
              value={pwaName}
              onChange={(e) => setPwaName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Agrivet Kiosk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Style
            </label>
            <select
              value={pwaTheme}
              onChange={(e) => setPwaTheme(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="dark-green">Dark Green</option>
              <option value="light-blue">Light Blue</option>
              <option value="modern-dark">Modern Dark</option>
              <option value="classic-light">Classic Light</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Branch for Orders
            </label>
            <select
              value={defaultBranchForOrders}
              onChange={(e) => setDefaultBranchForOrders(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="main">Main Branch</option>
              <option value="branch1">Branch 1</option>
              <option value="branch2">Branch 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version
            </label>
            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {pwaVersion}
            </div>
          </div>
        </div>
      </div>

      {/* Online Features Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Online Features</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <div className="font-medium text-gray-900">Online Ordering</div>
              <div className="text-sm text-gray-500">Allow customers to place orders online</div>
            </div>
            <input
              type="checkbox"
              checked={onlineOrderingEnabled}
              onChange={(e) => setOnlineOrderingEnabled(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <div className="font-medium text-gray-900">Delivery Service</div>
              <div className="text-sm text-gray-500">Enable delivery options for orders</div>
            </div>
            <input
              type="checkbox"
              checked={deliveryEnabled}
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <div className="font-medium text-gray-900">Pickup Orders</div>
              <div className="text-sm text-gray-500">Allow customers to pick up orders</div>
            </div>
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <div className="font-medium text-gray-900">Push Notifications</div>
              <div className="text-sm text-gray-500">Send push notifications to app users</div>
            </div>
            <input
              type="checkbox"
              checked={pushNotificationsEnabled}
              onChange={(e) => setPushNotificationsEnabled(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* Maintenance Mode Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
        </div>
        
        <label className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Enable Maintenance Mode</div>
            <div className="text-sm text-gray-500">Temporarily disable PWA access for updates</div>
          </div>
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
        </label>
      </div>
    </div>
  );

  const renderBranchManagement = () => (
    <div className="space-y-8">
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
            onClick={() => setShowAddBranchModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Sample branch items */}
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Main Branch</h4>
                  <p className="text-sm text-gray-500">123 Business St, Manila</p>
                  <p className="text-xs text-gray-400">Branch Code: MAIN</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Active
                  </span>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
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
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Allow inter-branch transfers</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Share inventory across branches</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Enable branch-specific pricing</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPosTerminalManagement = () => (
    <div className="space-y-8">
      {/* POS Terminal Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Monitor className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">POS Terminal Settings</h3>
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
              Receipt Number Prefix
            </label>
            <input
              type="text"
              value={posSettings.receiptNumberPrefix}
              onChange={(e) => setPosSettings({...posSettings, receiptNumberPrefix: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="RCP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offline Sync Interval (minutes)
            </label>
            <input
              type="number"
              value={posSettings.syncInterval}
              onChange={(e) => setPosSettings({...posSettings, syncInterval: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min="1"
              max="60"
            />
          </div>
        </div>
      </div>

      {/* POS Features Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings2 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">POS Features</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.autoPrintReceipt}
              onChange={(e) => setPosSettings({...posSettings, autoPrintReceipt: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Auto-print receipts</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.showItemImages}
              onChange={(e) => setPosSettings({...posSettings, showItemImages: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Show item images</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableQuickKeys}
              onChange={(e) => setPosSettings({...posSettings, enableQuickKeys: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable quick keys</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableBulkOperations}
              onChange={(e) => setPosSettings({...posSettings, enableBulkOperations: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable bulk operations</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableInventoryTracking}
              onChange={(e) => setPosSettings({...posSettings, enableInventoryTracking: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable inventory tracking</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enablePriceOverrides}
              onChange={(e) => setPosSettings({...posSettings, enablePriceOverrides: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable price overrides</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.requireManagerForOverrides}
              onChange={(e) => setPosSettings({...posSettings, requireManagerForOverrides: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Require manager for overrides</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableCustomerSearch}
              onChange={(e) => setPosSettings({...posSettings, enableCustomerSearch: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable customer search</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableBarcodeGeneration}
              onChange={(e) => setPosSettings({...posSettings, enableBarcodeGeneration: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable barcode generation</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableOfflineMode}
              onChange={(e) => setPosSettings({...posSettings, enableOfflineMode: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable offline mode</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableAuditLog}
              onChange={(e) => setPosSettings({...posSettings, enableAuditLog: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable audit log</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableReceiptNumbering}
              onChange={(e) => setPosSettings({...posSettings, enableReceiptNumbering: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable receipt numbering</span>
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
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableMultiPayment}
              onChange={(e) => setPosSettings({...posSettings, enableMultiPayment: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable multiple payment methods</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enablePartialPayments}
              onChange={(e) => setPosSettings({...posSettings, enablePartialPayments: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable partial payments</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableLayaway}
              onChange={(e) => setPosSettings({...posSettings, enableLayaway: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable layaway</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={posSettings.enableInstallments}
              onChange={(e) => setPosSettings({...posSettings, enableInstallments: e.target.checked})}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Enable installment payments</span>
          </label>
        </div>
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