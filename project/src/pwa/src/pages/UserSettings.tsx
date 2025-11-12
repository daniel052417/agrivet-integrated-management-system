import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Bell, 
  ShoppingBag, 
  History, 
  Shield, 
  Key, 
  CheckCircle,
  Edit3,
  Save,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { supabase } from '../services/supabase'
import { getManilaTimestamp } from '../utils/dateTime'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

interface UserSettings {
  // Profile Info
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Pickup Preference
  preferredBranchId: string
  specialInstructions: string
  
  // Contact
  primaryPhone: string
  preferredContactMethod: 'phone' | 'email' | 'sms'
  
  // Notifications
  orderReadyAlerts: boolean
  
  // Security
  emailVerified: boolean
}

const UserSettings: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { availableBranches, selectedBranch, refreshBranches } = useBranch()
  
  const [settings, setSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredBranchId: '',
    specialInstructions: '',
    primaryPhone: '',
    preferredContactMethod: 'phone',
    orderReadyAlerts: true,
    emailVerified: false
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user])

  // Debug branch loading
  useEffect(() => {
    console.log('🔍 UserSettings: Branch state changed:', {
      availableBranches: availableBranches?.length || 0,
      selectedBranch: selectedBranch?.name || 'None',
      branches: availableBranches
    })
  }, [availableBranches, selectedBranch])

  // Force refresh branches if they're not loaded
  useEffect(() => {
    if (availableBranches.length === 0) {
      console.log('🔄 UserSettings: No branches loaded, attempting to refresh...')
      refreshBranches()
    }
  }, [availableBranches.length, refreshBranches])

  const loadUserSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Load customer data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (customerError) {
        console.error('Error loading customer data:', customerError)
        throw new Error('Failed to load customer data')
      }

      // Load user preferences (if you have a user_preferences table)
      let preferences = null
      try {
        const { data: prefsData, error: prefsError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('customer_id', customer.id)
          .single()
        
        if (!prefsError) {
          preferences = prefsData
        }
      } catch (error) {
        console.log('User preferences table not found, using defaults')
        preferences = null
      }

      setSettings({
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        preferredBranchId: preferences?.preferred_branch_id || selectedBranch?.id || '',
        specialInstructions: preferences?.special_instructions || '',
        primaryPhone: preferences?.primary_phone || customer.phone || '',
        preferredContactMethod: preferences?.preferred_contact_method || 'phone',
        orderReadyAlerts: preferences?.order_ready_alerts ?? true,
        emailVerified: user?.email_verified || false
      })
    } catch (error) {
      console.error('Error loading user settings:', error)
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (section: string) => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      if (!user) throw new Error('User not authenticated')

      // Get customer data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (customerError) throw customerError

      // Update customer table for profile info
      if (section === 'profile') {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            first_name: settings.firstName,
            last_name: settings.lastName,
            phone: settings.phone,
            updated_at: getManilaTimestamp()
          })
          .eq('id', customer.id)

        if (updateError) throw updateError
      }

      // Update preferred branch in customers table
      if (section === 'pickup' && settings.preferredBranchId) {
        const { error: branchUpdateError } = await supabase
          .from('customers')
          .update({
            preferred_branch_id: settings.preferredBranchId,
            updated_at: getManilaTimestamp()
          })
          .eq('id', customer.id)

        if (branchUpdateError) {
          console.error('Error updating preferred branch:', branchUpdateError)
        } else {
          console.log('✅ Preferred branch updated in customers table')
        }
      }

      // Update or create user preferences (if table exists)
      try {
        const preferencesData = {
          customer_id: customer.id,
          preferred_branch_id: settings.preferredBranchId,
          special_instructions: settings.specialInstructions,
          primary_phone: settings.primaryPhone,
          preferred_contact_method: settings.preferredContactMethod,
          order_ready_alerts: settings.orderReadyAlerts,
          updated_at: new Date().toISOString()
        }

        const { error: prefsError } = await supabase
          .from('user_preferences')
          .upsert(preferencesData, { 
            onConflict: 'customer_id',
            ignoreDuplicates: false 
          })

        if (prefsError) {
          console.log('User preferences table not available, skipping preferences save')
        }
      } catch (error) {
        console.log('User preferences table not found, skipping preferences save')
      }

      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`)
      setEditingSection(null)
    } catch (error) {
      console.error('Error saving settings:', error)
      setError(`Failed to save ${section} settings`)
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      if (tempPassword.new !== tempPassword.confirm) {
        setError('New passwords do not match')
        return
      }

      if (tempPassword.new.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: tempPassword.new
      })

      if (error) throw error

      setSuccess('Password changed successfully')
      setTempPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error changing password:', error)
      setError('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const sendEmailVerification = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || ''
      })

      if (error) throw error
      setSuccess('Verification email sent')
    } catch (error) {
      console.error('Error sending verification:', error)
      setError('Failed to send verification email')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth-selection')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading settings..." />
      </div>
    )
  }

  if (!user) {
    navigate('/auth-selection')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/catalog')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>
              <button
                onClick={() => setEditingSection(editingSection === 'profile' ? null : 'profile')}
                className="btn-outline-sm"
              >
                {editingSection === 'profile' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={settings.firstName}
                  onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={editingSection !== 'profile'}
                  className="input-field disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={settings.lastName}
                  onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={editingSection !== 'profile'}
                  className="input-field disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={settings.email}
                    disabled
                    className="input-field pl-10 bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={editingSection !== 'profile'}
                    className="input-field pl-10 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {editingSection === 'profile' && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => saveSettings('profile')}
                  disabled={isSaving}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSaving ? <LoadingSpinner message="Saving..." /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Pickup Preference */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Pickup Preference</h2>
              </div>
              <button
                onClick={() => setEditingSection(editingSection === 'pickup' ? null : 'pickup')}
                className="btn-outline-sm"
              >
                {editingSection === 'pickup' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Branch</label>
                <select
                  value={settings.preferredBranchId}
                  onChange={(e) => setSettings(prev => ({ ...prev, preferredBranchId: e.target.value }))}
                  disabled={editingSection !== 'pickup'}
                  className="input-field disabled:bg-gray-50"
                >
                  <option value="">Select a branch</option>
                  {availableBranches && availableBranches.length > 0 ? (
                    availableBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {availableBranches.length === 0 ? 'No branches available' : 'Loading branches...'}
                    </option>
                  )}
                </select>
                {availableBranches.length === 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-500 mb-2">
                      Unable to load branches. Please try refreshing.
                    </p>
                    <button
                      type="button"
                      onClick={() => refreshBranches()}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry loading branches
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={settings.specialInstructions}
                  onChange={(e) => setSettings(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  disabled={editingSection !== 'pickup'}
                  placeholder="Any special instructions for pickup..."
                  className="input-field disabled:bg-gray-50 h-20 resize-none"
                />
              </div>
            </div>

            {editingSection === 'pickup' && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => saveSettings('pickup')}
                  disabled={isSaving}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSaving ? <LoadingSpinner message="Saving..." /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Contact Preferences</h2>
              </div>
              <button
                onClick={() => setEditingSection(editingSection === 'contact' ? null : 'contact')}
                className="btn-outline-sm"
              >
                {editingSection === 'contact' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={settings.primaryPhone}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryPhone: e.target.value }))}
                    disabled={editingSection !== 'contact'}
                    className="input-field pl-10 disabled:bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Method</label>
                <select
                  value={settings.preferredContactMethod}
                  onChange={(e) => setSettings(prev => ({ ...prev, preferredContactMethod: e.target.value as 'phone' | 'email' | 'sms' }))}
                  disabled={editingSection !== 'contact'}
                  className="input-field disabled:bg-gray-50"
                >
                  <option value="phone">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            {editingSection === 'contact' && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => saveSettings('contact')}
                  disabled={isSaving}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSaving ? <LoadingSpinner message="Saving..." /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              </div>
              <button
                onClick={() => setEditingSection(editingSection === 'notifications' ? null : 'notifications')}
                className="btn-outline-sm"
              >
                {editingSection === 'notifications' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Order Ready Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified when your order is ready for pickup</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.orderReadyAlerts}
                    onChange={(e) => setSettings(prev => ({ ...prev, orderReadyAlerts: e.target.checked }))}
                    disabled={editingSection !== 'notifications'}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {editingSection === 'notifications' && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => saveSettings('notifications')}
                  disabled={isSaving}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSaving ? <LoadingSpinner message="Saving..." /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/orders/active')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Active Reservations</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </button>

              <button
                onClick={() => navigate('/orders/history')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <History className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Order History</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>

            <div className="space-y-6">
              {/* Email Verification */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Verification</h3>
                  <p className="text-sm text-gray-500">
                    {settings.emailVerified ? 'Your email is verified' : 'Verify your email address'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {settings.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <button
                      onClick={sendEmailVerification}
                      className="btn-outline-sm"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={tempPassword.current}
                        onChange={(e) => setTempPassword(prev => ({ ...prev, current: e.target.value }))}
                        className="input-field pl-10"
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={tempPassword.new}
                        onChange={(e) => setTempPassword(prev => ({ ...prev, new: e.target.value }))}
                        className="input-field pl-10"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={tempPassword.confirm}
                        onChange={(e) => setTempPassword(prev => ({ ...prev, confirm: e.target.value }))}
                        className="input-field pl-10"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <button
                    onClick={changePassword}
                    disabled={isSaving || !tempPassword.current || !tempPassword.new || !tempPassword.confirm}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isSaving ? <LoadingSpinner message="Changing..." /> : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleLogout}
              className="w-full btn-outline text-red-600 border-red-200 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
