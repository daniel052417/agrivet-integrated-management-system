import React, { useEffect, useMemo, useState } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Users, 
  Settings, 
  BarChart3,
  Package,
  ShoppingCart,
  Megaphone,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Lock,
  Unlock,
  UserCheck,
  Activity,
  Database,
  Globe,
  Bell
} from 'lucide-react';

interface RolePermission {
  id: string;
  module: string;
  action: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  level: number; // 1 = highest, 5 = lowest
  isActive: boolean;
  userCount: number;
  permissions: RolePermission[];
  modules: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  color: string;
  icon: string;
}

const UserRolesOverview: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  // Mock data for roles and permissions
  const mockRoles: Role[] = [
    {
      id: '1',
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions and administrative capabilities',
      level: 1,
      isActive: true,
      userCount: 2,
      modules: ['Dashboard', 'Inventory', 'Sales', 'HR', 'Marketing', 'Reports', 'Settings', 'User Management'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: 'system',
      color: 'red',
      icon: 'Shield',
      permissions: [
        { id: '1', module: 'Dashboard', action: 'view', description: 'View all dashboard data', category: 'Read' },
        { id: '2', module: 'Dashboard', action: 'manage', description: 'Manage dashboard settings', category: 'Write' },
        { id: '3', module: 'Inventory', action: 'view', description: 'View inventory data', category: 'Read' },
        { id: '4', module: 'Inventory', action: 'create', description: 'Create new inventory items', category: 'Write' },
        { id: '5', module: 'Inventory', action: 'update', description: 'Update inventory items', category: 'Write' },
        { id: '6', module: 'Inventory', action: 'delete', description: 'Delete inventory items', category: 'Write' },
        { id: '7', module: 'Sales', action: 'view', description: 'View sales data', category: 'Read' },
        { id: '8', module: 'Sales', action: 'create', description: 'Create sales records', category: 'Write' },
        { id: '9', module: 'Sales', action: 'update', description: 'Update sales records', category: 'Write' },
        { id: '10', module: 'Sales', action: 'delete', description: 'Delete sales records', category: 'Write' },
        { id: '11', module: 'HR', action: 'view', description: 'View HR data', category: 'Read' },
        { id: '12', module: 'HR', action: 'manage', description: 'Manage HR operations', category: 'Write' },
        { id: '13', module: 'Marketing', action: 'view', description: 'View marketing data', category: 'Read' },
        { id: '14', module: 'Marketing', action: 'manage', description: 'Manage marketing campaigns', category: 'Write' },
        { id: '15', module: 'Reports', action: 'view', description: 'View all reports', category: 'Read' },
        { id: '16', module: 'Reports', action: 'export', description: 'Export reports', category: 'Write' },
        { id: '17', module: 'Settings', action: 'view', description: 'View system settings', category: 'Read' },
        { id: '18', module: 'Settings', action: 'manage', description: 'Manage system settings', category: 'Write' },
        { id: '19', module: 'User Management', action: 'view', description: 'View user accounts', category: 'Read' },
        { id: '20', module: 'User Management', action: 'manage', description: 'Manage user accounts', category: 'Write' }
      ]
    },
    {
      id: '2',
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access to most system modules with user management capabilities',
      level: 2,
      isActive: true,
      userCount: 5,
      modules: ['Dashboard', 'Inventory', 'Sales', 'HR', 'Marketing', 'Reports', 'Settings'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T14:20:00Z',
      createdBy: 'system',
      color: 'blue',
      icon: 'Settings',
      permissions: [
        { id: '21', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '22', module: 'Inventory', action: 'view', description: 'View inventory data', category: 'Read' },
        { id: '23', module: 'Inventory', action: 'create', description: 'Create inventory items', category: 'Write' },
        { id: '24', module: 'Inventory', action: 'update', description: 'Update inventory items', category: 'Write' },
        { id: '25', module: 'Sales', action: 'view', description: 'View sales data', category: 'Read' },
        { id: '26', module: 'Sales', action: 'create', description: 'Create sales records', category: 'Write' },
        { id: '27', module: 'Sales', action: 'update', description: 'Update sales records', category: 'Write' },
        { id: '28', module: 'HR', action: 'view', description: 'View HR data', category: 'Read' },
        { id: '29', module: 'HR', action: 'manage', description: 'Manage HR operations', category: 'Write' },
        { id: '30', module: 'Marketing', action: 'view', description: 'View marketing data', category: 'Read' },
        { id: '31', module: 'Marketing', action: 'manage', description: 'Manage marketing campaigns', category: 'Write' },
        { id: '32', module: 'Reports', action: 'view', description: 'View reports', category: 'Read' },
        { id: '33', module: 'Reports', action: 'export', description: 'Export reports', category: 'Write' },
        { id: '34', module: 'Settings', action: 'view', description: 'View settings', category: 'Read' }
      ]
    },
    {
      id: '3',
      name: 'hr_admin',
      displayName: 'HR Administrator',
      description: 'Full access to HR modules and staff management capabilities',
      level: 3,
      isActive: true,
      userCount: 3,
      modules: ['Dashboard', 'HR', 'Reports'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-12T09:15:00Z',
      createdBy: 'system',
      color: 'green',
      icon: 'Users',
      permissions: [
        { id: '35', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '36', module: 'HR', action: 'view', description: 'View HR data', category: 'Read' },
        { id: '37', module: 'HR', action: 'create', description: 'Create staff records', category: 'Write' },
        { id: '38', module: 'HR', action: 'update', description: 'Update staff records', category: 'Write' },
        { id: '39', module: 'HR', action: 'delete', description: 'Delete staff records', category: 'Write' },
        { id: '40', module: 'HR', action: 'manage', description: 'Manage HR operations', category: 'Write' },
        { id: '41', module: 'Reports', action: 'view', description: 'View HR reports', category: 'Read' },
        { id: '42', module: 'Reports', action: 'export', description: 'Export HR reports', category: 'Write' }
      ]
    },
    {
      id: '4',
      name: 'inventory_clerk',
      displayName: 'Inventory Clerk',
      description: 'Access to inventory management and product catalog operations',
      level: 4,
      isActive: true,
      userCount: 8,
      modules: ['Dashboard', 'Inventory'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-08T16:45:00Z',
      createdBy: 'system',
      color: 'orange',
      icon: 'Package',
      permissions: [
        { id: '43', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '44', module: 'Inventory', action: 'view', description: 'View inventory data', category: 'Read' },
        { id: '45', module: 'Inventory', action: 'create', description: 'Create inventory items', category: 'Write' },
        { id: '46', module: 'Inventory', action: 'update', description: 'Update inventory items', category: 'Write' }
      ]
    },
    {
      id: '5',
      name: 'marketing_admin',
      displayName: 'Marketing Administrator',
      description: 'Full access to marketing modules and campaign management',
      level: 3,
      isActive: true,
      userCount: 2,
      modules: ['Dashboard', 'Marketing', 'Reports'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-14T11:30:00Z',
      createdBy: 'system',
      color: 'purple',
      icon: 'Megaphone',
      permissions: [
        { id: '47', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '48', module: 'Marketing', action: 'view', description: 'View marketing data', category: 'Read' },
        { id: '49', module: 'Marketing', action: 'create', description: 'Create campaigns', category: 'Write' },
        { id: '50', module: 'Marketing', action: 'update', description: 'Update campaigns', category: 'Write' },
        { id: '51', module: 'Marketing', action: 'delete', description: 'Delete campaigns', category: 'Write' },
        { id: '52', module: 'Marketing', action: 'manage', description: 'Manage marketing operations', category: 'Write' },
        { id: '53', module: 'Reports', action: 'view', description: 'View marketing reports', category: 'Read' },
        { id: '54', module: 'Reports', action: 'export', description: 'Export marketing reports', category: 'Write' }
      ]
    },
    {
      id: '6',
      name: 'cashier',
      displayName: 'Cashier',
      description: 'Access to POS system and sales transactions',
      level: 5,
      isActive: true,
      userCount: 12,
      modules: ['Dashboard', 'Sales'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T13:20:00Z',
      createdBy: 'system',
      color: 'teal',
      icon: 'ShoppingCart',
      permissions: [
        { id: '55', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '56', module: 'Sales', action: 'view', description: 'View sales data', category: 'Read' },
        { id: '57', module: 'Sales', action: 'create', description: 'Create sales transactions', category: 'Write' },
        { id: '58', module: 'Sales', action: 'update', description: 'Update sales transactions', category: 'Write' }
      ]
    },
    {
      id: '7',
      name: 'hr_staff',
      displayName: 'HR Staff',
      description: 'Limited access to HR modules for staff operations',
      level: 4,
      isActive: true,
      userCount: 6,
      modules: ['Dashboard', 'HR'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-11T08:30:00Z',
      createdBy: 'system',
      color: 'indigo',
      icon: 'UserCheck',
      permissions: [
        { id: '59', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '60', module: 'HR', action: 'view', description: 'View HR data', category: 'Read' },
        { id: '61', module: 'HR', action: 'create', description: 'Create basic HR records', category: 'Write' },
        { id: '62', module: 'HR', action: 'update', description: 'Update basic HR records', category: 'Write' }
      ]
    },
    {
      id: '8',
      name: 'marketing_staff',
      displayName: 'Marketing Staff',
      description: 'Limited access to marketing modules for campaign support',
      level: 4,
      isActive: true,
      userCount: 4,
      modules: ['Dashboard', 'Marketing'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-13T15:45:00Z',
      createdBy: 'system',
      color: 'pink',
      icon: 'Bell',
      permissions: [
        { id: '63', module: 'Dashboard', action: 'view', description: 'View dashboard data', category: 'Read' },
        { id: '64', module: 'Marketing', action: 'view', description: 'View marketing data', category: 'Read' },
        { id: '65', module: 'Marketing', action: 'create', description: 'Create basic campaigns', category: 'Write' },
        { id: '66', module: 'Marketing', action: 'update', description: 'Update basic campaigns', category: 'Write' }
      ]
    }
  ];

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data
      // In a real implementation, this would load from a roles table
      setRoles(mockRoles);

      // Example of how to load real data:
      // const { data: rolesData, error: rolesError } = await supabase
      //   .from('roles')
      //   .select(`
      //     *,
      //     role_permissions (
      //       permissions (
      //         id,
      //         module,
      //         action,
      //         description,
      //         category
      //       )
      //     )
      //   `)
      //   .order('level', { ascending: true });
      // if (rolesError) throw rolesError;
      // setRoles(rolesData || []);

    } catch (err: any) {
      console.error('Error loading roles:', err);
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           role.modules.some(module => module.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLevel = levelFilter === 'all' || role.level.toString() === levelFilter;
      const matchesModule = moduleFilter === 'all' || role.modules.includes(moduleFilter);
      
      return matchesSearch && matchesLevel && matchesModule;
    });
  }, [roles, searchTerm, levelFilter, moduleFilter]);

  const getRoleIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Shield': Shield,
      'Settings': Settings,
      'Users': Users,
      'Package': Package,
      'Megaphone': Megaphone,
      'ShoppingCart': ShoppingCart,
      'UserCheck': UserCheck,
      'Bell': Bell
    };
    const IconComponent = iconMap[iconName] || Shield;
    return <IconComponent className="w-5 h-5" />;
  };

  const getRoleColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'red': 'bg-red-100 text-red-800',
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'orange': 'bg-orange-100 text-orange-800',
      'purple': 'bg-purple-100 text-purple-800',
      'teal': 'bg-teal-100 text-teal-800',
      'indigo': 'bg-indigo-100 text-indigo-800',
      'pink': 'bg-pink-100 text-pink-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'bg-red-100 text-red-800';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getLevelLabel = (level: number) => {
    if (level === 1) return 'Highest';
    if (level === 2) return 'High';
    if (level === 3) return 'Medium';
    if (level === 4) return 'Low';
    return 'Lowest';
  };

  const getModuleIcon = (module: string) => {
    const iconMap: { [key: string]: any } = {
      'Dashboard': BarChart3,
      'Inventory': Package,
      'Sales': ShoppingCart,
      'HR': Users,
      'Marketing': Megaphone,
      'Reports': FileText,
      'Settings': Settings,
      'User Management': Shield
    };
    const IconComponent = iconMap[module] || BarChart3;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStats = () => {
    const total = roles.length;
    const active = roles.filter(r => r.isActive).length;
    const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0);
    const avgUsersPerRole = totalUsers / total;
    const highLevelRoles = roles.filter(r => r.level <= 2).length;
    const lowLevelRoles = roles.filter(r => r.level >= 4).length;
    
    return { total, active, totalUsers, avgUsersPerRole, highLevelRoles, lowLevelRoles };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Roles</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadRoles}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-roles-overview">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Roles Overview</h1>
        <p className="text-gray-600">View system roles, permissions, and access levels (Read-only)</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Roles</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Active Roles</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Avg Users/Role</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgUsersPerRole.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">High Level</p>
              <p className="text-xl font-bold text-gray-900">{stats.highLevelRoles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Low Level</p>
              <p className="text-xl font-bold text-gray-900">{stats.lowLevelRoles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
              />
            </div>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1 (Highest)</option>
              <option value="2">Level 2 (High)</option>
              <option value="3">Level 3 (Medium)</option>
              <option value="4">Level 4 (Low)</option>
              <option value="5">Level 5 (Lowest)</option>
            </select>
            
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modules</option>
              <option value="Dashboard">Dashboard</option>
              <option value="Inventory">Inventory</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Reports">Reports</option>
              <option value="Settings">Settings</option>
              <option value="User Management">User Management</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getRoleColor(role.color)}`}>
                    {getRoleIcon(role.icon)}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{role.displayName}</h3>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(role.level)}`}>
                    Level {role.level}
                  </span>
                  {role.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{role.description}</p>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Users with this role</span>
                  <span className="font-semibold">{role.userCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((role.userCount / stats.totalUsers) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Accessible Modules</h4>
                <div className="flex flex-wrap gap-1">
                  {role.modules.map((module) => (
                    <span
                      key={module}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {getModuleIcon(module)}
                      <span className="ml-1">{module}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedRole(role);
                    setShowRoleModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
          <p className="text-gray-500">
            {searchTerm || levelFilter !== 'all' || moduleFilter !== 'all'
              ? 'No roles match your filter criteria.'
              : 'No roles found in the system.'
            }
          </p>
        </div>
      )}

      {/* Role Details Modal */}
      {showRoleModal && selectedRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${getRoleColor(selectedRole.color)}`}>
                    {getRoleIcon(selectedRole.icon)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedRole.displayName}</h3>
                    <p className="text-sm text-gray-500">{selectedRole.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(selectedRole.level)}`}>
                        Level {selectedRole.level} - {getLevelLabel(selectedRole.level)}
                      </span>
                      {selectedRole.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-900">{selectedRole.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Users with this role:</span>
                      <span className="font-semibold">{selectedRole.userCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total permissions:</span>
                      <span className="font-semibold">{selectedRole.permissions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accessible modules:</span>
                      <span className="font-semibold">{selectedRole.modules.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Accessible Modules</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRole.modules.map((module) => (
                    <span
                      key={module}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {getModuleIcon(module)}
                      <span className="ml-1">{module}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {selectedRole.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {getModuleIcon(permission.module)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.module} - {permission.action}
                            </div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          permission.category === 'Read' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {permission.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRolesOverview;








