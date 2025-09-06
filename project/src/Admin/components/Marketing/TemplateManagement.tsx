import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Palette, 
  Code, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { CampaignTemplate, CampaignTemplateType } from '../../../types/marketing';
import { getCampaignTemplates } from '../../../lib/campaignApi';

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getCampaignTemplates();
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error || 'Failed to load templates');
      }
    } catch (err) {
      setError('An error occurred while loading templates');
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template: CampaignTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleSaveTemplate = async (templateData: Partial<CampaignTemplate>) => {
    try {
      // This would be implemented in the API
      console.log('Saving template:', templateData);
      setShowForm(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const getTemplateIcon = (templateType: CampaignTemplateType) => {
    switch (templateType) {
      case 'hero_banner':
        return <Palette className="w-5 h-5 text-blue-600" />;
      case 'promo_card':
        return <Code className="w-5 h-5 text-green-600" />;
      case 'popup':
        return <Settings className="w-5 h-5 text-purple-600" />;
      default:
        return <Palette className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTemplateColor = (templateType: CampaignTemplateType) => {
    switch (templateType) {
      case 'hero_banner':
        return 'bg-blue-100 text-blue-800';
      case 'promo_card':
        return 'bg-green-100 text-green-800';
      case 'popup':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showForm && editingTemplate) {
    return (
      <TemplateForm
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowForm(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Template Management</h2>
          <p className="text-gray-600 mt-1">Customize and manage campaign templates</p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTemplateIcon(template.template_type)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.template_name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTemplateColor(template.template_type)}`}>
                      {template.template_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {template.is_active ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500">Required Fields:</div>
                <div className="flex flex-wrap gap-1">
                  {template.required_fields?.map((field, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="Edit Template"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="text-green-600 hover:text-green-900 transition-colors"
                    title="Preview Template"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Template Form Component
interface TemplateFormProps {
  template?: CampaignTemplate | null;
  onSave: (data: Partial<CampaignTemplate>) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    template_type: template?.template_type || 'hero_banner' as CampaignTemplateType,
    description: template?.description || '',
    default_styles: template?.default_styles || {},
    required_fields: template?.required_fields || [],
    is_active: template?.is_active ?? true
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {template ? 'Edit Template' : 'Create Template'}
        </h2>
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.template_name}
              onChange={(e) => handleInputChange('template_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter template name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type *
            </label>
            <select
              value={formData.template_type}
              onChange={(e) => handleInputChange('template_type', e.target.value as CampaignTemplateType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hero_banner">Hero Banner</option>
              <option value="promo_card">Promo Card</option>
              <option value="popup">Popup Modal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter template description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Fields (comma-separated)
          </label>
          <input
            type="text"
            value={formData.required_fields.join(', ')}
            onChange={(e) => handleInputChange('required_fields', e.target.value.split(', ').filter(f => f.trim()))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="title, description, cta_text, cta_url"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active Template
          </label>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{template ? 'Update Template' : 'Create Template'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateManagement;

