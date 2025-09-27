/**
 * Role Pages Mapping
 * 
 * This file defines the hardcoded mapping between roles and their dashboard pages.
 * Since we removed dynamic permissions, each role now has a fixed dashboard page.
 */

import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import POSDashboard from '../components/dashboard/POSDashboard';
import MarketingDashboard from '../components/dashboard/MarketingDashboard';
import InventoryDashboard from '../components/dashboard/InventoryDashboard';
import KioskDashboard from '../components/dashboard/KioskDashboard';
import POSWrapper from '../POS/POSWrapper';

export const ROLE_PAGES = {
  'super-admin': SuperAdminDashboard,
  'hr-admin': HRDashboard,
  'hr-staff': HRDashboard,
  'marketing-admin': MarketingDashboard,
  'marketing-staff': MarketingDashboard,
  'cashier': POSWrapper, // New comprehensive POS system with error handling
  'inventory-clerk': InventoryDashboard,
  'user': KioskDashboard, // Default fallback for basic users
} as const;

export type RoleName = keyof typeof ROLE_PAGES;

/**
 * Get the dashboard component for a given role
 * @param roleName - The role name
 * @returns The React component for that role's dashboard
 */
export function getDashboardForRole(roleName: string) {
  return ROLE_PAGES[roleName as RoleName] || ROLE_PAGES.user;
}

/**
 * Check if a role has access to a specific page
 * @param userRole - The user's role
 * @param targetRole - The role required for the page
 * @returns true if user can access the page
 */
export function canAccessPage(userRole: string, targetRole: string): boolean {
  // Super admin can access everything
  if (userRole === 'super-admin') {
    return true;
  }
  
  // Users can only access their own role's page
  return userRole === targetRole;
}

/**
 * Get all pages accessible by a role
 * @param roleName - The role name
 * @returns Array of accessible page names
 */
export function getAccessiblePages(roleName: string): string[] {
  if (roleName === 'super-admin') {
    return Object.keys(ROLE_PAGES);
  }
  
  return [roleName];
}
