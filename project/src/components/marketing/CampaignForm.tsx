import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Upload, 
  Eye, 
  Palette, 
  Link, 
  Users, 
  Globe,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CampaignFormData {
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'social';
  template_id: string;
  subject?: string;
  content: string;
  target_audience: string[];
  scheduled_date?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  budget?: number;
  goals?: string;
  metrics?: string[];
}

interface CampaignTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  content: string;
  preview_image?: string;
  is_active: boolean;
}

interface CampaignFormProps {
  campaign?: any;
  templates: CampaignTemplate[];
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  onPreview?: (data: CampaignFormData) => void;
  isLoading?: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  templates,
  onSubmit,
  onCancel,
  onPreview,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    type: 'email',
    template_id: '',
    subject: '',
    content: '',
    target_audience: [],
    scheduled_date: '',
    status: 'draft',
    budget: 0,
    goals: '',
    metrics: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        type: campaign.type || 'email',
        template_id: campaign.template_id || '',
        subject: campaign.subject || '',
        content: campaign.content || '',
        target_audience: campaign.target_audience || [],
        scheduled_date: campaign.scheduled_date || '',
        status: campaign.status || 'draft',
        budget: campaign.budget || 0,
        goals: campaign.goals || '',
        metrics: campaign.metrics || []
      });
    }
  }, [campaign]);

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        type: template.type,
        content: template.content
      }));
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Simulate image upload - replace with actual upload service
      await new Promise(resolve => setTimeout(resolve, 1000));
      return 'https://via.placeholder.com/400x200';
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.template_id) {
      newErrors.template_id = 'Please select a template';
    }

    if (formData.type === 'email' && !formData.subject?.trim()) {
      newErrors.subject = 'Subject is required for email campaigns';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.target_audience.length === 0) {
      newErrors.target_audience = 'Please select at least one target audience';
    }

    if (formData.status === 'scheduled' && !formData.scheduled_date) {
      newErrors.scheduled_date = 'Scheduled date is required for scheduled campaigns';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting campaign:', error);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    }
    setPreviewMode(true);
  };

  const filteredTemplates = templates.filter(template => 
    template.type === formData.type && template.is_active
  );

  return (
    <div className="campaign-form">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
          <p className="text-gray-600">
            {campaign ? 'Update your marketing campaign' : 'Design and launch your marketing campaign'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter campaign name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                  <option value="social">Social Media</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your campaign"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Selection</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose Template *
              </label>
              <select
                value={formData.template_id}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.template_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a template</option>
                {filteredTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {errors.template_id && (
                <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
              )}
            </div>

            {formData.template_id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Template Preview</h3>
                <div className="text-sm text-gray-600">
                  {templates.find(t => t.id === formData.template_id)?.content}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Content</h2>
            
            {formData.type === 'email' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={formData.subject || ''}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email subject"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.content ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your campaign content"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['All Customers', 'VIP Customers', 'New Customers', 'Inactive Customers', 'Email Subscribers', 'SMS Subscribers'].map(audience => (
                <label key={audience} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.target_audience.includes(audience)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('target_audience', [...formData.target_audience, audience]);
                      } else {
                        handleInputChange('target_audience', formData.target_audience.filter(a => a !== audience));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{audience}</span>
                </label>
              ))}
            </div>
            {errors.target_audience && (
              <p className="mt-2 text-sm text-red-600">{errors.target_audience}</p>
            )}
          </div>

          {/* Scheduling */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_date || ''}
                    onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.scheduled_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.scheduled_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Budget & Goals */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget & Goals</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (Optional)
                </label>
                <input
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter budget amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goals (Optional)
                </label>
                <input
                  type="text"
                  value={formData.goals || ''}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter campaign goals"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            {onPreview && (
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center space-x-2 px-6 py-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}</span>
            </button>
          </div>
        </form>
      </div>
  );
};

export default CampaignForm;

