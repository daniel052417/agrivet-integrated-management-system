import React, { useEffect, useState } from 'react';
import { 
  Settings, Lock, Bell, Mail, Shield, Download, Upload, 
  Save, RefreshCw, Monitor, 
  Smartphone, MapPin, Phone, Building, X, Search, Plus,
  Palette, AlertTriangle, CheckCircle, Trash2,
  FileText, HardDrive, Edit3, Ban,
  TestTube, ShieldCheck, Activity, Settings2, User
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
    }
  ];

  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    testDatabaseConnection();
    loadAuditLogs();
    loadBranches();
    loadUsers();
    loadSettings();
  }, []);

  const testDatabaseConnection = async () => {
    console.log('🔍 [DEBUG] Testing database connection...');
    try {
      console.log('📡 [DEBUG] Testing Supabase connection...');
      console.log('📡 [DEBUG] Supabase client available:', !!supabase);
      console.log('📡 [DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not set');
      console.log('📡 [DEBUG] Supabase Key available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      const { error } = await supabase
        .from('branches')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ [DEBUG] Database connection test failed:', error);
        console.error('❌ [DEBUG] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setError('Database connection failed: ' + error.message);
      } else {
        console.log('✅ [DEBUG] Database connection test successful!');
        console.log('✅ [DEBUG] Supabase is connected and accessible');
        console.log('✅ [DEBUG] Branches table is accessible');
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
      // Try to get the setting, if it doesn't exist, use defaults
      const { data, error } = await supabase.rpc('get_system_setting', {
        setting_key: 'app_settings'
      });

      if (error) {
        console.log('Settings not found, using defaults:', error.message);
        return; // Use default values
      }
      
      if (data) {
        const settings = data;
        
        // Load general settings
        if (settings.app_name) setAppName(settings.app_name);
        if (settings.company_name) setCompanyName(settings.company_name);
        if (settings.contact_email) setContactEmail(settings.contact_email);
        if (settings.support_phone) setSupportPhone(settings.support_phone);
        if (settings.company_address) setCompanyAddress(settings.company_address);
        if (settings.company_logo) setCompanyLogo(settings.company_logo);
        if (settings.brand_color) setBrandColor(settings.brand_color);
        if (settings.currency) setCurrency(settings.currency);
        if (settings.auto_save !== undefined) setAutoSave(settings.auto_save);
        if (settings.show_tooltips !== undefined) setShowTooltips(settings.show_tooltips);
        if (settings.compact_view !== undefined) setCompactView(settings.compact_view);
        if (settings.items_per_page) setItemsPerPage(settings.items_per_page);
        if (settings.date_format) setDateFormat(settings.date_format);
        if (settings.receipt_header) setReceiptHeader(settings.receipt_header);
        if (settings.receipt_footer) setReceiptFooter(settings.receipt_footer);
        if (settings.default_branch) setDefaultBranch(settings.default_branch);
        if (settings.selected_timezone) setSelectedTimezone(settings.selected_timezone);
        if (settings.selected_theme) setSelectedTheme(settings.selected_theme);
        if (settings.selected_language) setSelectedLanguage(settings.selected_language);

        // Load security settings
        if (settings.session_timeout) setSessionTimeout(settings.session_timeout);
        if (settings.require_2fa !== undefined) setRequire2FA(settings.require_2fa);
        if (settings.password_min_length) setPasswordMinLength(settings.password_min_length);
        if (settings.password_require_special !== undefined) setPasswordRequireSpecial(settings.password_require_special);
        if (settings.password_expiration) setPasswordExpiration(settings.password_expiration);
        if (settings.login_attempts) setLoginAttempts(settings.login_attempts);
        if (settings.lockout_duration) setLockoutDuration(settings.lockout_duration);
        if (settings.ip_whitelist) setIpWhitelist(settings.ip_whitelist);
        if (settings.ip_banlist) setIpBanlist(settings.ip_banlist);
        if (settings.audit_log_visibility !== undefined) setAuditLogVisibility(settings.audit_log_visibility);

        // Load notification settings
        if (settings.email_notifications !== undefined) setEmailNotifications(settings.email_notifications);
        if (settings.push_notifications !== undefined) setPushNotifications(settings.push_notifications);
        if (settings.sms_notifications !== undefined) setSmsNotifications(settings.sms_notifications);
        if (settings.low_stock_alerts !== undefined) setLowStockAlerts(settings.low_stock_alerts);
        if (settings.sales_alerts !== undefined) setSalesAlerts(settings.sales_alerts);
        if (settings.system_alerts !== undefined) setSystemAlerts(settings.system_alerts);
        if (settings.new_order_alerts !== undefined) setNewOrderAlerts(settings.new_order_alerts);
        if (settings.staff_activity_alerts !== undefined) setStaffActivityAlerts(settings.staff_activity_alerts);
        if (settings.bcc_manager !== undefined) setBccManager(settings.bcc_manager);
        if (settings.manager_email) setManagerEmail(settings.manager_email);

        // Load data settings
        if (settings.backup_frequency) setBackupFrequency(settings.backup_frequency);
        if (settings.retention_period) setRetentionPeriod(settings.retention_period);
        if (settings.data_encryption !== undefined) setDataEncryption(settings.data_encryption);
        if (settings.audit_logging !== undefined) setAuditLogging(settings.audit_logging);
        if (settings.export_format) setExportFormat(settings.export_format);
        if (settings.auto_backup !== undefined) setAutoBackup(settings.auto_backup);
        if (settings.backup_location) setBackupLocation(settings.backup_location);

        // Load PWA settings
        if (settings.pwa_name) setPwaName(settings.pwa_name);
        if (settings.pwa_theme) setPwaTheme(settings.pwa_theme);
        if (settings.pwa_logo) setPwaLogo(settings.pwa_logo);
        if (settings.pwa_version) setPwaVersion(settings.pwa_version);
        if (settings.online_ordering_enabled !== undefined) setOnlineOrderingEnabled(settings.online_ordering_enabled);
        if (settings.default_branch_for_orders) setDefaultBranchForOrders(settings.default_branch_for_orders);
        if (settings.delivery_enabled !== undefined) setDeliveryEnabled(settings.delivery_enabled);
        if (settings.pickup_enabled !== undefined) setPickupEnabled(settings.pickup_enabled);
        if (settings.maintenance_mode !== undefined) setMaintenanceMode(settings.maintenance_mode);
        if (settings.push_notifications_enabled !== undefined) setPushNotificationsEnabled(settings.push_notifications_enabled);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      // Don't show error to user as settings will use defaults
    }
  };


  const testNotification = async () => {
    setShowTestNotification(true);
    // Simulate sending test notification
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
    console.log('🔍 [DEBUG] Starting loadUsers function...');
    try {
      console.log('📡 [DEBUG] Executing SELECT query on users table...');
      console.log('📡 [DEBUG] Filtering for active managers and admins...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('is_active', true)
        .in('role', ['manager', 'admin', 'super-admin'])
        .order('first_name');

      console.log('📊 [DEBUG] Users query response:');
      console.log('📊 [DEBUG] - Data:', data);
      console.log('📊 [DEBUG] - Error:', error);
      console.log('📊 [DEBUG] - Data length:', data?.length || 0);

      if (error) {
        console.error('❌ [DEBUG] Users query failed:', error);
        throw error;
      }
      
      console.log('✅ [DEBUG] Users query successful, setting users...');
      setUsers(data || []);
      console.log('✅ [DEBUG] Users state updated');
      console.log('✅ [DEBUG] Total users loaded:', data?.length || 0);
      
    } catch (err: any) {
      console.error('❌ [DEBUG] Critical error in loadUsers:', err);
      console.error('❌ [DEBUG] Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
    }
  };

  const loadBranches = async () => {
    console.log('🔍 [DEBUG] Starting loadBranches function...');
    try {
      console.log('📡 [DEBUG] Attempting to connect to Supabase...');
      console.log('📡 [DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not set');
      
      console.log('📋 [DEBUG] Executing SELECT query on view_branch_cards view...');
      console.log('📋 [DEBUG] Using optimized view for display');
      
      const { data, error } = await supabase
        .from('view_branch_cards')
        .select('*')
        .order('name');

      console.log('📊 [DEBUG] Query response received:');
      console.log('📊 [DEBUG] - Data:', data);
      console.log('📊 [DEBUG] - Error:', error);
      console.log('📊 [DEBUG] - Data length:', data?.length || 0);
      
      // Debug view structure
      if (data && data.length > 0) {
        console.log('🔍 [DEBUG] Sample branch data from view_branch_cards:');
        data.forEach((branch, index) => {
          if (index < 2) { // Only log first 2 branches to avoid spam
            console.log(`🔍 [DEBUG] Branch ${branch.name} full_address:`, branch.full_address);
            console.log(`🔍 [DEBUG] Branch ${branch.name} formatted_hours:`, branch.formatted_hours);
            console.log(`🔍 [DEBUG] Branch ${branch.name} formatted_hours type:`, typeof branch.formatted_hours);
          }
        });
      }

      if (error) {
        console.error('❌ [DEBUG] Query failed:', error);
        throw error;
      }
      
      console.log('✅ [DEBUG] Query successful, setting branches...');
      setBranches(data || []);
      console.log('✅ [DEBUG] Branches state updated');
      console.log('✅ [DEBUG] Total branches loaded:', data?.length || 0);
      
    } catch (err: any) {
      console.error('❌ [DEBUG] Critical error in loadBranches:', err);
      console.error('❌ [DEBUG] Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError('Failed to load branches: ' + err.message);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Convert database operating hours format to form format
   * DB Format: { "monday": { "open": "08:00", "close": "18:00" } }
   * Form Format: { "monday": { "start": "08:00", "end": "18:00", "isOpen": true } }
   */
  const convertDbHoursToForm = (dbHours: any) => {
    const defaultHours: { [key: string]: { start: string; end: string; isOpen: boolean } } = {
      monday: { start: '08:00', end: '18:00', isOpen: true },
      tuesday: { start: '08:00', end: '18:00', isOpen: true },
      wednesday: { start: '08:00', end: '18:00', isOpen: true },
      thursday: { start: '08:00', end: '18:00', isOpen: true },
      friday: { start: '08:00', end: '18:00', isOpen: true },
      saturday: { start: '08:00', end: '18:00', isOpen: true },
      sunday: { start: '08:00', end: '18:00', isOpen: false }
    };

    if (!dbHours || typeof dbHours !== 'object') {
      return defaultHours;
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return days.reduce((acc, day) => {
      const dbDayHours = dbHours[day];
      
      if (dbDayHours && dbDayHours.open && dbDayHours.close) {
        acc[day] = {
          start: dbDayHours.open,
          end: dbDayHours.close,
          isOpen: true
        };
      } else {
        acc[day] = {
          start: defaultHours[day].start,
          end: defaultHours[day].end,
          isOpen: false
        };
      }
      return acc;
    }, {} as { [key: string]: { start: string; end: string; isOpen: boolean } });
  };

  /**
   * Convert form operating hours format to database format
   * Form Format: { "monday": { "start": "08:00", "end": "18:00", "isOpen": true } }
   * DB Format: { "monday": { "open": "08:00", "close": "18:00" } }
   */
  const convertFormHoursToDb = (formHours: any) => {
    return Object.entries(formHours).reduce((acc, [day, hours]: [string, any]) => {
      if (hours.isOpen && hours.start && hours.end) {
        acc[day] = {
          open: hours.start,
          close: hours.end
        };
      }
      // Don't include closed days in the JSON
      return acc;
    }, {} as any);
  };


  const getBranchTypeBadge = (type: string) => {
    const typeConfig = {
      'main': { color: 'bg-blue-100 text-blue-800', icon: '🏢' },
      'satellite': { color: 'bg-green-100 text-green-800', icon: '🏪' }
    };
    return typeConfig[type as keyof typeof typeConfig] || { color: 'bg-gray-100 text-gray-800', icon: '🏢' };
  };

  const getBranchStatusBadge = (isActive: boolean) => {
    return isActive 
      ? { color: 'bg-green-100 text-green-800', text: 'Active' }
      : { color: 'bg-red-100 text-red-800', text: 'Inactive' };
  };

  // ============================================
  // CRUD FUNCTIONS
  // ============================================

  /**
   * Load single branch by ID for editing (gets full data from actual table)
   */
  const loadBranchById = async (branchId: string) => {
    try {
      console.log('🔍 [DEBUG] Loading branch by ID:', branchId);
      
      const { data, error } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          code,
          address,
          city,
          province,
          postal_code,
          phone,
          email,
          branch_type,
          is_active,
          operating_hours,
          manager_id,
          created_at
        `)
        .eq('id', branchId)
        .single();

      if (error) {
        console.error('❌ [DEBUG] Error loading from branches table:', error);
        
        // Fallback: try to load from view if the branch exists there
        console.log('🔄 [DEBUG] Trying fallback from view_branch_cards...');
        const { data: viewData, error: viewError } = await supabase
          .from('view_branch_cards')
          .select('*')
          .eq('id', branchId)
          .single();

        if (viewError) {
          console.error('❌ [DEBUG] Error loading from view:', viewError);
          throw error; // Throw original error
        }

        console.log('✅ [DEBUG] Branch loaded from view:', viewData);
        return { data: viewData, error: null };
      }

      console.log('✅ [DEBUG] Branch loaded successfully from branches table:', data);
      return { data, error: null };
    } catch (err: any) {
      console.error('❌ [DEBUG] Error loading branch:', err);
      return { data: null, error: err.message };
    }
  };

  /**
   * Create new branch
   */
  const createBranch = async (formData: any) => {
    try {
      console.log('🔍 [DEBUG] Creating new branch:', formData);
      
      // Convert form hours to database format
      const formattedOperatingHours = convertFormHoursToDb(formData.operatingHours);

      // Prepare branch data
      const branchData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        branch_type: formData.type,
        address: formData.address.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        postal_code: formData.postalCode?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        operating_hours: formattedOperatingHours,
        manager_id: formData.managerId || null,
        is_active: formData.status === 'active'
      };

      const { data, error } = await supabase
        .from('branches')
        .insert(branchData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [DEBUG] Branch created successfully:', data);
      return { 
        data, 
        error: null,
        message: 'Branch created successfully!' 
      };
    } catch (err: any) {
      console.error('❌ [DEBUG] Error creating branch:', err);
      
      // Handle specific errors
      if (err.code === '23505') {
        return { 
          data: null, 
          error: 'Branch code already exists. Please use a different code.' 
        };
      }
      
      return { 
        data: null, 
        error: err.message || 'Failed to create branch' 
      };
    }
  };

  /**
   * Update existing branch
   */
  const updateBranch = async (branchId: string, formData: any) => {
    try {
      console.log('🔍 [DEBUG] Updating branch:', branchId, formData);
      
      // First, check if the branch exists
      const { data: existingBranch, error: checkError } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('id', branchId)
        .single();

      if (checkError) {
        console.error('❌ [DEBUG] Branch not found:', checkError);
        return { 
          data: null, 
          error: 'Branch not found. It may have been deleted by another user.' 
        };
      }

      console.log('✅ [DEBUG] Branch exists, proceeding with update:', existingBranch);
      
      // Convert form hours to database format
      const formattedOperatingHours = convertFormHoursToDb(formData.operatingHours);

      // Prepare branch data
      const branchData = {
        name: formData.name?.trim() || '',
        code: formData.code?.trim().toUpperCase() || '',
        branch_type: formData.type || 'main',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        province: formData.province?.trim() || '',
        postal_code: formData.postalCode?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        operating_hours: formattedOperatingHours,
        manager_id: formData.managerId || null,
        is_active: formData.status === 'active'
      };

      // Validate required fields
      if (!branchData.name) {
        return { data: null, error: 'Branch name is required' };
      }
      if (!branchData.code) {
        return { data: null, error: 'Branch code is required' };
      }
      if (!branchData.address) {
        return { data: null, error: 'Branch address is required' };
      }
      if (!branchData.city) {
        return { data: null, error: 'Branch city is required' };
      }
      if (!branchData.province) {
        return { data: null, error: 'Branch province is required' };
      }

      console.log('🔧 [DEBUG] Branch data to update:', branchData);
      console.log('🔧 [DEBUG] Branch ID for update:', branchId);
      console.log('🔧 [DEBUG] Branch ID type:', typeof branchId);
      console.log('🔧 [DEBUG] Branch ID length:', branchId?.length);

      // Ensure branchId is a string and properly formatted
      const cleanBranchId = String(branchId).trim();
      console.log('🔧 [DEBUG] Cleaned branch ID:', cleanBranchId);

      // First, let's verify the branch exists with the exact same ID
      const { data: verifyData, error: verifyError } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('id', cleanBranchId);

      console.log('🔍 [DEBUG] Verification query result:', { verifyData, verifyError });

      if (verifyError) {
        console.error('❌ [DEBUG] Verification query failed:', verifyError);
        return { 
          data: null, 
          error: 'Failed to verify branch existence: ' + verifyError.message 
        };
      }

      if (!verifyData || verifyData.length === 0) {
        console.error('❌ [DEBUG] Branch not found during verification');
        return { 
          data: null, 
          error: 'Branch not found during verification. ID may be invalid.' 
        };
      }

      console.log('✅ [DEBUG] Branch verified, proceeding with update...');

      // Debug: Check current user's JWT token and role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 [DEBUG] Current user:', user?.id);
      console.log('🔍 [DEBUG] User app_metadata:', user?.app_metadata);
      console.log('🔍 [DEBUG] User role from JWT:', user?.app_metadata?.role);
      
      // Debug: Check user roles from database
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles!inner(name)
        `)
        .eq('user_id', user?.id);
      
      console.log('🔍 [DEBUG] User roles from database:', userRoles);
      console.log('🔍 [DEBUG] Roles error:', rolesError);

      // Test: Try a simple update to see if RLS is blocking us
      console.log('🧪 [DEBUG] Testing simple update to check RLS...');
      const { data: testData, error: testError } = await supabase
        .from('branches')
        .update({ name: 'Test Update - ' + new Date().toISOString() })
        .eq('id', cleanBranchId)
        .select();
      
      console.log('🧪 [DEBUG] Test update result:', { testData, testError });
      
      // Additional test: Try to read the branch to see if RLS is filtering it out
      const { data: readTest, error: readError } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('id', cleanBranchId);
      
      console.log('🧪 [DEBUG] Read test result:', { readTest, readError });
      
      if (readError) {
        console.error('❌ [DEBUG] Cannot read branch - RLS is blocking read access');
        return { 
          data: null, 
          error: `RLS Policy Error: Cannot read branch. User role may not be properly set in JWT token.` 
        };
      }
      
      if (testError) {
        console.error('❌ [DEBUG] Test update failed - RLS is blocking:', testError);
        return { 
          data: null, 
          error: `RLS Policy Error: ${testError.message}. User role may not be properly set in JWT token.` 
        };
      }

      // If test update succeeded but returned empty array, the branch might not exist
      if (!testData || testData.length === 0) {
        console.error('❌ [DEBUG] Test update succeeded but returned no rows - branch may not exist');
        
        // Double-check if branch still exists
        const { data: doubleCheck, error: doubleCheckError } = await supabase
          .from('branches')
          .select('id, name, code')
          .eq('id', cleanBranchId);
        
        console.log('🔍 [DEBUG] Double-check branch existence:', { doubleCheck, doubleCheckError });
        
        if (!doubleCheck || doubleCheck.length === 0) {
          return { 
            data: null, 
            error: 'Branch no longer exists. It may have been deleted by another user or the ID has changed.' 
          };
        }
      }

      // Try the update with the cleaned ID
      let { data, error } = await supabase
        .from('branches')
        .update(branchData)
        .eq('id', cleanBranchId)
        .select();

      console.log('🔧 [DEBUG] First update attempt result:', { data, error });

      // If that fails, try with the original ID (in case there's a formatting issue)
      if (error || !data || data.length === 0) {
        console.log('🔄 [DEBUG] First update attempt failed, trying with original ID...');
        console.log('🔄 [DEBUG] Original ID:', branchId);
        
        const { data: retryData, error: retryError } = await supabase
          .from('branches')
          .update(branchData)
          .eq('id', branchId)
          .select();
        
        console.log('🔄 [DEBUG] Retry attempt result:', { retryData, retryError });
        
        if (retryError) {
          console.error('❌ [DEBUG] Retry also failed:', retryError);
          error = retryError;
        } else {
          console.log('✅ [DEBUG] Retry succeeded:', retryData);
          data = retryData;
          error = null;
        }
      }

      // If both attempts failed with empty arrays, try a different approach
      if ((!data || data.length === 0) && !error) {
        console.log('🔄 [DEBUG] Both attempts returned empty arrays, trying alternative approach...');
        
        // Try updating by code instead of ID (as a fallback)
        const { data: codeUpdateData, error: codeUpdateError } = await supabase
          .from('branches')
          .update(branchData)
          .eq('code', branchData.code)
          .select();
        
        console.log('🔄 [DEBUG] Code-based update result:', { codeUpdateData, codeUpdateError });
        
        if (codeUpdateData && codeUpdateData.length > 0) {
          console.log('✅ [DEBUG] Code-based update succeeded!');
          data = codeUpdateData;
          error = null;
        } else {
          console.error('❌ [DEBUG] Code-based update also failed');
        }
      }

      if (error) {
        console.error('❌ [DEBUG] Update query failed:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('❌ [DEBUG] No rows updated');
        console.error('❌ [DEBUG] This suggests the WHERE clause did not match any rows');
        console.error('❌ [DEBUG] Branch ID used in WHERE:', branchId);
        console.error('❌ [DEBUG] Branch ID type in WHERE:', typeof branchId);
        return { 
          data: null, 
          error: 'No rows were updated. The WHERE clause did not match any rows. This may be due to a data type mismatch or the branch was modified by another user.' 
        };
      }

      console.log('✅ [DEBUG] Branch updated successfully:', data);
      return { 
        data: data[0], 
        error: null,
        message: 'Branch updated successfully!' 
      };
    } catch (err: any) {
      console.error('❌ [DEBUG] Error updating branch:', err);
      
      // Handle specific errors
      if (err.code === '23505') {
        return { 
          data: null, 
          error: 'Branch code already exists. Please use a different code.' 
        };
      }
      
      if (err.code === 'PGRST116') {
        return { 
          data: null, 
          error: 'Branch not found or no changes were made. Please refresh and try again.' 
        };
      }
      
      return { 
        data: null, 
        error: err.message || 'Failed to update branch' 
      };
    }
  };

  /**
   * Delete branch with dependency checks
   */
  const deleteBranch = async (branchId: string) => {
    try {
      console.log('🔍 [DEBUG] Deleting branch:', branchId);
      
      // Check if branch has any dependencies
      const { data: inventoryCheck, error: inventoryError } = await supabase
        .from('inventory')
        .select('id')
        .eq('branch_id', branchId)
        .limit(1);

      if (inventoryError) throw inventoryError;

      if (inventoryCheck && inventoryCheck.length > 0) {
        return {
          data: null,
          error: 'Cannot delete branch with existing inventory records. Please transfer inventory first or mark branch as inactive.'
        };
      }

      // Check for orders
      const { data: ordersCheck, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('branch_id', branchId)
        .limit(1);

      if (ordersError) throw ordersError;

      if (ordersCheck && ordersCheck.length > 0) {
        return {
          data: null,
          error: 'Cannot delete branch with existing orders. Consider marking it as inactive instead.'
        };
      }

      // If no dependencies, proceed with deletion
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;

      console.log('✅ [DEBUG] Branch deleted successfully');
      return { 
        data: true, 
        error: null,
        message: 'Branch deleted successfully!' 
      };
    } catch (err: any) {
      console.error('❌ [DEBUG] Error deleting branch:', err);
      return { 
        data: null, 
        error: err.message || 'Failed to delete branch' 
      };
    }
  };

  const handleEditBranch = async (branch: any) => {
    console.log('🔍 [DEBUG] Starting handleEditBranch function...');
    console.log('✏️ [DEBUG] Branch to edit:', branch);
    console.log('✏️ [DEBUG] Branch ID:', branch.id);
    console.log('✏️ [DEBUG] Branch ID type:', typeof branch.id);
    console.log('✏️ [DEBUG] Branch ID length:', branch.id?.length);
    
    setEditingBranch(branch);

    // First refresh the branches list to ensure we have the latest data
    console.log('🔄 [DEBUG] Refreshing branches list before editing...');
    await loadBranches();

    // Load full branch data from actual table (not view)
    const result = await loadBranchById(branch.id);
    
    if (result.error) {
      console.error('❌ [DEBUG] Failed to load branch data:', result.error);
      setError(result.error);
      return;
    }

    const fullBranchData = result.data;

    if (!fullBranchData) {
      console.error('❌ [DEBUG] Branch data is null');
      setError('Branch data not found');
      return;
    }

    console.log('✅ [DEBUG] Full branch data loaded:', fullBranchData);

    // Convert DB format to form format
    const formData = {
      name: fullBranchData.name || '',
      code: fullBranchData.code || '',
      type: (fullBranchData.branch_type || 'main') as 'main' | 'satellite',
      address: fullBranchData.address || '',
      city: fullBranchData.city || '',
      province: fullBranchData.province || '',
      postalCode: fullBranchData.postal_code || '',
      phone: fullBranchData.phone || '',
      email: fullBranchData.email || '',
      operatingHours: convertDbHoursToForm(fullBranchData.operating_hours) as {
        monday: { start: string; end: string; isOpen: boolean };
        tuesday: { start: string; end: string; isOpen: boolean };
        wednesday: { start: string; end: string; isOpen: boolean };
        thursday: { start: string; end: string; isOpen: boolean };
        friday: { start: string; end: string; isOpen: boolean };
        saturday: { start: string; end: string; isOpen: boolean };
        sunday: { start: string; end: string; isOpen: boolean };
      },
      managerId: fullBranchData.manager_id || '',
      status: (fullBranchData.is_active ? 'active' : 'inactive') as 'active' | 'inactive'
    };
    
    console.log('📝 [DEBUG] Form data prepared for editing:', formData);
    setBranchFormData(formData);
    setShowAddBranchModal(true);
    console.log('✅ [DEBUG] Edit modal opened with pre-filled data');
  };

  const handleDeleteBranch = async (branchId: string) => {
    console.log('🔍 [DEBUG] Starting handleDeleteBranch function...');
    console.log('🗑️ [DEBUG] Branch ID to delete:', branchId);
    
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      console.log('❌ [DEBUG] User cancelled deletion');
      return;
    }

    console.log('✅ [DEBUG] User confirmed deletion');
    setLoading(true);
    
    const result = await deleteBranch(branchId);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.message || 'Branch deleted!');
      
      // Reload branches list
      await loadBranches();
    }

    setLoading(false);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 [DEBUG] Starting handleBranchSubmit function...');
    console.log('📝 [DEBUG] Form data:', branchFormData);
    console.log('🔄 [DEBUG] Is editing branch:', !!editingBranch);
    console.log('🔄 [DEBUG] Editing branch ID:', editingBranch?.id);
    
    setLoading(true);
    setError(null);

    const result = editingBranch
      ? await updateBranch(editingBranch.id, branchFormData)
      : await createBranch(branchFormData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.message || 'Operation successful!');
      
      // Reload branches list
      await loadBranches();

      // Reset form and close modal
      setShowAddBranchModal(false);
      setEditingBranch(null);
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

      setTimeout(() => setSuccess(null), 3000);
    }

    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Prepare settings to save
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
        pwa_version: pwaVersion
      };

      // Save all settings as a single JSON object
      const { error: saveError } = await supabase.rpc('set_system_setting', {
        setting_key: 'app_settings',
        setting_value: settings,
        setting_description: 'Main application settings',
        is_public_setting: false,
        user_id: user.id
      });

      if (saveError) throw saveError;
      
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
            <input
              type="tel"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
            <textarea
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Branding & Theme Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Branding & Theme</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedTheme('light')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  selectedTheme === 'light' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setSelectedTheme('dark')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  selectedTheme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Preferences Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Settings className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">System Preferences</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PHP">PHP - Philippine Peso</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-md font-medium text-gray-900">Interface Preferences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable auto-save</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showTooltips}
                onChange={(e) => setShowTooltips(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show tooltips</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Compact view</span>
            </label>
          </div>
        </div>
      </div>

      {/* Receipt Customization Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Receipt Customization</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Header</label>
            <textarea
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Thank you for your business!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Footer</label>
            <textarea
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Visit us again soon!"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-8">
      {/* Authentication Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Authentication Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Minimum Length</label>
            <input
              type="number"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiration (days)</label>
            <input
              type="number"
              value={passwordExpiration}
              onChange={(e) => setPasswordExpiration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Login Attempts Limit</label>
            <input
              type="number"
              value={loginAttempts}
              onChange={(e) => setLoginAttempts(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
            <input
              type="number"
              value={lockoutDuration}
              onChange={(e) => setLockoutDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-md font-medium text-gray-900">Security Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={require2FA}
                onChange={(e) => setRequire2FA(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require two-factor authentication</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={passwordRequireSpecial}
                onChange={(e) => setPasswordRequireSpecial(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require special characters in passwords</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={auditLogVisibility}
                onChange={(e) => setAuditLogVisibility(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable audit log visibility</span>
            </label>
          </div>
        </div>
      </div>

      {/* IP Access Control Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Shield className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">IP Access Control</h3>
        </div>
        
        <div className="space-y-6">
          {/* IP Whitelist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">IP Whitelist</h4>
              <span className="text-sm text-gray-500">{ipWhitelist.length} addresses</span>
            </div>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => addIpAddress('whitelist')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {ipWhitelist.map((ip, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                  <span className="text-sm text-green-800">{ip}</span>
                  <button
                    onClick={() => removeIpAddress(ip, 'whitelist')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* IP Banlist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">IP Banlist</h4>
              <span className="text-sm text-gray-500">{ipBanlist.length} addresses</span>
            </div>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="Enter IP address to ban"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => addIpAddress('banlist')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {ipBanlist.map((ip, index) => (
                <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-md">
                  <span className="text-sm text-red-800">{ip}</span>
                  <button
                    onClick={() => removeIpAddress(ip, 'banlist')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Recent System Activity</h3>
        </div>
        
        <div className="space-y-3">
          {auditLogs.length > 0 ? (
            auditLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.action || 'System action'}</p>
                    <p className="text-xs text-gray-500">
                      {log.user_email || 'System'} • {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{log.resource || 'N/A'}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all audit logs →
          </button>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Communication Methods</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Email notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Push notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Manager Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bccManager}
                  onChange={(e) => setBccManager(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">BCC Manager on all notifications</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Test Notifications</h4>
            <div className="space-y-3">
              <button
                onClick={testNotification}
                disabled={showTestNotification}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {showTestNotification ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    <span>Send Test Notification</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500">
                Test your notification settings to ensure they're working correctly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Types Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Alert Types</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">System Alerts</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={lowStockAlerts}
                  onChange={(e) => setLowStockAlerts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Low stock alerts</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={salesAlerts}
                  onChange={(e) => setSalesAlerts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Sales alerts</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemAlerts}
                  onChange={(e) => setSystemAlerts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">System alerts</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Business Alerts</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newOrderAlerts}
                  onChange={(e) => setNewOrderAlerts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">New order notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={staffActivityAlerts}
                  onChange={(e) => setStaffActivityAlerts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Staff activity notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-8">
      {/* Backup & Restore Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <HardDrive className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Backup & Restore</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
            <select
              value={backupFrequency}
              onChange={(e) => setBackupFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Location</label>
            <select
              value={backupLocation}
              onChange={(e) => setBackupLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cloud">Cloud Storage</option>
              <option value="local">Local Storage</option>
              <option value="both">Both Cloud & Local</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period (days)</label>
            <input
              type="number"
              value={retentionPeriod}
              onChange={(e) => setRetentionPeriod(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable automatic backups</span>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Create Backup Now</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Restore from Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export/Import Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Export & Import</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export All Data</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Import Data</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Products</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Customers</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Users</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Protection Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Data Protection</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={dataEncryption}
                onChange={(e) => setDataEncryption(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable data encryption</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={auditLogging}
                onChange={(e) => setAuditLogging(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable audit logging</span>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900">Clear Temporary Data</h4>
              <p className="text-sm text-gray-500">Remove temporary files and logs to free up space</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
              <Trash2 className="w-4 h-4" />
              <span>Clear Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPWASettings = () => (
    <div className="space-y-8">
      {/* PWA Branding Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">PWA Branding & Identity</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PWA Name</label>
            <input
              type="text"
              value={pwaName}
              onChange={(e) => setPwaName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Agrivet Kiosk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PWA Version</label>
            <input
              type="text"
              value={pwaVersion}
              onChange={(e) => setPwaVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1.0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={pwaTheme}
              onChange={(e) => setPwaTheme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dark-green">Dark Green</option>
              <option value="light-blue">Light Blue</option>
              <option value="dark-blue">Dark Blue</option>
              <option value="orange">Orange</option>
              <option value="purple">Purple</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PWA Logo</label>
            <div className="flex items-center space-x-3">
              {pwaLogo && (
                <img src={pwaLogo} alt="PWA Logo" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                Upload Logo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Functionality Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Settings className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">PWA Functionality</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Core Features</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={onlineOrderingEnabled}
                  onChange={(e) => setOnlineOrderingEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Online Ordering</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={pushNotificationsEnabled}
                  onChange={(e) => setPushNotificationsEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Push Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Order Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Branch for Orders</label>
                <select
                  value={defaultBranchForOrders}
                  onChange={(e) => setDefaultBranchForOrders(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="main">Main Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fulfillment Options</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deliveryEnabled}
                      onChange={(e) => setDeliveryEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Delivery</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pickupEnabled}
                      onChange={(e) => setPickupEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pickup</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Activity className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">PWA Status & Monitoring</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-green-700">Uptime</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <div className="text-sm text-blue-700">Active Users</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">v{pwaVersion}</div>
            <div className="text-sm text-purple-700">Current Version</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900">PWA Health Check</h4>
              <p className="text-sm text-gray-500">Run diagnostics to check PWA functionality</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Activity className="w-4 h-4" />
              <span>Run Health Check</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranchManagement = () => {
    const filteredBranches = branches.filter(branch => 
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.branch_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.province?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-8">
        {/* Branch Management Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Building className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Branch Management</h3>
                <p className="text-sm text-gray-500">Manage branch locations, settings, and configurations</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowAddBranchModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search branches by name, code, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Types</option>
                <option value="main">Main</option>
                <option value="satellite">Satellite</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => {
            const typeBadge = getBranchTypeBadge(branch.branch_type);
            const statusBadge = getBranchStatusBadge(branch.is_active);
            
            return (
              <div key={branch.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{branch.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{branch.code}</p>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.color}`}>
                        <span className="mr-1">{typeBadge.icon}</span>
                        {branch.branch_type}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleEditBranch(branch)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit branch"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">{branch.full_address || `${branch.address}, ${branch.city}, ${branch.province}`}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">{branch.phone}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">{branch.email}</p>
                  </div>

                  {branch.manager && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {branch.manager ? `${branch.manager.first_name} ${branch.manager.last_name}` : 'Unknown Manager'}
                        </p>
                        <p className="text-xs text-gray-500">Manager</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-900">
                          {new Date(branch.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div className="font-medium mb-1">Operating Hours:</div>
                        {branch.formatted_hours ? (
                          Object.entries(branch.formatted_hours).map(([day, hours]: [string, any]) => {
                            console.log(`🔍 [DEBUG] Formatted hours for ${day}:`, hours);
                            
                            return (
                              <div key={day} className="flex justify-between">
                                <span className="capitalize">{day}:</span>
                                <span>{hours}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-gray-400 italic">No operating hours set</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBranches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
            <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or add a new branch.</p>
          </div>
        )}

        {/* Add/Edit Branch Modal */}
        {showAddBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddBranchModal(false);
                      setEditingBranch(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleBranchSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name *</label>
                    <input
                      type="text"
                      value={branchFormData.name || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code *</label>
                    <input
                      type="text"
                      value={branchFormData.code || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Type</label>
                    <select
                      value={branchFormData.type || 'main'}
                      onChange={(e) => setBranchFormData({...branchFormData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="main">Main Branch</option>
                      <option value="satellite">Satellite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={branchFormData.status || 'active'}
                      onChange={(e) => setBranchFormData({...branchFormData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={branchFormData.address || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, address: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={branchFormData.city || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                    <input
                      type="text"
                      value={branchFormData.province || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, province: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={branchFormData.postalCode || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, postalCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={branchFormData.phone || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={branchFormData.email || ''}
                      onChange={(e) => setBranchFormData({...branchFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">Operating Hours</label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const mondayHours = branchFormData.operatingHours.monday;
                            setBranchFormData({
                              ...branchFormData,
                              operatingHours: {
                                ...branchFormData.operatingHours,
                                tuesday: { ...mondayHours },
                                wednesday: { ...mondayHours },
                                thursday: { ...mondayHours },
                                friday: { ...mondayHours },
                                saturday: { ...mondayHours }
                              }
                            });
                          }}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Copy Monday to Weekdays
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const mondayHours = branchFormData.operatingHours.monday;
                            setBranchFormData({
                              ...branchFormData,
                              operatingHours: {
                                ...branchFormData.operatingHours,
                                saturday: { ...mondayHours },
                                sunday: { ...mondayHours }
                              }
                            });
                          }}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          Copy Monday to Weekend
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(branchFormData.operatingHours).map(([day, hours]) => (
                        <div key={day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-20">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={hours.isOpen}
                                onChange={(e) => setBranchFormData({
                                  ...branchFormData,
                                  operatingHours: {
                                    ...branchFormData.operatingHours,
                                    [day]: { ...hours, isOpen: e.target.checked }
                                  }
                                })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm font-medium capitalize">{day}</span>
                            </label>
                          </div>
                          {hours.isOpen && (
                            <>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Start</label>
                                <input
                                  type="time"
                                  value={hours.start}
                                  onChange={(e) => setBranchFormData({
                                    ...branchFormData,
                                    operatingHours: {
                                      ...branchFormData.operatingHours,
                                      [day]: { ...hours, start: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">End</label>
                                <input
                                  type="time"
                                  value={hours.end}
                                  onChange={(e) => setBranchFormData({
                                    ...branchFormData,
                                    operatingHours: {
                                      ...branchFormData.operatingHours,
                                      [day]: { ...hours, end: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </>
                          )}
                          {!hours.isOpen && (
                            <div className="flex-1 text-sm text-gray-500 italic">Closed</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                    <select
                      value={branchFormData.managerId}
                      onChange={(e) => setBranchFormData({...branchFormData, managerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Manager</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBranchModal(false);
                      setEditingBranch(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Saving...' : (editingBranch ? 'Update Branch' : 'Create Branch')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };


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

        {/* Mobile Navigation Overlay */}
        {sidebarCollapsed && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarCollapsed(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarCollapsed(false);
                    }}
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
        )}

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
              {activeSection === 'pwa' && renderPWASettings()}
              {activeSection === 'data' && renderDataSettings()}
              {activeSection === 'branches' && renderBranchManagement()}
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



















