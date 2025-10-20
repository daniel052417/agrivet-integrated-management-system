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
      organizer: 'Dr. Sarah Johnson',
      description: 'Comprehensive pet care techniques and health management'
    },
    {
      id: 3,
      title: 'Farm Equipment Expo',
      category: 'Exhibition',
      date: '2024-01-20',
      time: '10:00 AM - 04:00 PM',
      location: 'Exhibition Grounds',
      attendees: 89,
      capacity: 100,
      revenue: 44500,
      status: 'Completed',
      organizer: 'Equipment Suppliers',
      description: 'Showcase of latest farming equipment and machinery'
    },
    {
      id: 4,
      title: 'Veterinary Conference',
      category: 'Conference',
      date: '2024-01-15',
      time: '08:00 AM - 06:00 PM',
      location: 'Grand Ballroom',
      attendees: 234,
      capacity: 300,
      revenue: 117000,
      status: 'Completed',
      organizer: 'Veterinary Association',
      description: 'Annual veterinary conference with industry experts'
    }
  ];

  const categories = ['all', 'Educational', 'Workshop', 'Exhibition', 'Conference'];
  const tabs = [
    { id: 'upcoming', label: 'Upcoming Events', count: events.filter(e => e.status === 'Upcoming').length },
    { id: 'completed', label: 'Completed Events', count: events.filter(e => e.status === 'Completed').length },
    { id: 'cancelled', label: 'Cancelled Events', count: 0 }
  ];

  const filteredEvents = events.filter(event => {
    const matchesTab = selectedTab === 'upcoming' ? event.status === 'Upcoming' : 
                      selectedTab === 'completed' ? event.status === 'Completed' : 
                      event.status === 'Cancelled';
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesTab && matchesCategory;
  });

  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
  const totalAttendees = events.reduce((sum, event) => sum + event.attendees, 0);
  const averageAttendance = events.length > 0 ? Math.round(totalAttendees / events.length) : 0;

  return (
    <div className="event-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Center</h1>
          <p className="text-gray-600">Manage and track all events and activities</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                <p className="text-2xl font-bold text-gray-900">{totalAttendees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{averageAttendance}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Event</span>
              </button>

              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.category}</div>
                        <div className="text-xs text-gray-400 mt-1">{event.organizer}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.date}</div>
                      <div className="text-sm text-gray-500">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        {event.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.attendees}/{event.capacity}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{event.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.status === 'Upcoming' 
                          ? 'bg-blue-100 text-blue-800'
                          : event.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
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

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">No events match your current filters.</p>
          </div>
        )}
      </div>
  );
};

export default EventCenter;


















