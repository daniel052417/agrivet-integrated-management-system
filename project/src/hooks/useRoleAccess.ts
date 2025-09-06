import { useMemo } from 'react';
import { UserProfile, UserRole } from '../lib/supabase';

export interface RolePermissions {
  canViewMarketing: boolean;
  canCreateCampaigns: boolean;
  canEditCampaigns: boolean;
  canDeleteCampaigns: boolean;
  canPublishCampaigns: boolean;
  canManageTemplates: boolean;
  canViewAnalytics: boolean;
  canManageAnnouncements: boolean;
  canManagePromotions: boolean;
  canManageLoyalty: boolean;
  canManageNotifications: boolean;
  canManageReferrals: boolean;
}

export const useRoleAccess = (user: UserProfile | null): RolePermissions => {
  return useMemo(() => {
    if (!user) {
      return {
        canViewMarketing: false,
        canCreateCampaigns: false,
        canEditCampaigns: false,
        canDeleteCampaigns: false,
        canPublishCampaigns: false,
        canManageTemplates: false,
        canViewAnalytics: false,
        canManageAnnouncements: false,
        canManagePromotions: false,
        canManageLoyalty: false,
        canManageNotifications: false,
        canManageReferrals: false,
      };
    }

    const role = user.role.toLowerCase() as UserRole;
    
    // Admin has full access to everything
    if (role === 'admin') {
      return {
        canViewMarketing: true,
        canCreateCampaigns: true,
        canEditCampaigns: true,
        canDeleteCampaigns: true,
        canPublishCampaigns: true,
        canManageTemplates: true,
        canViewAnalytics: true,
        canManageAnnouncements: true,
        canManagePromotions: true,
        canManageLoyalty: true,
        canManageNotifications: true,
        canManageReferrals: true,
      };
    }

    // Marketing role has full marketing access
    if (role === 'marketing') {
      return {
        canViewMarketing: true,
        canCreateCampaigns: true,
        canEditCampaigns: true,
        canDeleteCampaigns: true,
        canPublishCampaigns: true,
        canManageTemplates: true,
        canViewAnalytics: true,
        canManageAnnouncements: true,
        canManagePromotions: true,
        canManageLoyalty: true,
        canManageNotifications: true,
        canManageReferrals: true,
      };
    }

    // HR role has limited marketing access (view only)
    if (role === 'hr') {
      return {
        canViewMarketing: true,
        canCreateCampaigns: false,
        canEditCampaigns: false,
        canDeleteCampaigns: false,
        canPublishCampaigns: false,
        canManageTemplates: false,
        canViewAnalytics: true,
        canManageAnnouncements: false,
        canManagePromotions: false,
        canManageLoyalty: false,
        canManageNotifications: false,
        canManageReferrals: false,
      };
    }

    // Cashier and other roles have no marketing access
    return {
      canViewMarketing: false,
      canCreateCampaigns: false,
      canEditCampaigns: false,
      canDeleteCampaigns: false,
      canPublishCampaigns: false,
      canManageTemplates: false,
      canViewAnalytics: false,
      canManageAnnouncements: false,
      canManagePromotions: false,
      canManageLoyalty: false,
      canManageNotifications: false,
      canManageReferrals: false,
    };
  }, [user]);
};

export default useRoleAccess;
