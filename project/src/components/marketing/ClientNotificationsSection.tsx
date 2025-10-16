import React, { useState, useEffect } from 'react';
import { 
  Users,
  Star,
  TrendingUp,
  X,
  Save,
  Settings
} from 'lucide-react';
import RewardsNotifications from './RewardsNotifications';
import ClientNotifications from './ClientNotifications';

interface ClientNotificationsSectionProps {
  activeSection?: string;
}

const mockData = {
  loyaltyStats: {
    totalMembers: 1250,
    activeMembers: 890,
    totalPointsIssued: 45600,
    totalPointsRedeemed: 23400,
    averagePointsPerMember: 36.5
  }
};

interface LoyaltyConfigFormData {
  pointsPerPeso: number;
  redemptionRate: number;
  minimumRedemption: number;
  pointsExpiry: number;
  welcomeBonus: number;
  birthdayBonus: number;
  referralBonus: number;
  tier1Threshold: number;
  tier2Threshold: number;
  tier3Threshold: number;
}

const ClientNotificationsSection: React.FC<ClientNotificationsSectionProps> = ({ activeSection = 'client-notifications' }) => {
  const [activeTab, setActiveTab] = useState('rewards-notifications');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formData, setFormData] = useState<LoyaltyConfigFormData>({
    pointsPerPeso: 1,
    redemptionRate: 10,
    minimumRedemption: 500,
    pointsExpiry: 12,
    welcomeBonus: 100,
    birthdayBonus: 50,
    referralBonus: 200,
    tier1Threshold: 1000,
    tier2Threshold: 5000,
    tier3Threshold: 10000
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeSection === 'rewards-notifications' || activeSection === 'loyalty-program' || 
        activeSection === 'email-campaigns') {
      setActiveTab(activeSection);
    }
  }, [activeSection]);

  // Form handling functions
  const openConfigModal = () => {
    setShowConfigModal(true);
    setFormErrors({});
  };

  const closeConfigModal = () => {
    setShowConfigModal(false);
    setFormErrors({});
  };

  const handleInputChange = (field: keyof LoyaltyConfigFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.pointsPerPeso <= 0) {
      errors.pointsPerPeso = 'Points per peso must be greater than 0';
    }
    if (formData.redemptionRate <= 0) {
      errors.redemptionRate = 'Redemption rate must be greater than 0';
    }
    if (formData.minimumRedemption <= 0) {
      errors.minimumRedemption = 'Minimum redemption must be greater than 0';
    }
    if (formData.pointsExpiry <= 0) {
      errors.pointsExpiry = 'Points expiry must be greater than 0';
    }
    if (formData.tier1Threshold >= formData.tier2Threshold) {
      errors.tier1Threshold = 'Tier 1 threshold must be less than Tier 2';
    }
    if (formData.tier2Threshold >= formData.tier3Threshold) {
      errors.tier2Threshold = 'Tier 2 threshold must be less than Tier 3';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Loyalty program configuration updated:', formData);
      closeConfigModal();
      
    } catch (err) {
      console.error('Error saving configuration:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoyaltyProgram = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Loyalty Program</h2>
        <button 
          onClick={openConfigModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Settings className="w-4 h-4" />
          <span>Configure Program</span>
        </button>
      </div>

      {/* Loyalty Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.totalMembers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.activeMembers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points Issued</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.totalPointsIssued.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Points/Member</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.averagePointsPerMember}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Program Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Points per peso spent</span>
            <span className="font-medium">1 point = ₱1.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Redemption rate</span>
            <span className="font-medium">100 points = ₱10.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Minimum redemption</span>
            <span className="font-medium">500 points</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Points expiry</span>
            <span className="font-medium">12 months</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Loyalty Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Juan Dela Cruz</p>
              <p className="text-sm text-gray-600">Earned 150 points</p>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Maria Santos</p>
              <p className="text-sm text-gray-600">Redeemed 500 points</p>
            </div>
            <span className="text-sm text-gray-500">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Pedro Garcia</p>
              <p className="text-sm text-gray-600">Earned 200 points</p>
            </div>
            <span className="text-sm text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Notifications</h1>
        <p className="text-gray-600">Manage rewards, notifications, and loyalty programs for customer engagement</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setActiveTab('rewards-notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rewards-notifications' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rewards & Notifications
            </button>
            <button 
              onClick={() => setActiveTab('loyalty-program')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'loyalty-program' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Loyalty Program
            </button>
            <button 
              onClick={() => setActiveTab('email-campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'email-campaigns' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Email Campaigns
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'rewards-notifications' && <RewardsNotifications />}
        {activeTab === 'loyalty-program' && renderLoyaltyProgram()}
        {activeTab === 'email-campaigns' && <ClientNotifications />}
      </div>

      {/* Loyalty Program Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configure Loyalty Program</h2>
              <button
                onClick={closeConfigModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Points Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Points Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points per Peso Spent *
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.pointsPerPeso}
                        onChange={(e) => handleInputChange('pointsPerPeso', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.pointsPerPeso && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.pointsPerPeso}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Redemption Rate (Points to Peso) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.redemptionRate}
                        onChange={(e) => handleInputChange('redemptionRate', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">e.g., 100 points = ₱10</p>
                      {formErrors.redemptionRate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.redemptionRate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Redemption Rules */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Redemption Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Redemption (Points) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.minimumRedemption}
                        onChange={(e) => handleInputChange('minimumRedemption', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.minimumRedemption && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.minimumRedemption}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points Expiry (Months) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.pointsExpiry}
                        onChange={(e) => handleInputChange('pointsExpiry', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.pointsExpiry && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.pointsExpiry}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bonus Points */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bonus Points</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Welcome Bonus
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.welcomeBonus}
                        onChange={(e) => handleInputChange('welcomeBonus', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birthday Bonus
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.birthdayBonus}
                        onChange={(e) => handleInputChange('birthdayBonus', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referral Bonus
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.referralBonus}
                        onChange={(e) => handleInputChange('referralBonus', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier Thresholds */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tier Thresholds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tier 1 Threshold (Points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tier1Threshold}
                        onChange={(e) => handleInputChange('tier1Threshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.tier1Threshold && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.tier1Threshold}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tier 2 Threshold (Points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tier2Threshold}
                        onChange={(e) => handleInputChange('tier2Threshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.tier2Threshold && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.tier2Threshold}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tier 3 Threshold (Points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tier3Threshold}
                        onChange={(e) => handleInputChange('tier3Threshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeConfigModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientNotificationsSection;