import React, { useEffect, useMemo, useState } from 'react';
import { 
  Settings, User, Lock, Bell, Mail, Shield, Database, Download, Upload, 
  Key, Eye, EyeOff, Save, RefreshCw, Monitor, 
  Smartphone, MapPin, Phone, Building, Users
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
  const [numberFormat, setNumberFormat] = useState('1,234.56');
  const [notificationPrefs, setNotificationPrefs] = useState<{ id: string; enabled: boolean }[]>([
    { id: 'email_sales', enabled: true },
    { id: 'email_inventory', enabled: true },
    { id: 'email_staff', enabled: false },
    { id: 'email_reports', enabled: true },
    { id: 'sms_critical', enabled: true },
    { id: 'push_mobile', enabled: false },
  ]);

  // Branches and password reset requests
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', city: '', phone: '', manager_name: '', is_active: true });
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [staffById, setStaffById] = useState<Map<string, { name: string; position: string; email: string }>>(new Map());

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Settings,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      color: 'bg-red-50 text-red-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: Database,
      color: 'bg-green-50 text-green-600'
    }
  ];

  const systemInfo = [
    { label: 'Application Version', value: 'v2.1.4' },
    { label: 'Database Version', value: 'PostgreSQL 15.2' },
    { label: 'Last Backup', value: '2024-01-15 03:00 AM' },
    { label: 'System Status', value: 'Operational' }
  ];

  const notificationCatalogue = useMemo(() => ([
    { id: 'email_sales', label: 'Sales Notifications', description: 'Get notified about new sales and transactions' },
    { id: 'email_inventory', label: 'Inventory Alerts', description: 'Low stock and out of stock notifications' },
    { id: 'email_staff', label: 'Staff Updates', description: 'Staff attendance and leave request notifications' },
    { id: 'email_reports', label: 'Report Generation', description: 'Automated report completion notifications' },
    { id: 'sms_critical', label: 'Critical SMS Alerts', description: 'Emergency and critical system alerts via SMS' },
    { id: 'push_mobile', label: 'Mobile Push Notifications', description: 'Push notifications to mobile devices' }
  ]), []);

  const toggleNotification = (id: string) => {
    setNotificationPrefs(prev => {
      const map = new Map(prev.map(p => [p.id, p.enabled] as [string, boolean]));
      map.set(id, !map.get(id));
      return Array.from(map.entries()).map(([nid, enabled]) => ({ id: nid, enabled }));
    });
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // settings
        const { data: settingsRows } = await supabase.from('app_settings').select('*').limit(1);
        const s = (settingsRows && settingsRows[0]) || null;
        if (s) {
          setAppName(s.app_name || appName);
          setCompanyName(s.company_name || companyName);
          setContactEmail(s.contact_email || contactEmail);
          setSupportPhone(s.support_phone || supportPhone);
          setSelectedTheme(s.theme || selectedTheme);
          setSelectedLanguage(s.language || selectedLanguage);
          setSelectedTimezone(s.timezone || selectedTimezone);
          setCurrency(s.currency || currency);
          setAutoSave(Boolean(s.auto_save));
          setShowTooltips(Boolean(s.show_tooltips));
          setCompactView(Boolean(s.compact_view));
          setItemsPerPage(Number(s.items_per_page || itemsPerPage));
          setDateFormat(s.date_format || dateFormat);
          setNumberFormat(s.number_format || numberFormat);
          if (s.notification_prefs) setNotificationPrefs(s.notification_prefs);
        }

        // branches
        const { data: branchRows } = await supabase.from('branches').select('id, name, address, city, phone, manager_name, is_active');
        setBranches(branchRows || []);

        // reset requests
        const { data: reqRows } = await supabase
          .from('password_reset_requests')
          .select('id, staff_id, email, reason, status, requested_at, processed_at')
          .order('requested_at', { ascending: false });
        setResetRequests(reqRows || []);
        const staffIds = Array.from(new Set((reqRows || []).map(r => r.staff_id).filter(Boolean)));
        if (staffIds.length) {
          const { data: staffRows } = await supabase.from('staff').select('id, first_name, last_name, email, position').in('id', staffIds as string[]);
          const map = new Map<string, { name: string; position: string; email: string }>();
          (staffRows || []).forEach(st => map.set(st.id, { name: `${st.first_name || ''} ${st.last_name || ''}`.trim(), position: st.position || '', email: st.email || '' }));
          setStaffById(map);
        } else {
          setStaffById(new Map());
        }
      } catch (e) {
        console.error('Load settings failed', e);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveAll = async () => {
    try {
      setLoading(true);
      const payload: any = {
        app_name: appName,
        company_name: companyName,
        contact_email: contactEmail,
        support_phone: supportPhone,
        theme: selectedTheme,
        language: selectedLanguage,
        timezone: selectedTimezone,
        currency,
        auto_save: autoSave,
        show_tooltips: showTooltips,
        compact_view: compactView,
        items_per_page: itemsPerPage,
        date_format: dateFormat,
        number_format: numberFormat,
        notification_prefs: notificationPrefs,
        updated_at: new Date().toISOString(),
      };
      const { data: existing } = await supabase.from('app_settings').select('id').limit(1);
      if (existing && existing.length) {
        const { error: err } = await supabase.from('app_settings').update(payload).eq('id', existing[0].id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('app_settings').insert(payload);
        if (err) throw err;
      }
      alert('Settings saved');
    } catch (e) {
      console.error('Save settings failed', e);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const onApproveReset = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('password_reset_requests')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw err;
      setResetRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', processed_at: new Date().toISOString() } : r));
      setExpandedRequest(null);
    } catch (e) {
      console.error('Approve reset failed', e);
      alert('Failed to approve reset request');
    }
  };

  const onAddBranch = async () => {
    try {
      if (!newBranch.name || !newBranch.address || !newBranch.city) {
        alert('Please fill name, address and city');
        return;
      }
      const { error: err } = await supabase.from('branches').insert(newBranch as any);
      if (err) throw err;
      const { data } = await supabase.from('branches').select('id, name, address, city, phone, manager_name, is_active');
      setBranches(data || []);
      setShowAddBranch(false);
      setNewBranch({ name: '', address: '', city: '', phone: '', manager_name: '', is_active: true });
    } catch (e) {
      console.error('Add branch failed', e);
      alert('Failed to add branch');
    }
  };

  const exportBranches = () => {
    const headers = ['Name', 'Address', 'City', 'Phone', 'Manager', 'Status'];
    const rows = (branches || []).map(b => [b.name, b.address, b.city, b.phone, b.manager_name, b.is_active ? 'Active' : 'Inactive']);
    const csv = [headers, ...rows].map(cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branches.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-600 mt-1">Manage system preferences and configuration</p>
        </div>
        <button onClick={onSaveAll} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" disabled={loading}>
          <Save className="w-4 h-4" />
          <span>Save All Changes</span>
        </button>
      </div>

      {/* Settings Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">General Settings</h3>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
              <input
                type="text"
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
              <input
                type="tel"
                id="supportPhone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="fil">Filipino</option>
                <option value="ceb">Cebuano</option>
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                id="timezone"
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </div>
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                id="theme"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="PHP">Philippine Peso (₱)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-lg bg-red-50 text-red-600">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Security & Privacy</h3>
        </div>

        <div className="space-y-6">
          {/* Password Reset Request */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="w-6 h-6 text-purple-600" />
              <h4 className="text-lg font-semibold text-gray-800">Employee Password Reset Requests</h4>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Manage password reset requests from employees. Review and approve requests to send temporary passwords.
            </p>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {resetRequests.filter(req => (req.status || 'pending').toLowerCase() === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {resetRequests.filter(req => (req.status || 'pending').toLowerCase() === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved Today</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{resetRequests.length}</p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
            </div>

            {/* Reset Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resetRequests.map((request: any) => (
                    <React.Fragment key={request.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{(staffById.get(request.staff_id)?.name) || '—'}</div>
                              <div className="text-sm text-gray-500">{(staffById.get(request.staff_id)?.position) || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{request.email || staffById.get(request.staff_id)?.email || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(request.requested_at || '').slice(0, 16).replace('T', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (request.status || 'pending').toLowerCase() === 'pending' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {(request.status || 'pending').toLowerCase() === 'pending' ? (
                            <button
                              onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Key className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <span className="text-green-600 text-sm">✓ Processed</span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded row for temporary password input */}
                      {expandedRequest === request.id && (request.status || 'pending').toLowerCase() === 'pending' && (
                        <tr className="bg-green-50">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="max-w-md">
                              <div className="flex items-center space-x-2 mb-3">
                                <Lock className="w-4 h-4 text-green-600" />
                                <h5 className="text-sm font-medium text-gray-900">Generate Temporary Password</h5>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label htmlFor={`tempPassword-${request.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Temporary Password
                                  </label>
                                  <input
                                    type="text"
                                    id={`tempPassword-${request.id}`}
                                    value={tempPasswords[request.id] || ''}
                                    onChange={(e) => setTempPasswords(prev => ({
                                      ...prev,
                                      [request.id]: e.target.value
                                    }))}
                                    placeholder="Enter temporary password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      // Generate random password
                                      const randomPassword = Math.random().toString(36).slice(-8);
                                      setTempPasswords(prev => ({
                                        ...prev,
                                        [request.id]: randomPassword
                                      }));
                                    }}
                                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                    Generate
                                  </button>
                                  <button
                                    onClick={() => {
                                      alert(`Temporary password sent to ${request.email || staffById.get(request.staff_id)?.email || 'user'}`);
                                      onApproveReset(request.id);
                                    }}
                                    disabled={!tempPasswords[request.id]}
                                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span>Send</span>
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  The temporary password will be sent to {request.email || staffById.get(request.staff_id)?.email || 'user'} and must be changed on first login.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {resetRequests.length === 0 && (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No password reset requests at this time.</p>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-5 h-5 text-gray-600" />
              <h4 className="text-md font-semibold text-gray-800">Change Password</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Lock className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="text-md font-semibold text-gray-800">Two-Factor Authentication (2FA)</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable2fa"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="enable2fa" className="ml-2 text-sm text-gray-700">Enable 2FA</label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Smartphone className="w-4 h-4" />
                <span>Setup Authenticator App</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Mail className="w-4 h-4" />
                <span>Setup Email 2FA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          {notificationCatalogue.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{setting.label}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    (notificationPrefs.find(p => p.id === setting.id)?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                  }`}>
                    {notificationPrefs.find(p => p.id === setting.id)?.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={setting.id}
                  checked={!!notificationPrefs.find(p => p.id === setting.id)?.enabled}
                  onChange={() => toggleNotification(setting.id)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Branch Settings</h3>
          </div>
          <button onClick={() => setShowAddBranch(true)} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Building className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch: any) => (
            <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{branch.name}</h4>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{branch.address}, {branch.city}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  branch.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-xs">
                  <Eye className="w-3 h-3 inline mr-1" />
                  View
                </button>
                <button className="text-green-600 hover:text-green-800 text-xs">
                  <Settings className="w-3 h-3 inline mr-1" />
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button onClick={exportBranches} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Branches (CSV)</span>
          </button>
        </div>
      </div>

      {showAddBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Add Branch</h4>
              <button onClick={() => setShowAddBranch(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={newBranch.name} onChange={(e) => setNewBranch(v => ({ ...v, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input value={newBranch.city} onChange={(e) => setNewBranch(v => ({ ...v, city: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={newBranch.address} onChange={(e) => setNewBranch(v => ({ ...v, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={newBranch.phone} onChange={(e) => setNewBranch(v => ({ ...v, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                <input value={newBranch.manager_name} onChange={(e) => setNewBranch(v => ({ ...v, manager_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div className="flex items-center space-x-2 md:col-span-2">
                <input type="checkbox" checked={newBranch.is_active} onChange={(e) => setNewBranch(v => ({ ...v, is_active: e.target.checked }))} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddBranch(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={onAddBranch} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Add Branch</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Download className="w-5 h-5 text-blue-600" />
                <h4 className="text-md font-semibold text-gray-800">Export Data</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Download a complete backup of your application data for analysis or migration purposes.
              </p>
              <div className="space-y-2">
                <button onClick={exportBranches} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export Branches (CSV)</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export Database Backup</span>
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Upload className="w-5 h-5 text-green-600" />
                <h4 className="text-md font-semibold text-gray-800">Import Data</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Upload data to your application from compatible file formats (CSV, Excel).
              </p>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choose File to Import</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                <h4 className="text-md font-semibold text-gray-800">Database Maintenance</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Perform routine database maintenance tasks to optimize performance.
              </p>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  <span>Optimize Database</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Database className="w-4 h-4" />
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-md font-semibold text-gray-800 mb-3">System Information</h4>
              <div className="space-y-2">
                {systemInfo.map((info, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{info.label}:</span>
                    <span className="font-medium text-gray-900">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">User Preferences</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Auto-save Changes</h4>
                <p className="text-sm text-gray-600">Automatically save form changes</p>
              </div>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Show Tooltips</h4>
                <p className="text-sm text-gray-600">Display helpful tooltips throughout the app</p>
              </div>
              <input
                type="checkbox"
                checked={showTooltips}
                onChange={(e) => setShowTooltips(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Compact View</h4>
                <p className="text-sm text-gray-600">Use compact layout for tables and lists</p>
              </div>
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 mb-2">Items per Page</label>
              <select
                id="itemsPerPage"
                value={String(itemsPerPage)}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="10">10 items</option>
                <option value="25">25 items</option>
                <option value="50">50 items</option>
                <option value="100">100 items</option>
              </select>
            </div>
            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label htmlFor="numberFormat" className="block text-sm font-medium text-gray-700 mb-2">Number Format</label>
              <select
                id="numberFormat"
                value={numberFormat}
                onChange={(e) => setNumberFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="1,234.56">1,234.56</option>
                <option value="1.234,56">1.234,56</option>
                <option value="1 234.56">1 234.56</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Reset to Defaults</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Backup Settings</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">User Management</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Monitor className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">System Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;