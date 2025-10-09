import React from 'react';
import { X, ExternalLink, Eye, EyeOff, Edit, Upload, Download } from 'lucide-react';

interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'social';
  subject?: string;
  content: string;
  target_audience: string[];
  scheduled_date?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  budget?: number;
  goals?: string;
  background_color?: string;
  text_color?: string;
  button_color?: string;
  created_at: string;
  updated_at: string;
}

interface CampaignTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  content: string;
  preview_image?: string;
  is_active: boolean;
}

interface CampaignPreviewProps {
  campaign: MarketingCampaign;
  template: CampaignTemplate;
  isPreview?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onToggleStatus?: (isActive: boolean) => void;
}

const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  campaign,
  template,
  isPreview = false,
  onClose,
  onEdit,
  onPublish,
  onUnpublish,
  onToggleStatus
}) => {
  const renderHeroBanner = () => (
    <div 
      className="w-full h-96 flex items-center justify-center text-center relative overflow-hidden rounded-lg"
      style={{
        backgroundColor: campaign.background_color || '#f8f9fa',
        color: campaign.text_color || '#333333'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-4">{campaign.name}</h1>
        <p className="text-xl mb-6">{campaign.description}</p>
        <button 
          className="px-8 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: campaign.button_color || '#3b82f6' }}
        >
          Learn More
        </button>
      </div>
    </div>
  );

  const renderEmailContent = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Email Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{campaign.subject}</h2>
            <p className="text-sm text-gray-600">From: Agrivet Management System</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="px-6 py-8">
        <div 
          className="prose max-w-none"
          style={{ color: campaign.text_color || '#333333' }}
          dangerouslySetInnerHTML={{ __html: campaign.content }}
        />
      </div>

      {/* Email Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600">
          <p>© 2024 Agrivet Management System. All rights reserved.</p>
          <p className="mt-1">
            <a href="#" className="text-blue-600 hover:text-blue-800">Unsubscribe</a> | 
            <a href="#" className="text-blue-600 hover:text-blue-800 ml-2">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );

  const renderSMSContent = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Agrivet Management</p>
            <p className="text-xs text-gray-600">SMS Campaign</p>
          </div>
        </div>
        <div 
          className="text-sm leading-relaxed"
          style={{ color: campaign.text_color || '#333333' }}
        >
          {campaign.content}
        </div>
      </div>
    </div>
  );

  const renderPushNotification = () => (
    <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">A</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Agrivet Management</h3>
            <span className="text-xs text-gray-500">now</span>
          </div>
          <p 
            className="text-sm text-gray-700 leading-relaxed"
            style={{ color: campaign.text_color || '#333333' }}
          >
            {campaign.content}
          </p>
        </div>
      </div>
    </div>
  );

  const renderSocialMediaContent = () => (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Social Media Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Agrivet Management</h3>
            <p className="text-sm text-gray-600">Sponsored</p>
          </div>
        </div>
      </div>

      {/* Social Media Content */}
      <div className="px-4 py-4">
        <div 
          className="text-sm leading-relaxed mb-4"
          style={{ color: campaign.text_color || '#333333' }}
        >
          {campaign.content}
        </div>
        
        {campaign.background_color && (
          <div 
            className="w-full h-48 rounded-lg flex items-center justify-center text-center"
            style={{ backgroundColor: campaign.background_color }}
          >
            <div className="text-white font-semibold">Campaign Visual</div>
          </div>
        )}
      </div>

      {/* Social Media Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 hover:text-red-600">
              <span>❤️</span>
              <span>Like</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <span>💬</span>
              <span>Comment</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-600">
              <span>📤</span>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (campaign.type) {
      case 'email':
        return renderEmailContent();
      case 'sms':
        return renderSMSContent();
      case 'push':
        return renderPushNotification();
      case 'social':
        return renderSocialMediaContent();
      default:
        return renderEmailContent();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="campaign-preview">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-gray-600">Campaign Preview</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status.toUpperCase()}
              </span>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Preview Mode</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{campaign.type}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Template:</span>
                <span className="text-sm font-medium text-gray-900">{template.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-2 px-3 py-1 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              
              <button className="flex items-center space-x-2 px-3 py-1 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Content Preview */}
        <div className="bg-gray-50 p-8 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaign Preview</h2>
            <p className="text-sm text-gray-600">
              This is how your campaign will appear to your audience
            </p>
          </div>
          
          {renderContent()}
        </div>

        {/* Campaign Details */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Target Audience</h4>
              <div className="flex flex-wrap gap-1">
                {campaign.target_audience.map((audience, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {audience}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Scheduled Date</h4>
              <p className="text-sm text-gray-900">
                {campaign.scheduled_date 
                  ? new Date(campaign.scheduled_date).toLocaleString()
                  : 'Not scheduled'
                }
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Budget</h4>
              <p className="text-sm text-gray-900">
                {campaign.budget 
                  ? new Intl.NumberFormat('en-PH', { 
                      style: 'currency', 
                      currency: 'PHP' 
                    }).format(campaign.budget)
                  : 'Not set'
                }
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Goals</h4>
              <p className="text-sm text-gray-900">
                {campaign.goals || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Created</h4>
              <p className="text-sm text-gray-900">
                {new Date(campaign.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h4>
              <p className="text-sm text-gray-900">
                {new Date(campaign.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isPreview && (
          <div className="mt-6 flex justify-end space-x-4">
            {onPublish && campaign.status === 'draft' && (
              <button
                onClick={onPublish}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Publish Campaign
              </button>
            )}
            
            {onUnpublish && campaign.status === 'active' && (
              <button
                onClick={onUnpublish}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Unpublish Campaign
              </button>
            )}
            
            {onToggleStatus && (
              <button
                onClick={() => onToggleStatus(campaign.status === 'active')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  campaign.status === 'active'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {campaign.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        )}
      </div>
  );
};

export default CampaignPreview;






















