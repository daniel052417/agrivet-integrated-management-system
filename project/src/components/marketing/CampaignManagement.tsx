import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Target, 
  Users, 
  Eye, 
  Edit, 
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';

// Mock data for event campaigns
const mockCampaigns = [
  {
    id: 1,
    name: "Farmers' Workshop 2025",
    description: "Free workshop on modern farming techniques and sustainable agriculture practices",
    status: "active",
    startDate: "2025-01-15",
    endDate: "2025-02-15",
    eventType: "workshop",
    location: "Main Store - Poblacion Branch",
    maxAttendees: 50,
    currentAttendees: 32,
    branches: ["Poblacion Branch"],
    image: "/api/placeholder/300/150",
    createdAt: "2025-01-10",
    createdBy: "John Doe",
    metrics: {
      views: 1250,
      clicks: 340,
      registrations: 32
    }
  },
  {
    id: 2,
    name: "New Product Launch Event",
    description: "Come see our latest agricultural equipment and tools demonstration",
    status: "ended",
    startDate: "2024-12-20",
    endDate: "2025-01-10",
    eventType: "launch",
    location: "All Branches",
    maxAttendees: 100,
    currentAttendees: 78,
    branches: ["All Branches"],
    image: "/api/placeholder/300/150",
    createdAt: "2024-12-15",
    createdBy: "Jane Smith",
    metrics: {
      views: 980,
      clicks: 245,
      registrations: 78
    }
  },
  {
    id: 3,
    name: "Community Giveaway Event",
    description: "Free seeds and farming supplies giveaway for local farmers",
    status: "upcoming",
    startDate: "2025-02-01",
    endDate: "2025-02-28",
    eventType: "giveaway",
    location: "Poblacion Branch",
    maxAttendees: 200,
    currentAttendees: 0,
    branches: ["Poblacion Branch"],
    image: "/api/placeholder/300/150",
    createdAt: "2025-01-20",
    createdBy: "Mike Johnson",
    metrics: {
      views: 0,
      clicks: 0,
      registrations: 0
    }
  },
  {
    id: 4,
    name: "Anniversary Celebration",
    description: "Join us for our 10th anniversary celebration with special activities",
    status: "draft",
    startDate: "2025-02-10",
    endDate: "2025-02-17",
    eventType: "celebration",
    location: "All Branches",
    maxAttendees: 150,
    currentAttendees: 0,
    branches: ["All Branches"],
    image: "/api/placeholder/300/150",
    createdAt: "2025-01-25",
    createdBy: "Sarah Wilson",
    metrics: {
      views: 0,
      clicks: 0,
      registrations: 0
    }
  }
];

// Event types for selection
const eventTypes = [
  { value: 'workshop', label: 'Workshop', icon: '🎓' },
  { value: 'launch', label: 'Product Launch', icon: '🚀' },
  { value: 'giveaway', label: 'Giveaway', icon: '🎁' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' }
];

const CampaignManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || { value: type, label: type, icon: '🎪' };
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'launch': return 'bg-purple-100 text-purple-800';
      case 'giveaway': return 'bg-green-100 text-green-800';
      case 'celebration': return 'bg-pink-100 text-pink-800';
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

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderGridView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredCampaigns.map((campaign) => (
        <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-blue-500 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <p className="text-sm opacity-90 line-clamp-2">{campaign.description}</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Branches</span>
                <span className="font-medium">{campaign.branches.length} branch{campaign.branches.length > 1 ? 'es' : ''}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Event Type</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(campaign.eventType)}`}>
                    {getEventTypeInfo(campaign.eventType).icon} {getEventTypeInfo(campaign.eventType).label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium text-sm">{campaign.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Attendees</span>
                  <span className="font-medium">{campaign.currentAttendees} / {campaign.maxAttendees}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((campaign.currentAttendees / campaign.maxAttendees) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Capacity: {campaign.maxAttendees}</span>
                  <span>{Math.round((campaign.currentAttendees / campaign.maxAttendees) * 100)}%</span>
                </div>
              </div>
              
              {campaign.status === 'active' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{campaign.metrics.views}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{campaign.metrics.registrations}</div>
                    <div className="text-xs text-gray-500">Registrations</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCampaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-12 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{campaign.description}</div>
                      <div className="text-xs text-gray-400">{campaign.location}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(campaign.eventType)}`}>
                    {getEventTypeInfo(campaign.eventType).icon} {getEventTypeInfo(campaign.eventType).label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{formatDate(campaign.startDate)}</div>
                  <div className="text-gray-500">to {formatDate(campaign.endDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{campaign.currentAttendees} / {campaign.maxAttendees}</div>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((campaign.currentAttendees / campaign.maxAttendees) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{Math.round((campaign.currentAttendees / campaign.maxAttendees) * 100)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-emerald-600 hover:text-emerald-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Campaigns</h2>
          <p className="text-gray-600">Create and manage community events and workshops</p>
        </div>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="ended">Ended</option>
              <option value="draft">Draft</option>
            </select>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="w-4 h-4 flex flex-col space-y-0.5">
                  <div className="h-0.5 bg-current rounded"></div>
                  <div className="h-0.5 bg-current rounded"></div>
                  <div className="h-0.5 bg-current rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{mockCampaigns.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-3xl font-bold text-gray-900">{mockCampaigns.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-3xl font-bold text-gray-900">{mockCampaigns.reduce((sum, c) => sum + c.currentAttendees, 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">{mockCampaigns.reduce((sum, c) => sum + c.metrics.views, 0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  );
};

export default CampaignManagement;