//MarketingDashboard.tsx

import React from 'react';
import {
  Megaphone,
  CalendarClock,
  PackageOpen,
  RefreshCcw,
  Eye,
  LayoutDashboard,
  ImageIcon,
  BellRing
} from 'lucide-react';

const mockDashboardData = {
  activePromotionsCount: 4,
  upcomingPromotionsCount: 3,
  newArrivalsCount: 12,
  restockedItemsCount: 8,
  pwaClickViews: 2760,
  featuredProducts: [
    {
      id: 'prod-001',
      name: 'Premium Fertilizer Mix',
      sku: 'FERT-001',
      priority: 'High',
      lastUpdated: 'Jan 20, 2025'
    },
    {
      id: 'prod-002',
      name: 'Hybrid Seed Pack',
      sku: 'SEED-014',
      priority: 'Medium',
      lastUpdated: 'Jan 18, 2025'
    },
    {
      id: 'prod-003',
      name: 'Automatic Watering Kit',
      sku: 'KIT-022',
      priority: 'High',
      lastUpdated: 'Jan 17, 2025'
    }
  ],
  topViewedPromotion: {
    id: 'promo-011',
    name: 'Dry Season Starter Bundle',
    totalViews: 2150,
    channel: 'PWA Landing Page',
    owner: 'Marketing Team',
    lastUpdated: 'Jan 21, 2025'
  },
  landingPageCarousels: [
    { id: 'carousel-001', title: 'Seasonal Highlights', slides: 4, active: true, lastUpdated: 'Jan 19, 2025' },
    { id: 'carousel-002', title: 'Branch Announcements', slides: 3, active: true, lastUpdated: 'Jan 16, 2025' },
    { id: 'carousel-003', title: 'Supplier Spotlight', slides: 2, active: false, lastUpdated: 'Jan 10, 2025' }
  ],
  recentAnnouncements: [
    { id: 'ann-001', title: 'Vet Clinic Schedule Update', channel: 'PWA', date: 'Jan 20, 2025', status: 'Published' },
    { id: 'ann-002', title: 'New Harvest Advisory', channel: 'Branches', date: 'Jan 18, 2025', status: 'Scheduled' },
    { id: 'ann-003', title: 'Supplier Pricing Notice', channel: 'Internal', date: 'Jan 17, 2025', status: 'Published' }
  ]
};

const MarketingDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
        <p className="text-gray-600">A simple overview of promotions and featured items for the landing page & PWA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Promotions</p>
              <p className="text-3xl font-bold text-gray-900">{mockDashboardData.activePromotionsCount}</p>
            </div>
            <Megaphone className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Promotions</p>
              <p className="text-3xl font-bold text-gray-900">{mockDashboardData.upcomingPromotionsCount}</p>
            </div>
            <CalendarClock className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Viewed Promotion</p>
              <p className="text-lg font-semibold text-gray-900">{mockDashboardData.topViewedPromotion.name}</p>
              <p className="text-sm text-gray-500">{mockDashboardData.topViewedPromotion.totalViews.toLocaleString()} views</p>
            </div>
            <Eye className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Arrivals</p>
              <p className="text-3xl font-bold text-gray-900">{mockDashboardData.newArrivalsCount}</p>
            </div>
            <PackageOpen className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Restocked Items</p>
              <p className="text-3xl font-bold text-gray-900">{mockDashboardData.restockedItemsCount}</p>
            </div>
            <RefreshCcw className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">PWA Click Views</p>
              <p className="text-3xl font-bold text-gray-900">{mockDashboardData.pwaClickViews.toLocaleString()}</p>
            </div>
            <LayoutDashboard className="w-6 h-6 text-cyan-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Announcements</p>
              <p className="text-3xl font-bold text-gray-900">{mockDashboardData.recentAnnouncements.length}</p>
            </div>
            <BellRing className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Featured Products</h2>
            <p className="text-sm text-gray-500">Items highlighted on the landing page</p>
          </div>
          <div className="p-6 space-y-4">
            {mockDashboardData.featuredProducts.map(product => (
              <div key={product.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  <p className="text-xs text-gray-400 mt-1">Priority: {product.priority}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Updated</p>
                  <p className="font-medium text-gray-900 text-sm">{product.lastUpdated}</p>
                </div>
              </div>
            ))}
            {mockDashboardData.featuredProducts.length === 0 && (
              <p className="text-sm text-gray-500">No featured products configured.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Most Viewed Promotion</h2>
                <p className="text-sm text-gray-500">High-performing promotion currently live</p>
              </div>
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{mockDashboardData.topViewedPromotion.name}</h3>
                <p className="text-sm text-gray-500">{mockDashboardData.topViewedPromotion.channel}</p>
                <p className="text-xs text-gray-400">Owner: {mockDashboardData.topViewedPromotion.owner}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Views</p>
                <p className="text-lg font-semibold text-gray-900">{mockDashboardData.topViewedPromotion.totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-lg font-semibold text-gray-900">{mockDashboardData.topViewedPromotion.lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Landing Page Carousels</h2>
                <p className="text-sm text-gray-500">Preview of active carousel slots</p>
              </div>
              <LayoutDashboard className="w-5 h-5 text-cyan-600" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {mockDashboardData.landingPageCarousels.map(carousel => (
              <div key={carousel.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{carousel.title}</p>
                  <p className="text-xs text-gray-500">{carousel.slides} slides • Updated {carousel.lastUpdated}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${carousel.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {carousel.active ? 'Active' : 'Paused'}
                </span>
              </div>
            ))}
            {mockDashboardData.landingPageCarousels.length === 0 && (
              <p className="text-sm text-gray-500">No carousel content configured.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
                <p className="text-sm text-gray-500">Latest updates pushed to branches and PWA</p>
              </div>
              <BellRing className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {mockDashboardData.recentAnnouncements.map(announcement => (
              <div key={announcement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{announcement.title}</p>
                  <p className="text-xs text-gray-500">Channel: {announcement.channel}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{announcement.date}</p>
                  <p className="text-sm font-semibold text-gray-900">{announcement.status}</p>
                </div>
              </div>
            ))}
            {mockDashboardData.recentAnnouncements.length === 0 && (
              <p className="text-sm text-gray-500">No announcements available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;