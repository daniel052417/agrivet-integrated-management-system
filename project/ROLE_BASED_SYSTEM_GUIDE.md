# Role-Based Component System Guide

## 🎯 **System Overview**

This system implements a dynamic, permission-based component loading architecture where:
- **All features are reusable components** in a centralized `/components` folder
- **Super Admin has access to all features** and can manage permissions
- **Each user role has specific access** based on permissions set by Super Admin
- **Components are dynamically loaded** based on user permissions
- **Sensitive features are completely hidden**, upgradeable features show with upgrade messages

## 📁 **Folder Structure**

```
src/
├── components/                          # All reusable components
│   ├── dashboard/                      # Dashboard components
│   │   ├── AdminDashboard.tsx
│   │   ├── HRDashboard.tsx
│   │   ├── MarketingDashboard.tsx
│   │   ├── CashierDashboard.tsx
│   │   └── InventoryDashboard.tsx
│   │
│   ├── inventory/                      # Inventory management
│   ├── sales/                          # Sales components
│   ├── hr/                             # HR components
│   ├── marketing/                      # Marketing components
│   ├── pos/                            # POS components
│   ├── reports/                        # Reports components
│   ├── settings/                       # Settings components
│   └── shared/                         # Shared UI components
│
├── roles/                              # Role-specific configurations
│   ├── super-admin/                    # Super Admin role
│   │   ├── components/                 # Super Admin specific components
│   │   ├── permissions/                # Permission management
│   │   └── dashboard/                  # Super Admin dashboard
│   │
│   ├── hr-admin/                       # HR Admin role
│   ├── marketing-admin/                # Marketing Admin role
│   ├── hr-staff/                       # HR Staff role
│   ├── marketing-staff/                # Marketing Staff role
│   ├── cashier/                        # Cashier role
│   └── inventory-clerk/                # Inventory Clerk role
│
├── permissions/                        # Permission system
│   ├── PermissionContext.tsx           # React context for permissions
│   ├── ComponentGuard.tsx              # Component access guard
│   └── PermissionManager.tsx           # Super Admin permission manager
│
├── utils/                              # Utility functions
│   └── componentRegistry.ts            # Component registry for dynamic loading
│
└── types/                              # TypeScript types
    └── permissions.ts                  # Permission type definitions
```

## 🔐 **Permission System**

### **Permission Categories**

1. **Sensitive** - Completely hidden if no permission
2. **Upgradeable** - Shown but disabled with upgrade message
3. **Standard** - Normal permission-based access

### **User Roles**

- **Super Admin** - Full system access, can create custom roles
- **HR Admin** - HR management with sensitive payroll access
- **Marketing Admin** - Marketing management with analytics
- **HR Staff** - Basic HR functions, limited payroll access
- **Marketing Staff** - Basic marketing functions
- **Cashier** - POS system access
- **Inventory Clerk** - Inventory management access

### **Component Access Control**

```typescript
// Example: HR Staff trying to access payroll
<ComponentGuard
  component="hr/payroll"
  requiredResource="hr"
  requiredAction="read"
>
  <PayrollComponent />
</ComponentGuard>

// Result: Shows upgrade message if no permission
```

## 🚀 **How It Works**

### **1. Dynamic Component Loading**

```typescript
// Component registry maps paths to actual components
const componentMap = {
  'dashboard/admin': lazy(() => import('../components/dashboard/AdminDashboard')),
  'hr/payroll': lazy(() => import('../components/hr/PayrollManagement')),
  // ... more components
};

// Dynamic loading based on permissions
<ComponentRegistry componentPath="hr/payroll" />
```

### **2. Permission-Based Rendering**

```typescript
// Check if user can access component
const { canAccessComponent, isComponentEnabled } = usePermissions();

if (canAccessComponent('hr/payroll')) {
  // Show component
} else {
  // Show upgrade message or hide completely
}
```

### **3. Role-Based Dashboards**

```typescript
// Each role gets their own dashboard
switch (user.role) {
  case 'super-admin':
    return <SuperAdminDashboard />;
  case 'hr-admin':
    return <HRDashboard />;
  // ... other roles
}
```

## 🛠 **Implementation Examples**

### **Creating a New Component**

