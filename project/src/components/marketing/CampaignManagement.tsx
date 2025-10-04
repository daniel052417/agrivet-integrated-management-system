import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Upload as Publish, 
  Download as Unpublish,
  BarChart3,
  Calendar,
  Users,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Megaphone as Campaign
} from 'lucide-react';
import { MarketingCampaign, CampaignTemplate, CampaignFilters, CampaignTemplateType } from '../../types/marketing';
import { getCampaigns, getCampaignTemplates, deleteCampaign, toggleCampaignStatus, publishCampaign, unpublishCampaign } from '../../lib/campaignApi';
import CampaignForm from './CampaignForm';
import CampaignPreview from './CampaignPreview';

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  
  // Filters and Search
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, [filters, currentPage]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const searchFilters = {
        ...filters,
        search: searchTerm || undefined,
        template_type: templateFilter !== 'all' ? templateFilter as CampaignTemplateType : undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        is_published: statusFilter === 'published' ? true : statusFilter === 'draft' ? false : undefined
      };

      const response = await getCampaigns(searchFilters, currentPage, 10);
      
      if (response.success && response.data) {
        setCampaigns(response.data.campaigns);
        setTotalCampaigns(response.data.total);
        setTotalPages(Math.ceil(response.data.total / 10));
      } else {
        setError(response.error || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('An error occurred while loading campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getCampaignTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowForm(true);
  };

  const handleEditCampaign = (campaign: MarketingCampaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handlePreviewCampaign = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign);
    setShowPreview(true);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const response = await deleteCampaign(campaignId);
      if (response.success) {
        await loadCampaigns();
      } else {
        setError(response.error || 'Failed to delete campaign');
      }
    } catch (err) {
      setError('An error occurred while deleting the campaign');
      console.error('Error deleting campaign:', err);
    }
  };

  const handleToggleStatus = async (campaignId: string, isActive: boolean) => {
    try {
      const response = await toggleCampaignStatus(campaignId, isActive);
      if (response.success) {
        await loadCampaigns();
      } else {
        setError(response.error || 'Failed to update campaign status');
      }
    } catch (err) {
      setError('An error occurred while updating campaign status');
      console.error('Error updating campaign status:', err);
    }
  };

  const handlePublishCampaign = async (campaignId: string) => {
    try {
      const response = await publishCampaign(campaignId);
      if (response.success) {
        await loadCampaigns();
      } else {
        setError(response.error || 'Failed to publish campaign');
      }
    } catch (err) {
      setError('An error occurred while publishing the campaign');
      console.error('Error publishing campaign:', err);
    }
  };

  const handleUnpublishCampaign = async (campaignId: string) => {
    try {
      const response = await unpublishCampaign(campaignId);
      if (response.success) {
        await loadCampaigns();
      } else {
        setError(response.error || 'Failed to unpublish campaign');
      }
    } catch (err) {
      setError('An error occurred while unpublishing the campaign');
      console.error('Error unpublishing campaign:', err);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // This would be handled by the parent component or a campaign service
      setShowForm(false);
      await loadCampaigns();
    } catch (err) {
      console.error('Error submitting campaign form:', err);
    }
  };

  const getStatusBadge = (campaign: MarketingCampaign) => {
    if (campaign.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    } else if (campaign.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Play className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Pause className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    }
  };

  const getTemplateIcon = (templateType: CampaignTemplateType) => {
    switch (templateType) {
      case 'hero_banner':
        return <Globe className="w-4 h-4" />;
      case 'promo_card':
        return <ImageIcon className="w-4 h-4" />;
      case 'popup':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  if (showForm) {
    return (
      <CampaignForm
        campaign={editingCampaign}
        templates={templates}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
        onPreview={(data) => {
          // Create a temporary campaign object for preview
          const tempCampaign: MarketingCampaign = {
            id: 'preview',
            campaign_name: data.campaign_name,
            template_type: data.template_type,
            title: data.title,
            description: data.description,
            content: data.content,
            background_color: data.background_color,
            text_color: data.text_color,
            image_url: data.image_url,
            image_alt_text: data.image_alt_text,
            cta_text: data.cta_text,
            cta_url: data.cta_url,
            cta_button_color: data.cta_button_color,
            cta_text_color: data.cta_text_color,
            target_audience: data.target_audience,
            target_channels: data.target_channels,
            is_active: data.is_active,
            is_published: false,
            publish_date: data.publish_date,
            unpublish_date: data.unpublish_date,
            views_count: 0,
            clicks_count: 0,
            conversions_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setSelectedCampaign(tempCampaign);
          setShowPreview(true);
        }}
        isLoading={false}
      />
    );
  }

  if (showPreview && selectedCampaign) {
    const template = templates.find(t => t.template_type === selectedCampaign.template_type);
    if (!template) return null;

    return (
      <CampaignPreview
        campaign={selectedCampaign}
        template={template}
        isPreview={selectedCampaign.id === 'preview'}
        onClose={() => setShowPreview(false)}
        onEdit={() => {
          setShowPreview(false);
          setEditingCampaign(selectedCampaign);
          setShowForm(true);
        }}
        onPublish={() => selectedCampaign.id !== 'preview' && handlePublishCampaign(selectedCampaign.id)}
        onUnpublish={() => selectedCampaign.id !== 'preview' && handleUnpublishCampaign(selectedCampaign.id)}
        onToggleStatus={(isActive) => selectedCampaign.id !== 'preview' && handleToggleStatus(selectedCampaign.id, isActive)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Campaign Management</h2>
          <p className="text-gray-600 mt-1">Create and manage marketing campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={handleCreateCampaign}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.template_type}>
                  {template.template_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadCampaigns}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Campaigns ({totalCampaigns})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first campaign</p>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {campaign.campaign_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {campaign.title}
                        </div>
                        {campaign.image_url && (
                          <div className="mt-2">
                            <img
                              src={campaign.image_url}
                              alt={campaign.image_alt_text || campaign.title}
                              className="w-16 h-12 object-cover rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTemplateIcon(campaign.template_type)}
                        <span className="text-sm text-gray-900">
                          {templates.find(t => t.template_type === campaign.template_type)?.template_name || campaign.template_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>{campaign.views_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4 text-green-600" />
                            <span>{campaign.clicks_count}</span>
                          </div>
                        </div>
                        {campaign.views_count > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            CTR: {((campaign.clicks_count / campaign.views_count) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewCampaign(campaign)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {campaign.is_published ? (
                          <button
                            onClick={() => handleUnpublishCampaign(campaign.id)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Unpublish"
                          >
                            <Unpublish className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishCampaign(campaign.id)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Publish"
                          >
                            <Publish className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(campaign.id, !campaign.is_active)}
                          className={`transition-colors ${
                            campaign.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={campaign.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCampaigns)} of {totalCampaigns} campaigns
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignManagement;



















