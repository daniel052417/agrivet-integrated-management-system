import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Gift, Star, Trophy, Users, TrendingUp, Target, Crown, Award, Filter, Download, Zap, Heart } from 'lucide-react';

const LoyaltyRewards: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('programs');
  const [selectedTier, setSelectedTier] = useState('all');

  const loyaltyPrograms = [
    {
      id: 1,
      name: 'AGRIVET VIP Club',
      type: 'Points-Based',
      members: 2847,
      activeMembers: 1923,
      pointsIssued: 456789,
      pointsRedeemed: 234567,
      redemptionRate: 51.3,
      revenue: 1245600,
      status: 'Active',
      startDate: '2024-01-01'
    },
    {
      id: 2,
      name: 'Farmer Loyalty Program',
      type: 'Tier-Based',
      members: 892,
      activeMembers: 678,
      pointsIssued: 123456,
      pointsRedeemed: 89012,
      redemptionRate: 72.1,
      revenue: 567800,
      status: 'Active',
      startDate: '2024-01-15'
    },
    {
      id: 3,
      name: 'Pet Owner Rewards',
      type: 'Cashback',
      members: 1456,
      activeMembers: 1089,
      pointsIssued: 234567,
      pointsRedeemed: 156789,
      redemptionRate: 66.8,
      revenue: 789400,
      status: 'Active',
      startDate: '2024-01-10'
    }
  ];

  const memberTiers = [
    {
      tier: 'Bronze',
      members: 1892,
      minSpend: 0,
      benefits: ['5% discount', 'Birthday bonus'],
      pointsMultiplier: 1,
      color: 'bg-orange-500',
      icon: Award
    },
    {
      tier: 'Silver',
      members: 1245,
      minSpend: 10000,
      benefits: ['10% discount', 'Free delivery', 'Priority support'],
      pointsMultiplier: 1.5,
      color: 'bg-gray-400',
      icon: Star
    },
    {
      tier: 'Gold',
      members: 567,
      minSpend: 25000,
      benefits: ['15% discount', 'Free delivery', 'Exclusive products', 'VIP events'],
      pointsMultiplier: 2,
      color: 'bg-yellow-500',
      icon: Trophy
    },
    {
      tier: 'Platinum',
      members: 143,
      minSpend: 50000,
      benefits: ['20% discount', 'Free delivery', 'Personal advisor', 'Early access'],
      pointsMultiplier: 3,
      color: 'bg-purple-500',
      icon: Crown
    }
  ];

  const rewardCatalog = [
    {
      id: 1,
      name: '₱500 Store Credit',
      category: 'Store Credit',
      pointsCost: 5000,
      redemptions: 234,
      popularity: 89,
      status: 'Active',
      image: null
    },
    {
      id: 2,
      name: 'Free Veterinary Consultation',
      category: 'Services',
      pointsCost: 3000,
      redemptions: 156,
      popularity: 76,
      status: 'Active',
      image: null
    },
    {
      id: 3,
      name: 'Premium Pet Food Bundle',
      category: 'Products',
      pointsCost: 8000,
      redemptions: 89,
      popularity: 92,
      status: 'Active',
      image: null
    },
    {
      id: 4,
      name: 'Agricultural Tools Set',
      category: 'Products',
      pointsCost: 12000,
      redemptions: 45,
      popularity: 68,
      status: 'Active',
      image: null
    },
    {
      id: 5,
      name: 'VIP Event Access',
      category: 'Experiences',
      pointsCost: 2500,
      redemptions: 67,
      popularity: 84,
      status: 'Limited',
      image: null
    }
  ];

  const performanceMetrics = [
    {
      title: 'Total Members',
      value: '5,195',
      change: '+18.5% this month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Users
    },
    {
      title: 'Active Members',
      value: '3,690',
      change: '71% engagement rate',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: Zap
    },
    {
      title: 'Points Redeemed',
      value: '480K',
      change: '+24.3% vs last month',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: Gift
    },
    {
      title: 'Program Revenue',
      value: '₱2.6M',
      change: '+31.2% growth',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: TrendingUp
    }
  ];

  const topMembers = [
    { name: 'Maria Santos', tier: 'Platinum', points: 45600, spent: 156000, joined: '2024-01-01' },
    { name: 'Juan Dela Cruz', tier: 'Gold', points: 34500, spent: 89000, joined: '2024-01-05' },
    { name: 'Green Valley Farm', tier: 'Gold', points: 28900, spent: 67800, joined: '2024-01-10' },
    { name: 'Ana Rodriguez', tier: 'Silver', points: 23400, spent: 45600, joined: '2024-01-15' },
    { name: 'Pet Care Clinic', tier: 'Platinum', points: 56700, spent: 234000, joined: '2024-01-03' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Limited': return 'bg-orange-100 text-orange-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Points-Based': return 'bg-blue-100 text-blue-800';
      case 'Tier-Based': return 'bg-purple-100 text-purple-800';
      case 'Cashback': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'bg-orange-100 text-orange-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loyalty & Rewards Program</h2>
          <p className="text-gray-600 mt-1">Manage customer loyalty programs and reward systems</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Program</span>
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

      {/* Member Tiers and Top Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Tiers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Member Tiers</h3>
            <Crown className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {memberTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tier.color} bg-opacity-20`}>
                        <Icon className={`w-5 h-5 ${tier.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{tier.tier}</h4>
                        <p className="text-xs text-gray-500">Min spend: ₱{tier.minSpend.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{tier.members.toLocaleString()}</span>
                      <p className="text-xs text-gray-500">members</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Points multiplier: {tier.pointsMultiplier}x</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tier.benefits.map((benefit, benefitIndex) => (
                        <span key={benefitIndex} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Members</h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(member.tier)}`}>
                        {member.tier}
                      </span>
                      <span className="text-xs text-gray-500">Since {member.joined}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{member.points.toLocaleString()} pts</p>
                  <p className="text-xs text-gray-500">₱{member.spent.toLocaleString()} spent</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['programs', 'rewards', 'members'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {selectedTab === 'members' && (
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            )}
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'programs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Loyalty Programs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redemption Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loyaltyPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{program.name}</div>
                        <div className="text-sm text-gray-500">Started: {program.startDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(program.type)}`}>
                        {program.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{program.members.toLocaleString()} total</div>
                      <div className="text-gray-500">{program.activeMembers.toLocaleString()} active</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Issued: {program.pointsIssued.toLocaleString()}</div>
                      <div className="text-gray-500">Redeemed: {program.pointsRedeemed.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{program.redemptionRate}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${program.redemptionRate}%` }}
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
      )}

      {selectedTab === 'rewards' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Reward Catalog</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardCatalog.map((reward) => (
                <div key={reward.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-green-600" />
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reward.status)}`}>
                      {reward.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{reward.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{reward.category}</p>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-bold text-green-600">{reward.pointsCost.toLocaleString()} pts</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Redemptions:</span>
                      <span className="font-medium">{reward.redemptions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Popularity:</span>
                      <span className="font-medium">{reward.popularity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${reward.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                    <button className="flex-1 text-green-600 hover:text-green-800 transition-colors text-sm font-medium">
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Gift className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Add New Reward</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Member Segmentation</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Crown className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Tier Management</span>
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

export default LoyaltyRewards;