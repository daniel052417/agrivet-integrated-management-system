# Role Level Column Usage Analysis

## Summary
Found **9 files** with **15 specific locations** where the `level` column from the `roles` table is being used. Most usage is for role hierarchy logic and database ordering.

## Files and Line Numbers with Level Usage

### 1. **`project/src/lib/permissionService.ts`**
- **Line 165**: `.order('level', { ascending: true })` - Database query ordering roles by level
- **Line 21**: `level: number;` - Type definition
- **Line 140**: `level,` - Database field selection
- **Line 271**: `level: number;` - Type definition

### 2. **`project/src/permissions/PermissionContext.tsx`**
- **Line 57**: `const getRoleLevel = (role: string): number => {` - Helper function
- **Line 68**: `return levelMap[role] || 5;` - Returns hardcoded level values
- **Line 105**: `level: getRoleLevel(user.role_name),` - Creates role object with level
- **Line 145**: `level: dbRole.level,` - Uses database level value
- **Line 246**: `level: roleData.level || 10` - Default level for new roles

### 3. **`project/src/roles/super-admin/components/PermissionManager.tsx`**
- **Line 39**: `level: 10` - Default level in state
- **Line 68**: `level: newRole.level,` - Passes level to createCustomRole
- **Line 318**: `value={newRole.level}` - Form input for level
- **Line 319**: `level: parseInt(e.target.value)` - Updates level from form

### 4. **`project/src/lib/validation.ts`**
- **Line 320**: `const userLevel = roleHierarchy[userRole.toLowerCase()]` - Gets user level
- **Line 321**: `const targetLevel = targetRole ? roleHierarchy[targetRole.toLowerCase()]` - Gets target level
- **Line 333**: `return userLevel > targetLevel;` - Level comparison for permissions
- **Line 335**: `return userLevel >= targetLevel;` - Level comparison for view permissions

### 5. **`project/src/types/permissions.ts`**
- **Line 25**: `level: number; // 1 = highest (super-admin), higher numbers = lower access` - Interface definition

### 6. **`project/src/lib/supabase.ts`**
- **Line 54**: `level: number;` - Database type definition

## Current Usage Patterns

### 1. **Database Ordering** (Can be removed)
```typescript
// project/src/lib/permissionService.ts:165
.order('level', { ascending: true })
```

### 2. **Role Hierarchy Logic** (Needs decision)
```typescript
// project/src/lib/validation.ts:320-335
const userLevel = roleHierarchy[userRole.toLowerCase()] || 0;
const targetLevel = targetRole ? roleHierarchy[targetRole.toLowerCase()] || 0 : 0;
// Used for permission checks
```

### 3. **Hardcoded Level Mapping** (Can be removed)
```typescript
// project/src/permissions/PermissionContext.tsx:57-68
const getRoleLevel = (role: string): number => {
  const levelMap: { [key: string]: number } = {
    'super-admin': 1,
    'hr-admin': 2,
    // ... etc
  };
  return levelMap[role] || 5;
};
```

### 4. **Role Creation UI** (Can be removed)
```typescript
// project/src/roles/super-admin/components/PermissionManager.tsx:314-323
<label>Level (1 = highest access)</label>
<input type="number" value={newRole.level} />
```

## Suggested Changes

### 1. **Remove Database Ordering** ✅ Safe to remove
```typescript
// BEFORE
.order('level', { ascending: true })

// AFTER
.order('name', { ascending: true }) // or remove ordering entirely
```

### 2. **Remove Level from Type Definitions** ✅ Safe to remove
```typescript
// Remove from interfaces:
export interface Role {
  // ... other fields
  // level: number; // REMOVE THIS
}

// Remove from database types:
roles: {
  Row: {
    // ... other fields
    // level: number; // REMOVE THIS
  };
};
```

### 3. **Replace Role Hierarchy Logic** ⚠️ **NEEDS DECISION**
The validation logic in `project/src/lib/validation.ts` uses level-based hierarchy for permission checks. You need to decide:

**Option A: Remove hierarchy entirely**
```typescript
// Replace level-based logic with role name checks
const canManageUser = (userRole: string, targetRole: string, action: string): boolean => {
  // Use role names directly
  if (userRole === 'super-admin') return true;
  if (userRole === 'hr-admin' && ['hr-staff', 'user'].includes(targetRole)) return true;
  // ... etc
};
```

**Option B: Keep hierarchy but use role names**
```typescript
const roleHierarchy = {
  'super-admin': 1,
  'hr-admin': 2,
  'marketing-admin': 2,
  'hr-staff': 3,
  'marketing-staff': 3,
  'cashier': 4,
  'inventory-clerk': 4,
  'user': 5
};
// Keep the same logic but use hardcoded mapping instead of database level
```

### 4. **Remove Level from Role Creation** ✅ Safe to remove
```typescript
// Remove level field from PermissionManager.tsx
const [newRole, setNewRole] = useState({
  name: '',
  displayName: '',
  description: ''
  // level: 10 // REMOVE THIS
});

// Remove level input from form
// Remove level parameter from createCustomRole calls
```

### 5. **Update PermissionContext** ✅ Safe to remove
```typescript
// Remove getRoleLevel function entirely
// Remove level from role object creation
const role: Role = {
  id: user.role_id,
  name: user.role_name,
  displayName: user.role_display_name || user.role_name,
  description: user.role_description || `Role for ${user.role_name}`,
  // level: getRoleLevel(user.role_name), // REMOVE THIS
  isCustom: !user.role_is_system_role,
  permissions: DEFAULT_ROLE_PERMISSIONS[user.role_name as SystemRole] || [],
  componentAccess: [],
  createdAt: user.created_at,
  updatedAt: user.updated_at
};
```

## Critical Decision Points

### 1. **Role Hierarchy Logic** ⚠️ **MOST IMPORTANT**
The `project/src/lib/validation.ts` file uses level-based hierarchy for permission checks. This is the **only place where level is actually needed for business logic**.

**Current logic:**
- Super-admin (level 1) can manage everyone
- HR-admin (level 2) can manage HR-staff (level 3) and users (level 5)
- etc.

**You need to decide:**
1. **Keep hierarchy**: Replace database level with hardcoded role hierarchy
2. **Remove hierarchy**: Use explicit role name checks instead
3. **Keep level column**: If you want to maintain dynamic role hierarchy

### 2. **Database Migration**
If you remove the level column, you'll need a database migration:
```sql
ALTER TABLE roles DROP COLUMN level;
```

## Recommended Approach

1. **Keep role hierarchy logic** but use hardcoded mapping instead of database level
2. **Remove level column** from database
3. **Update all other usages** to remove level references
4. **Test permission system** thoroughly after changes

This approach maintains the existing permission logic while removing the database dependency on the level column.
