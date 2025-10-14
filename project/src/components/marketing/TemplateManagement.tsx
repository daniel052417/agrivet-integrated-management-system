import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Mail, 
  MessageSquare, 
  FileText,
  Image as ImageIcon,
  Calendar,
  User,
  MoreHorizontal,
  Star,
  Megaphone
} from 'lucide-react';

// Mock data for email templates
const mockTemplates = [
  {
    id: 1,
    name: "Welcome Email",
    subject: "Welcome to Tiongson Agrivet!",
    type: "email",
    category: "onboarding",
    status: "active",
    lastModified: "2025-01-20",
    modifiedBy: "John Doe",
    usageCount: 45,
    description: "Welcome new customers to our platform"
  },
  {
    id: 2,
    name: "Promotion Alert",
    subject: "Special Offer - Up to 30% Off!",
    type: "email",
    category: "promotion",
    status: "active",
    lastModified: "2025-01-18",
    modifiedBy: "Jane Smith",
    usageCount: 23,
    description: "Notify customers about special promotions"
  },
  {
    id: 3,
    name: "Order Confirmation",
    subject: "Your Order Has Been Confirmed",
    type: "email",
    category: "transaction",
    status: "active",
    lastModified: "2025-01-15",
    modifiedBy: "Mike Johnson",
    usageCount: 156,
    description: "Confirm customer orders"
  },
  {
    id: 4,
    name: "SMS Promotion",
    subject: "SMS: 20% off this weekend!",
    type: "sms",
    category: "promotion",
    status: "draft",
    lastModified: "2025-01-22",
    modifiedBy: "Sarah Wilson",
    usageCount: 0,
    description: "SMS promotion for weekend sales"
  },
  {
    id: 5,
    name: "Newsletter Template",
    subject: "Monthly Newsletter - January 2025",
    type: "email",
    category: "newsletter",
    status: "active",
    lastModified: "2025-01-10",
    modifiedBy: "John Doe",
    usageCount: 12,
    description: "Monthly newsletter for customers"
  }
];

const TemplateManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('featured-products');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'notification': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'notification': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'onboarding': return 'bg-emerald-100 text-emerald-800';
      case 'promotion': return 'bg-orange-100 text-orange-800';
      case 'transaction': return 'bg-blue-100 text-blue-800';
      case 'newsletter': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const renderFeaturedProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Featured Products</h3>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Featured products management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const renderBannersAds = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Banners & Ads</h3>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Create Banner</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Banner and ad management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const renderCreativeAssets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Creative Assets</h3>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Creative assets management functionality will be implemented here.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600">Manage featured products, banners, and creative assets</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setActiveSubTab('featured-products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'featured-products'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Featured Products</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSubTab('banners-ads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'banners-ads'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span>Banners & Ads</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSubTab('creative-assets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'creative-assets'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Creative Assets</span>
              </div>
            </button>
          </nav>
        </div>
        <div className="p-6">
          {activeSubTab === 'featured-products' && renderFeaturedProducts()}
          {activeSubTab === 'banners-ads' && renderBannersAds()}
          {activeSubTab === 'creative-assets' && renderCreativeAssets()}
        </div>
      </div>
    </div>
  );
};

export default TemplateManagement;