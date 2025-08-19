import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Share2, MapPin, TrendingUp, Users, DollarSign, Target, Calendar, Filter, Download, Gift, Star } from 'lucide-react';

const ReferralsVenueAds: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('referrals');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const referralPrograms = [
    {
      id: 1,
      name: 'Friend Referral Program',
      type: 'Customer Referral',
      reward: '₱500 Credit',
      referrals: 156,
      conversions: 89,
      revenue: 245600,
      conversionRate: 57.1,
      status: 'Active',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    {
      id: 2,
      name: 'Veterinarian Partnership',
      type: 'Professional Referral',
      reward: '10% Commission',
      referrals: 45,
      conversions: 38,
      revenue: 189500,
      conversionRate: 84.4,
      status: 'Active',
      startDate: '2024-01-15',
      endDate: '2024-06-15'
    },
    {
      id: 3,
      name: 'Farmer Network Referral',
      type: 'B2B Referral',
      reward: '₱1000 + 5%',
      referrals: 23,
      conversions: 18,
      revenue: 156800,
      conversionRate: 78.3,
      status: 'Active',
      startDate: '2024-01-10',
      endDate: '2024-03-10'
    }
  ];

  const venueAds = [
    {
      id: 1,
      venue: 'Central Veterinary Clinic',
      location: 'Quezon City',
      adType: 'Banner Display',
      duration: '3 months',
      cost: 15000,
      impressions: 45600,
      clicks: 892,
      conversions: 67,
      ctr: 1.96,
      status: 'Active',
      startDate: '2024-01-01',
      endDate: '2024-04-01'
    },
    {
      id: 2,
      venue: 'Farmers Market Plaza',
      location: 'Makati',
      adType: 'Digital Screen',
      duration: '6 months',
      cost: 28000,
      impressions: 78900,
      clicks: 1456,
      conversions: 123,
      ctr: 1.85,
      status: 'Active',
      startDate: '2024-01-15',
      endDate: '2024-07-15'
    },
    {
      id: 3,
      venue: 'Agricultural Supply Store',
      location: 'Cebu',
      adType: 'Poster Campaign',
      duration: '2 months',
      cost: 8500,
      impressions: 23400,
      clicks: 456,
      conversions: 34,
      ctr: 1.95,
      status: 'Completed',
      startDate: '2023-11-01',
      endDate: '2024-01-01'
    },
    {
      id: 4,
      venue: 'Pet Care Center Network',
      location: 'Metro Manila',
      adType: 'Brochure Distribution',
      duration: '4 months',
      cost: 12000,
      impressions: 34500,
      clicks: 678,
      conversions: 45,
      ctr: 1.97,
      status: 'Scheduled',
      startDate: '2024-02-01',
      endDate: '2024-06-01'
    }
  ];

  const performanceMetrics = [
    {
      title: 'Active Referral Programs',
      value: '8',
      change: '+2 this month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Share2
    },
    {
      title: 'Total Referral Revenue',
      value: '₱591K',
      change: '+24.5% vs last month',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: DollarSign
    },
    {
      title: 'Venue Ad Placements',
      value: '12',
      change: '4 locations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: MapPin
    },
    {
      title: 'Average Conversion Rate',
      value: '73.3%',
      change: '+5.2% improvement',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: Target
    }
  ];

  const topReferrers = [
    { name: 'Dr. Maria Santos', referrals: 23, conversions: 19, revenue: 89500, type: 'Veterinarian' },
    { name: 'Juan Dela Cruz', referrals: 18, conversions: 15, revenue: 67800, type: 'Customer' },
    { name: 'Green Valley Farm', referrals: 15, conversions: 12, revenue: 156000, type: 'Business' },
    { name: 'Ana Rodriguez', referrals: 12, conversions: 10, revenue: 45600, type: 'Customer' },
    { name: 'Pet Care Clinic', referrals: 10, conversions: 8, revenue: 34500, type: 'Partner' }
  ];

  const venueTypes = [
    { type: 'Veterinary Clinics', count: 8, impressions: 156000, color: 'bg-red-500' },
    { type: 'Farmers Markets', count: 5, impressions: 89000, color: 'bg-green-500' },
    { type: 'Pet Stores', count: 6, impressions: 67000, color: 'bg-blue-500' },
    { type: 'Agricultural Stores', count: 4, impressions: 45000, color: 'bg-orange-500' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Customer Referral': return 'bg-blue-100 text-blue-800';
      case 'Professional Referral': return 'bg-green-100 text-green-800';
      case 'B2B Referral': return 'bg-purple-100 text-purple-800';
      case 'Banner Display': return 'bg-orange-100 text-orange-800';
      case 'Digital Screen': return 'bg-red-100 text-red-800';
      case 'Poster Campaign': return 'bg-yellow-100 text-yellow-800';
      case 'Brochure Distribution': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Referrals & Venue Ads</h2>
          <p className="text-gray-600 mt-1">Manage referral programs and venue advertising campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{metric.title}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Referrers and Venue Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Referrers</h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topReferrers.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{referrer.name}</p>
                    <p className="text-xs text-gray-500">{referrer.type} • {referrer.referrals} referrals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₱{(referrer.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">{referrer.conversions} conversions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Venue Ad Types</h3>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {venueTypes.map((venue, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${venue.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{venue.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{venue.count}</span>
                    <span className="text-xs text-gray-500 ml-2">venues</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Impressions: {venue.impressions.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${venue.color}`}
                    style={{ width: `${(venue.impressions / 156000) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['referrals', 'venue-ads'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'referrals' ? 'Referral Programs' : 'Venue Advertisements'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Tables */}
      {selectedTab === 'referrals' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Referral Programs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referralPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{program.name}</div>
                        <div className="text-sm text-gray-500">{program.startDate} - {program.endDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(program.type)}`}>
                        {program.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{program.reward}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{program.referrals} referrals</div>
                      <div className="text-gray-500">{program.conversions} conversions</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{program.conversionRate}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${program.conversionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{program.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                        {program.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-colors">
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Venue Advertisements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {venueAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ad.venue}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {ad.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(ad.adType)}`}>
                        {ad.adType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{ad.duration}</div>
                      <div className="text-gray-500 text-xs">{ad.startDate} - {ad.endDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{ad.impressions.toLocaleString()} views</div>
                      <div className="text-gray-500">{ad.clicks} clicks • {ad.conversions} conversions</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{ad.ctr}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{ad.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ad.status)}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-colors">
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
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">New Referral Program</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <MapPin className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Book Venue Ad</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Partner Network</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Campaign Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralsVenueAds;