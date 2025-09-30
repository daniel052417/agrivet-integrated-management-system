import React, { useEffect, useMemo, useState } from 'react';
import { 
  Settings, User, Lock, Bell, Mail, Shield, Database, Download, Upload, 
  Key, Eye, EyeOff, Save, RefreshCw, Monitor, 
  Smartphone, MapPin, Phone, Building, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SettingsPage: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Manila');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // App settings state
  const [appName, setAppName] = useState('AGRIVET Admin Dashboard');
  const [companyName, setCompanyName] = useState('AGRIVET Supply Co.');
  const [contactEmail, setContactEmail] = useState('admin@agrivet.com');
  const [supportPhone, setSupportPhone] = useState('+63 2 8123 4567');
  const [currency, setCurrency] = useState('PHP');
  const [autoSave, setAutoSave] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  // Security settings state
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [require2FA, setRequire2FA] = useState(false);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(15);

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesAlerts, setSalesAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // Data settings state
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [retentionPeriod, setRetentionPeriod] = useState(365);
  const [dataEncryption, setDataEncryption] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Settings,
      description: 'Basic application settings and preferences'
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: Shield,
      description: 'Password policies and security configurations'
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      description: 'Email, SMS, and push notification preferences'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: Database,
      description: 'Backup, retention, and data protection settings'
    },
    {
      id: 'users',
      title: 'User Management',
      icon: Users,
      description: 'User accounts, roles, and permissions'
    }
  ];

  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadPermissions();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      console.error('Error loading roles:', err);
      setError('Failed to load roles');
    }
  };

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');

      if (error) throw error;
      setPermissions(data || []);
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save settings to database
      const settings = {
        app_name: appName,
        company_name: companyName,
        contact_email: contactEmail,
        support_phone: supportPhone,
        currency,
        auto_save: autoSave,
        show_tooltips: showTooltips,
        compact_view: compactView,
        items_per_page: itemsPerPage,
        date_format: dateFormat,
        session_timeout: sessionTimeout,
        require_2fa: require2FA,
        password_min_length: passwordMinLength,
        password_require_special: passwordRequireSpecial,
        login_attempts: loginAttempts,
        lockout_duration: lockoutDuration,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        sms_notifications: smsNotifications,
        low_stock_alerts: lowStockAlerts,
        sales_alerts: salesAlerts,
        system_alerts: systemAlerts,
        backup_frequency: backupFrequency,
        retention_period: retentionPeriod,
        data_encryption: dataEncryption,
        audit_logging: auditLogging
      };

      // This would typically save to a settings table
      console.log('Saving settings:', settings);
      
      setError(null);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
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
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Interface Preferences</h3>
        <div className="space-y-3">
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
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
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

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Security Features</h3>
        <div className="space-y-3">
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
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Notification Channels</h3>
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
        <h3 className="text-lg font-medium text-gray-900">Alert Types</h3>
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
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period (days)</label>
          <input
            type="number"
            value={retentionPeriod}
            onChange={(e) => setRetentionPeriod(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Data Protection</h3>
        <div className="space-y-3">
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
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.role || 'User'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage application settings and preferences</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="w-5 h-5" />
                    <span>{section.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {settingsSections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {settingsSections.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              {activeSection === 'general' && renderGeneralSettings()}
              {activeSection === 'security' && renderSecuritySettings()}
              {activeSection === 'notifications' && renderNotificationSettings()}
              {activeSection === 'data' && renderDataSettings()}
              {activeSection === 'users' && renderUserManagement()}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
  );
};

export default SettingsPage;