1. **Add to component registry:**
```typescript
// utils/componentRegistry.ts
const componentMap = {
  'new/feature': lazy(() => import('../components/new/NewFeature')),
  // ... existing components
};
```

2. **Define permissions:**
```typescript
// types/permissions.ts
export const DEFAULT_ROLE_PERMISSIONS = {
  'hr-admin': [
    {
      id: 'new_feature_access',
      name: 'New Feature Access',
      resource: 'new',
      action: 'read',
      component: 'new/feature',
      category: 'standard',
      isVisible: true,
      isEnabled: true
    }
  ]
};
```

3. **Use in dashboard:**
```typescript
// components/dashboard/HRDashboard.tsx
<ComponentGuard
  component="new/feature"
  requiredResource="new"
  requiredAction="read"
>
  <NewFeatureComponent />
</ComponentGuard>
```

### **Super Admin Permission Management**

```typescript
// Super Admin can create custom roles
const createCustomRole = async (roleData) => {
  const success = await createCustomRole({
    name: 'branch-manager',
    displayName: 'Branch Manager',
    description: 'Manages branch operations',
    level: 5,
    permissions: selectedPermissions
  });
};

// Update role permissions
const updatePermissions = async (roleId, permissions) => {
  const success = await updateRolePermissions(roleId, permissions);
};
```

## 🎨 **Component Categories**

### **Sensitive Components**
- **Payroll Management** - Only HR Admin can access
- **User Management** - Only Super Admin can access
- **System Settings** - Only Super Admin can access

### **Upgradeable Components**
- **Advanced Analytics** - Show with upgrade message
- **Bulk Operations** - Show with upgrade message
- **Custom Reports** - Show with upgrade message

### **Standard Components**
- **Basic Dashboard** - All roles can access
- **View Reports** - Most roles can access
- **Basic Settings** - Role-appropriate access

## 🔧 **Configuration**

### **Adding New Roles**

1. **Add to SYSTEM_ROLES:**
```typescript
export const SYSTEM_ROLES = {
  // ... existing roles
  NEW_ROLE: 'new-role'
} as const;
```

2. **Define permissions:**
```typescript
export const DEFAULT_ROLE_PERMISSIONS = {
  [SYSTEM_ROLES.NEW_ROLE]: [
    // ... permissions
  ]
};
```

3. **Create role folder:**
```
roles/new-role/
├── components/
├── permissions/
└── dashboard/
```

### **Adding New Components**

1. **Create component file:**
```typescript
// components/new/NewComponent.tsx
const NewComponent: React.FC = () => {
  return <div>New Component</div>;
};
export default NewComponent;
```

2. **Add to registry:**
```typescript
// utils/componentRegistry.ts
const componentMap = {
  'new/component': lazy(() => import('../components/new/NewComponent')),
};
```

3. **Define permissions:**
```typescript
// Add to DEFAULT_ROLE_PERMISSIONS
```

## 📊 **Benefits**

### **1. Scalability**
- Easy to add new roles and components
- Centralized component management
- Dynamic permission system

### **2. Security**
- Fine-grained permission control
- Sensitive features completely hidden
- Role-based access control

### **3. Maintainability**
- Clear separation of concerns
- Centralized component registry
- Easy to update permissions

### **4. User Experience**
- Role-appropriate interfaces
- Clear upgrade paths
- Consistent component behavior

## 🚀 **Getting Started**

### **1. Set up the system:**
```bash
# The folder structure is already created
# Components are ready to use
```

### **2. Use in your app:**
```typescript
// App.tsx
import { PermissionProvider } from './permissions/PermissionContext';
import { DynamicDashboard } from './components/DynamicDashboard';

function App() {
  return (
    <PermissionProvider user={user}>
      <DynamicDashboard />
    </PermissionProvider>
  );
}
```

### **3. Add components to dashboards:**
```typescript
// In any dashboard component
<ComponentGuard
  component="your/component"
  requiredResource="your-resource"
  requiredAction="read"
>
  <YourComponent />
</ComponentGuard>
```

## 🎯 **Next Steps**

1. **Test the system** with different user roles
2. **Add more components** to the registry
3. **Customize permissions** for your specific needs
4. **Create custom roles** as needed
5. **Implement the Super Admin interface** for permission management

This system provides a flexible, scalable foundation for role-based access control with dynamic component loading!












