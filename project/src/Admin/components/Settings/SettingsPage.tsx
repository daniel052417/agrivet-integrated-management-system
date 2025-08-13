import React, { useState } from 'react';
import { 
  Settings, User, Lock, Bell, Mail, Shield, Database, Download, Upload, 
  Key, Eye, EyeOff, Save, RefreshCw, Globe, Palette, Monitor, 
  Smartphone, Clock, MapPin, Phone, Building, Users, AlertTriangle
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Manila');
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [tempPasswords, setTempPasswords] = useState<{ [key: number]: string }>({});

  const passwordResetRequests = [
    {
      id: 1,
      employeeName: 'Maria Santos',
      email: 'maria.santos@agrivet.com',
      position: 'Store Manager',
      dateRequested: '2024-01-15',
      status: 'Pending',
      reason: 'Forgot password'
    },
    {
      id: 2,
      employeeName: 'Juan Dela Cruz',
      email: 'juan.delacruz@agrivet.com',
      position: 'Veterinarian',
      dateRequested: '2024-01-14',
      status: 'Pending',
      reason: 'Account locked'
    },
    {
      id: 3,
      employeeName: 'Ana Rodriguez',
      email: 'ana.rodriguez@agrivet.com',
      position: 'Sales Associate',
      dateRequested: '2024-01-13',
      status: 'Approved',
      reason: 'Security update'
    },
    {
      id: 4,
      employeeName: 'Carlos Martinez',
      email: 'carlos.martinez@agrivet.com',
      position: 'Inventory Clerk',
      dateRequested: '2024-01-12',
      status: 'Approved',
      reason: 'Forgot password'
    }
  ];

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

  const notificationSettings = [
    { id: 'email_sales', label: 'Sales Notifications', description: 'Get notified about new sales and transactions', enabled: true },
    { id: 'email_inventory', label: 'Inventory Alerts', description: 'Low stock and out of stock notifications', enabled: true },
    { id: 'email_staff', label: 'Staff Updates', description: 'Staff attendance and leave request notifications', enabled: false },
    { id: 'email_reports', label: 'Report Generation', description: 'Automated report completion notifications', enabled: true },
    { id: 'sms_critical', label: 'Critical SMS Alerts', description: 'Emergency and critical system alerts via SMS', enabled: true },
    { id: 'push_mobile', label: 'Mobile Push Notifications', description: 'Push notifications to mobile devices', enabled: false }
  ];

  const branchSettings = [
    { name: 'Main Branch - Quezon City', address: '123 Commonwealth Ave, Quezon City', phone: '+63 2 8123 4567', status: 'Active' },
    { name: 'Branch 2 - Makati', address: '456 Ayala Ave, Makati City', phone: '+63 2 8234 5678', status: 'Active' },
    { name: 'Branch 3 - Cebu', address: '789 Colon St, Cebu City', phone: '+63 32 234 5678', status: 'Active' },
    { name: 'Branch 4 - Davao', address: '321 Roxas Ave, Davao City', phone: '+63 82 234 5678', status: 'Inactive' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-600 mt-1">Manage system preferences and configuration</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
              <input
                type="text"
                id="appName"
                defaultValue="AGRIVET Admin Dashboard"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                id="companyName"
                defaultValue="AGRIVET Supply Co."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                defaultValue="admin@agrivet.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
              <input
                type="tel"
                id="supportPhone"
                defaultValue="+63 2 8123 4567"
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
                  {passwordResetRequests.filter(req => req.status === 'Pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {passwordResetRequests.filter(req => req.status === 'Approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved Today</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{passwordResetRequests.length}</p>
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
                  {passwordResetRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                              <div className="text-sm text-gray-500">{request.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{request.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.dateRequested}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'Pending' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'Pending' ? (
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
                      {expandedRequest === request.id && request.status === 'Pending' && (
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
                                      // Handle send logic here (UI only)
                                      alert(`Temporary password sent to ${request.email}`);
                                      setExpandedRequest(null);
                                      setTempPasswords(prev => {
                                        const newState = { ...prev };
                                        delete newState[request.id];
                                        return newState;
                                      });
                                    }}
                                    disabled={!tempPasswords[request.id]}
                                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span>Send</span>
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  The temporary password will be sent to {request.email} and must be changed on first login.
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

            {passwordResetRequests.length === 0 && (
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
          {notificationSettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{setting.label}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    setting.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {setting.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={setting.id}
                  defaultChecked={setting.enabled}
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
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Building className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branchSettings.map((branch, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{branch.name}</h4>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  branch.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {branch.status}
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
      </div>

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
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export All Data (CSV)</span>
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
                defaultChecked
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
                defaultChecked
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
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 mb-2">Items per Page</label>
              <select
                id="itemsPerPage"
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