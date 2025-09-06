import React from 'react';
import { X, ExternalLink, Eye, EyeOff, Edit, Upload, Download } from 'lucide-react';
import { MarketingCampaign, CampaignTemplate, CampaignTemplateType } from '../../../types/marketing';

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
        color: campaign.text_color || '#000000'
      }}
    >
      {campaign.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${campaign.image_url})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {campaign.title}
        </h1>
        
        {campaign.description && (
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {campaign.description}
          </p>
        )}
        
        {campaign.cta_text && campaign.cta_url && (
          <a
            href={campaign.cta_url}
            className="inline-block px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: campaign.cta_button_color || '#007bff',
              color: campaign.cta_text_color || '#ffffff'
            }}
          >
            {campaign.cta_text}
          </a>
        )}
      </div>
    </div>
  );

  const renderPromoCard = () => (
    <div 
      className="w-80 h-64 p-6 rounded-lg shadow-lg border relative overflow-hidden"
      style={{
        backgroundColor: campaign.background_color || '#ffffff',
        color: campaign.text_color || '#000000'
      }}
    >
      {campaign.image_url && (
        <div 
          className="absolute top-0 right-0 w-32 h-32 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${campaign.image_url})` }}
        ></div>
      )}
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-3">
          {campaign.title}
        </h3>
        
        {campaign.description && (
          <p className="text-sm mb-4 opacity-80 line-clamp-3">
            {campaign.description}
          </p>
        )}
        
        {campaign.cta_text && campaign.cta_url && (
          <a
            href={campaign.cta_url}
            className="inline-block px-4 py-2 text-sm font-medium rounded transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: campaign.cta_button_color || '#007bff',
              color: campaign.cta_text_color || '#ffffff'
            }}
          >
            {campaign.cta_text}
          </a>
        )}
      </div>
    </div>
  );

  const renderPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="w-full max-w-lg mx-4 p-8 rounded-xl shadow-2xl relative"
        style={{
          backgroundColor: campaign.background_color || '#ffffff',
          color: campaign.text_color || '#000000'
        }}
      >
        {!isPreview && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {campaign.image_url && (
          <div className="mb-6">
            <img
              src={campaign.image_url}
              alt={campaign.image_alt_text || campaign.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-4">
          {campaign.title}
        </h2>
        
        {campaign.description && (
          <p className="text-gray-600 mb-6">
            {campaign.description}
          </p>
        )}
        
        {campaign.cta_text && campaign.cta_url && (
          <div className="flex space-x-3">
            <a
              href={campaign.cta_url}
              className="flex-1 px-6 py-3 text-center font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: campaign.cta_button_color || '#007bff',
                color: campaign.cta_text_color || '#ffffff'
              }}
            >
              {campaign.cta_text}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  const renderCampaign = () => {
    switch (campaign.template_type) {
      case 'hero_banner':
        return renderHeroBanner();
      case 'promo_card':
        return renderPromoCard();
      case 'popup':
        return renderPopup();
      default:
        return renderHeroBanner();
    }
  };

  const getStatusBadge = () => {
    if (campaign.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Eye className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    } else if (campaign.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <EyeOff className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <EyeOff className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Campaign Preview</h2>
          <p className="text-gray-600 mt-1">{campaign.campaign_name}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {getStatusBadge()}
          
          {!isPreview && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              
              {campaign.is_published ? (
                onUnpublish && (
                  <button
                    onClick={onUnpublish}
                    className="flex items-center space-x-2 px-3 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unpublish</span>
                  </button>
                )
              ) : (
                onPublish && (
                  <button
                    onClick={onPublish}
                    className="flex items-center space-x-2 px-3 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                )
              )}
              
              {onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(!campaign.is_active)}
                  className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                    campaign.is_active
                      ? 'text-red-600 border-red-600 hover:bg-red-50'
                      : 'text-green-600 border-green-600 hover:bg-green-50'
                  }`}
                >
                  {campaign.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{campaign.is_active ? 'Deactivate' : 'Activate'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Template:</span>
            <span className="ml-2 text-gray-600">{template.template_name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <span className="ml-2 text-gray-600">
              {new Date(campaign.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Views:</span>
            <span className="ml-2 text-gray-600">{campaign.views_count}</span>
          </div>
        </div>
        
        {(campaign.target_audience?.length || campaign.target_channels?.length) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {campaign.target_audience?.length && (
                <div>
                  <span className="font-medium text-gray-700">Target Audience:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {campaign.target_audience.map(audience => (
                      <span
                        key={audience}
                        className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {audience.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {campaign.target_channels?.length && (
                <div>
                  <span className="font-medium text-gray-700">Channels:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {campaign.target_channels.map(channel => (
                      <span
                        key={channel}
                        className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                      >
                        {channel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Preview</h3>
        
        <div className="relative">
          {isPreview && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Preview Mode
              </span>
            </div>
          )}
          
          {renderCampaign()}
        </div>
      </div>

      {/* Analytics */}
      {!isPreview && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{campaign.views_count}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{campaign.clicks_count}</div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{campaign.conversions_count}</div>
              <div className="text-sm text-gray-600">Conversions</div>
            </div>
          </div>
          
          {campaign.views_count > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Click-through rate: {((campaign.clicks_count / campaign.views_count) * 100).toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignPreview;
