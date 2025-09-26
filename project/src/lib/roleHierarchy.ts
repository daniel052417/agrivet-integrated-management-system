/**
 * Role Hierarchy System
 * 
 * This file defines the role hierarchy and provides utility functions
 * for role-based permission checks without using database level column.
 */

// Role hierarchy levels (lower number = higher access)
export const ROLE_HIERARCHY = {
  'super-admin': 1,
  'hr-admin': 2,
  'marketing-admin': 2,
  'hr-staff': 3,
  'marketing-staff': 3,
  'cashier': 4,
  'inventory-clerk': 4,
  'user': 5
} as const;

export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Check if a user role has at least the minimum required role level
 * @param userRole - The user's current role
 * @param minRole - The minimum required role
 * @returns true if user has sufficient permissions
 */
export function hasAtLeastRole(userRole: string, minRole: RoleName): boolean {
  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase() as RoleName] || ROLE_HIERARCHY.user;
  const requiredLevel = ROLE_HIERARCHY[minRole];
  
  return userLevel <= requiredLevel;
}

/**
 * Check if a user can manage another user based on role hierarchy
 * @param userRole - The user's current role
 * @param targetRole - The role of the user being managed
 * @param action - The action being performed ('create', 'update', 'delete', 'view')
 * @returns true if user can perform the action
 */
export function canManageUser(userRole: string, targetRole: string, action: 'create' | 'update' | 'delete' | 'view'): boolean {
  // Super admin can do everything
  if (userRole.toLowerCase() === 'super-admin') {
    return true;
  }

  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase() as RoleName] || ROLE_HIERARCHY.user;
  const targetLevel = ROLE_HIERARCHY[targetRole.toLowerCase() as RoleName] || ROLE_HIERARCHY.user;

  // Users can only manage users at their level or below
  switch (action) {
    case 'create':
    case 'update':
    case 'delete':
      return userLevel < targetLevel; // Can manage users with higher level numbers (lower access)
    case 'view':
      return userLevel <= targetLevel; // Can view users at same level or below
    default:
      return false;
  }
}

/**
 * Get all roles that a user can manage
 * @param userRole - The user's current role
 * @returns Array of role names that the user can manage
 */
export function getManageableRoles(userRole: string): RoleName[] {
  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase() as RoleName] || ROLE_HIERARCHY.user;
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level > userLevel)
    .map(([roleName, _]) => roleName as RoleName);
}

/**
 * Get role display information
 * @param roleName - The role name
 * @returns Object with role display information
 */
export function getRoleInfo(roleName: string): { level: number; displayName: string; description: string } {
  const level = ROLE_HIERARCHY[roleName.toLowerCase() as RoleName] || ROLE_HIERARCHY.user;
  
  const roleInfo = {
    'super-admin': { displayName: 'Super Administrator', description: 'Full system access' },
    'hr-admin': { displayName: 'HR Administrator', description: 'Human resources management' },
    'marketing-admin': { displayName: 'Marketing Administrator', description: 'Marketing campaign management' },
    'hr-staff': { displayName: 'HR Staff', description: 'HR operations and support' },
    'marketing-staff': { displayName: 'Marketing Staff', description: 'Marketing operations and support' },
    'cashier': { displayName: 'Cashier', description: 'Point of sale operations' },
    'inventory-clerk': { displayName: 'Inventory Clerk', description: 'Inventory management' },
    'user': { displayName: 'User', description: 'Basic user access' }
  };

  const info = roleInfo[roleName.toLowerCase() as keyof typeof roleInfo] || roleInfo.user;
  
  return {
    level,
    displayName: info.displayName,
    description: info.description
  };
}
