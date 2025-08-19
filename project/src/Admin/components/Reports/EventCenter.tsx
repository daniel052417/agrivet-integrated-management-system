import React, { useState } from 'react';
import { Calendar, Users, MapPin, Clock, TrendingUp, TrendingDown, Star, DollarSign, Download, Filter, Eye, Plus, Edit, Trash2 } from 'lucide-react';

const EventCenter: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const events = [
    {
      id: 1,
      title: 'Agricultural Technology Seminar',
      category: 'Educational',
      date: '2024-01-25',
      time: '09:00 AM - 05:00 PM',
      location: 'Main Conference Hall',
      attendees: 156,
      capacity: 200,
      revenue: 78000,
      status: 'Upcoming',
      organizer: 'AGRIVET Team',
      description: 'Latest trends in agricultural technology and sustainable farming practices'
    },
    {
      id: 2,
      title: 'Pet Care Workshop',
      category: 'Workshop',
      date: '2024-01-28',
      time: '02:00 PM - 06:00 PM',
      location: 'Training Room A',
      attendees: 45,
      capacity: 50,
      revenue: 22500,
      status: 'Upcoming',
      organizer: 'Dr. Maria Santos',
      description: 'Comprehensive pet care and health maintenance workshop'
    },
    {
      id: 3,
      title: 'Veterinary Medicine Conference',
      category: 'Conference',
      date: '2024-01-15',
      time: '08:00 AM - 06:00 PM',
      location: 'Grand Auditorium',
      attendees: 234,
      capacity: 250,
      revenue: 234000,
      status: 'Completed',
      organizer: 'Philippine Veterinary Association',
      description: 'Annual conference on veterinary medicine advances and practices'
    },
    {
      id: 4,
      title: 'Organic Farming Expo',
      category: 'Exhibition',
      date: '2024-01-12',
      time: '10:00 AM - 08:00 PM',
      location: 'Exhibition Hall',
      attendees: 892,
      capacity: 1000,
      revenue: 445000,
      status: 'Completed',
      organizer: 'Organic Farmers Association',
      description: 'Showcase of organic farming products and techniques'
    },
    {
      id: 5,
      title: 'Animal Nutrition Symposium',
      category: 'Symposium',
      date: '2024-02-05',
      time: '01:00 PM - 05:00 PM',
      location: 'Conference Room B',
      attendees: 0,
      capacity: 80,
      revenue: 0,
      status: 'Scheduled',
      organizer: 'Animal Nutrition Society',
      description: 'Latest research in animal nutrition and feed optimization'
    }
  ];

  const eventMetrics = [
    {
      title: 'Total Events',
      value: '24',
      change: '+6',
      isPositive: true,
      period: 'This Quarter'
    },
    {
      title: 'Total Attendees',
      value: '3,456',
      change: '+18.5%',
      isPositive: true,
      period: 'This Quarter'
    },
    {
      title: 'Event Revenue',
      value: '₱1.2M',
      change: '+24.3%',
      isPositive: true,
      period: 'This Quarter'
    },
    {
      title: 'Average Rating',
      value: '4.7/5',
      change: '+0.2',
      isPositive: true,
      period: 'Satisfaction Score'
    }
  ];

  const eventCategories = [
    { category: 'Educational', count: 8, attendees: 1245, revenue: 456000, color: 'bg-blue-500' },
    { category: 'Workshop', count: 6, attendees: 567, revenue: 234000, color: 'bg-green-500' },
    { category: 'Conference', count: 4, attendees: 892, revenue: 567000, color: 'bg-purple-500' },
    { category: 'Exhibition', count: 3, attendees: 1456, revenue: 789000, color: 'bg-orange-500' },
    { category: 'Symposium', count: 3, attendees: 296, revenue: 145000, color: 'bg-red-500' }
  ];

  const upcomingEvents = events.filter(event => event.status === 'Upcoming' || event.status === 'Scheduled');
  const monthlyStats = [
    { month: 'Oct', events: 3, attendees: 456, revenue: 234000 },
    { month: 'Nov', events: 5, attendees: 789, revenue: 456000 },
    { month: 'Dec', events: 4, events: 4, attendees: 623, revenue: 345000 },
    { month: 'Jan', events: 6, attendees: 892, revenue: 567000 }
  ];

  const venues = [
    { name: 'Main Conference Hall', capacity: 200, events: 8, utilization: 85.2 },
    { name: 'Grand Auditorium', capacity: 250, events: 4, utilization: 92.8 },
    { name: 'Training Room A', capacity: 50, events: 6, utilization: 78.3 },
    { name: 'Exhibition Hall', capacity: 1000, events: 3, utilization: 89.2 },
    { name: 'Conference Room B', capacity: 80, events: 3, utilization: 65.5 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Educational': return 'bg-blue-100 text-blue-800';
      case 'Workshop': return 'bg-green-100 text-green-800';
      case 'Conference': return 'bg-purple-100 text-purple-800';
      case 'Exhibition': return 'bg-orange-100 text-orange-800';
      case 'Symposium': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = events.filter(event => {
    if (selectedTab === 'all') return true;
    return event.status.toLowerCase() === selectedTab;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Event Center</h2>
          <p className="text-gray-600 mt-1">Manage events, workshops, and conferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Event Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {eventMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="flex items-center space-x-1">
                {metric.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
              <p className="text-gray-500 text-xs mt-1">{metric.period}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Event Categories and Venue Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Event Categories</h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {eventCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.category}</p>
                    <p className="text-xs text-gray-500">{category.count} events • {category.attendees.toLocaleString()} attendees</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₱{(category.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Venue Utilization</h3>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {venues.map((venue, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{venue.name}</p>
                    <p className="text-xs text-gray-500">Capacity: {venue.capacity} • {venue.events} events</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{venue.utilization}%</span>
                    <p className="text-xs text-gray-500">utilization</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${venue.utilization}%` }}
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
              {['all', 'upcoming', 'scheduled', 'completed'].map((tab) => (
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="educational">Educational</option>
              <option value="workshop">Workshop</option>
              <option value="conference">Conference</option>
              <option value="exhibition">Exhibition</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Events ({filteredEvents.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500 truncate">{event.description}</div>
                      <div className="text-xs text-gray-400 mt-1">By {event.organizer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.date}</div>
                    <div className="text-sm text-gray-500">{event.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{event.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{event.attendees}/{event.capacity}</div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{event.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status}
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

      {/* Monthly Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Monthly Performance</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {monthlyStats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">{stat.month}</div>
              <div className="space-y-2">
                <div>
                  <div className="text-lg font-bold text-gray-900">{stat.events}</div>
                  <div className="text-xs text-gray-500">Events</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{stat.attendees.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Attendees</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">₱{(stat.revenue / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventCenter;