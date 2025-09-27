# Permission System Setup Guide

This guide will help you set up the comprehensive role-based permission system for the Agrivet Integrated Management System.

## Overview

The permission system provides:
- **Role-based access control (RBAC)** with hierarchical permissions
- **Dynamic component loading** based on user permissions
- **Database-driven permissions** with real-time updates
- **Three permission categories**: sensitive, upgradeable, and standard
- **Comprehensive audit trail** for all permission changes

## Database Schema

The system uses the following main tables:
- `roles` - System and custom roles
- `permissions` - Individual permissions
- `role_permissions` - Junction table linking roles to permissions
- `user_roles` - User role assignments
- `component_access` - Component access definitions

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2. Run the Migration

Execute the permission system migration:

```bash
npm run setup-permissions
```

This will:
- Create all necessary tables
- Insert system roles and permissions
- Set up component access definitions
- Configure RLS policies
- Run basic tests

### 3. Verify Setup

After running the migration, you can test the system by:

1. Starting the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin permission test page (if you have admin access)

3. Check the browser console for any permission-related errors

## System Roles

The system comes with these predefined roles:

| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| `super-admin` | 1 | Full system access | All permissions |
| `hr-admin` | 2 | HR department admin | HR management, payroll |
| `marketing-admin` | 2 | Marketing department admin | Campaign management, analytics |
| `manager` | 3 | Department/branch manager | Sales, inventory, reports |
| `hr-staff` | 4 | HR staff member | Attendance, leave management |
| `marketing-staff` | 4 | Marketing staff | Campaign creation, templates |
| `cashier` | 5 | Point of sale staff | POS, sales transactions |
| `inventory-clerk` | 5 | Inventory management | Stock management, alerts |
| `user` | 10 | Basic user | Minimal access |

## Permission Categories

### Sensitive
- Completely hidden if user lacks permission
- Examples: Payroll management, user administration, financial reports

### Upgradeable
- Visible but disabled with upgrade message
- Examples: Advanced analytics, premium features

### Standard
- Normal permission-based access
- Examples: Basic inventory management, sales transactions

## Component Access

Components are dynamically loaded based on:
- User's assigned roles
- Required permissions
- Component category (sensitive/upgradeable/standard)

## Database Functions

The system provides several PostgreSQL functions:

- `get_user_permissions(user_uuid)` - Get all permissions for a user
- `get_user_accessible_components(user_uuid)` - Get accessible components
- `user_has_permission(user_uuid, permission_name)` - Check specific permission
- `user_can_access_component(user_uuid, component_path)` - Check component access

## Usage in Components

### Using PermissionContext

```tsx
import { usePermissions } from '../permissions/PermissionContext';

function MyComponent() {
  const { hasPermission, canAccessComponent, currentRole } = usePermissions();
  
  if (!hasPermission('inventory.view')) {
    return <div>Access denied</div>;
  }
  
  return <div>Inventory content</div>;
}
```

### Using ComponentGuard

```tsx
import { ComponentGuard } from '../permissions/ComponentGuard';

function MyPage() {
  return (
    <ComponentGuard component="inventory/management">
      <InventoryManagement />
    </ComponentGuard>
  );
}
```

### Using PermissionService

```tsx
import { PermissionService } from '../lib/permissionService';

// Check if user has permission
const hasAccess = await PermissionService.userHasPermission(userId, 'inventory.view');

// Get user's accessible components
const components = await PermissionService.getUserAccessibleComponents(userId);
```

## Customization

### Adding New Permissions

1. Add permission to database:
   ```sql
   INSERT INTO permissions (name, description, resource, action, component, category, is_system)
   VALUES ('new.permission', 'New Permission', 'resource', 'action', 'component/path', 'standard', true);
   ```

2. Assign to roles:
   ```sql
   INSERT INTO role_permissions (role_id, permission_id, is_granted)
   SELECT r.role_id, p.id, true
   FROM roles r, permissions p
   WHERE r.role_name = 'role_name' AND p.name = 'new.permission';
   ```

### Adding New Components

1. Add component access definition:
   ```sql
   INSERT INTO component_access (component_path, display_name, description, category, required_permission, required_role)
   VALUES ('new/component', 'New Component', 'Description', 'standard', 'new.permission', 'role_name');
   ```

2. Add to component registry in `src/utils/componentRegistry.tsx`

### Creating Custom Roles

Use the PermissionContext methods:
```tsx
const { createCustomRole, updateRolePermissions } = usePermissions();

// Create custom role
await createCustomRole({
  name: 'custom-role',
  displayName: 'Custom Role',
  description: 'Custom role description',
  level: 5
});

// Update role permissions
await updateRolePermissions(roleId, permissionIds);
```

## Troubleshooting

### Common Issues

1. **Permission not working**: Check if user has the correct role assigned
2. **Component not loading**: Verify component is in the registry and user has access
3. **Database errors**: Ensure migration ran successfully and RLS policies are correct

### Debug Tools

- Use the PermissionTest component to debug permission issues
- Check browser console for permission-related errors
- Use Supabase dashboard to verify user roles and permissions

### Logs

Check the browser console and Supabase logs for:
- Permission loading errors
- Component access failures
- Database query errors

## Security Considerations

- All database operations use RLS (Row Level Security)
- Sensitive permissions are properly protected
- User roles are validated on every request
- Component access is checked before rendering

## Performance

- Permissions are cached in the PermissionContext
- Database queries are optimized with proper indexes
- Components are lazy-loaded to reduce bundle size
- Permission checks are memoized where possible

## Next Steps

After setup:
1. Create user accounts
2. Assign appropriate roles to users
3. Test the permission system with different user types
4. Customize permissions based on your business needs
5. Add additional components as needed

For more information, see the component documentation and database schema files.








