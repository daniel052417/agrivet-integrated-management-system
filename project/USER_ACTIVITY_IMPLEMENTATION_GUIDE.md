# UserActivity Component Implementation Guide

## ✅ Component Updated

The `UserActivity.tsx` component has been updated to work with your actual database schema. It now queries real data instead of using mock data.

## 📋 Database Tables Used

### 1. `user_activity` Table
```sql
- id (uuid)
- user_id (uuid) → references users(id)
- session_id (uuid) → references user_sessions(id)
- activity_type (varchar) → Maps to action
- description (text) → Maps to details
- page_url (varchar) → Used to infer module
- metadata (jsonb) → Can store additional info (module, action, etc.)
- ip_address (inet) → Maps to ip
- user_agent (text) → Parsed to extract device
- created_at (timestamp) → Maps to timestamp
```

### 2. `user_sessions` Table
```sql
- id (uuid)
- user_id (uuid) → references users(id)
- ip_address (inet) → Maps to ip
- user_agent (text) → Used as fallback for device
- device_info (jsonb) → Preferred source for device info
- location_info (jsonb) → Preferred source for location
- status (varchar) → 'active', 'away', 'inactive'
- last_activity (timestamp) → Maps to lastActiveAt
- created_at (timestamp) → Maps to startedAt
- is_active (boolean) → Maps to isCurrent
- expires_at (timestamp)
```

### 3. `users` Table (Referenced)
```sql
- id, email, first_name, last_name, role, branch_id
```

### 4. `branches` Table (Referenced)
```sql
- id, name
```

## 🔄 Data Mapping

### Activity Events Mapping

| Component Field | Database Source | Notes |
|----------------|----------------|--------|
| `timestamp` | `user_activity.created_at` | Direct mapping |
| `user` | `users.first_name + last_name` | Concatenated |
| `email` | `users.email` | Direct mapping |
| `role` | `users.role` | Mapped: 'admin'→'Admin', 'manager'→'Manager', else→'Staff' |
| `branch` | `branches.name` | Via user.branch_id join |
| `module` | `metadata.module` OR parsed from `page_url` | Default: 'Dashboard' |
| `action` | `activity_type` | Mapped to: login_success, login_failed, view, create, update, delete, export |
| `details` | `description` OR `metadata.details` | Uses description first, then metadata |
| `ip` | `ip_address` OR `metadata.ip` | Prefers ip_address |
| `device` | Parsed from `user_agent` | Browser + OS detected |

### Sessions Mapping

| Component Field | Database Source | Notes |
|----------------|----------------|--------|
| `email` | `users.email` | Direct mapping |
| `device` | `device_info` OR parsed from `user_agent` | Prefers device_info JSONB |
| `ip` | `ip_address` | Direct mapping |
| `location` | `location_info` (city, region, country) | Formatted as "City, Region" |
| `startedAt` | `created_at` | Direct mapping |
| `lastActiveAt` | `last_activity` OR `created_at` | Prefers last_activity |
| `isCurrent` | `is_active = true AND status = 'active'` | Both conditions |

## 📝 How to Populate Data

### Populating `user_activity` Table

#### 1. Login Events
```typescript
// On successful login
await supabase.from('user_activity').insert({
  user_id: userId,
  session_id: sessionId,
  activity_type: 'login_success',
  description: 'User logged in successfully',
  page_url: '/dashboard',
  metadata: {
    module: 'Dashboard',
    action: 'login_success'
  },
  ip_address: userIP,
  user_agent: navigator.userAgent,
  created_at: new Date().toISOString()
});

// On failed login
await supabase.from('user_activity').insert({
  user_id: userId, // or null if user doesn't exist
  activity_type: 'login_failed',
  description: 'Login failed: Invalid credentials',
  page_url: '/login',
  metadata: {
    module: 'Dashboard',
    action: 'login_failed',
    reason: 'Invalid credentials'
  },
  ip_address: userIP,
  user_agent: navigator.userAgent,
  created_at: new Date().toISOString()
});
```

#### 2. CRUD Operations
```typescript
// Example: Creating a product
await supabase.from('user_activity').insert({
  user_id: currentUser.id,
  session_id: currentSession.id,
  activity_type: 'create',
  description: `Created product: ${productName}`,
  page_url: '/inventory/products',
  metadata: {
    module: 'Inventory',
    action: 'create',
    entity_type: 'product',
    entity_id: newProduct.id,
    details: JSON.stringify({ name: productName, price: productPrice })
  },
  ip_address: userIP,
  user_agent: navigator.userAgent,
  created_at: new Date().toISOString()
});

// Example: Updating a product
await supabase.from('user_activity').insert({
  user_id: currentUser.id,
  session_id: currentSession.id,
  activity_type: 'update',
  description: `Updated product: ${productName}`,
  page_url: '/inventory/products',
  metadata: {
    module: 'Inventory',
    action: 'update',
    entity_type: 'product',
    entity_id: productId,
    old_values: oldProductData,
    new_values: newProductData
  },
  ip_address: userIP,
  user_agent: navigator.userAgent,
  created_at: new Date().toISOString()
});
```

#### 3. View Actions (Optional - can be verbose)
```typescript
// Only log important views, not every page load
await supabase.from('user_activity').insert({
  user_id: currentUser.id,
  session_id: currentSession.id,
  activity_type: 'view',
  description: 'Viewed sales report',
  page_url: '/reports/sales',
  metadata: {
    module: 'Reports',
    action: 'view',
    entity_type: 'report',
    entity_id: reportId
  },
  ip_address: userIP,
  user_agent: navigator.userAgent,
  created_at: new Date().toISOString()
});
```

#### 4. Export Actions
```typescript
await supabase.from('user_activity').insert({
  user_id: currentUser.id,
  session_id: currentSession.id,
  activity_type: 'export',
  description: `Exported ${reportType} report`,
  page_url: '/reports/export',
  metadata: {
    module: 'Reports',
    action: 'export',
    entity_type: 'report',
    format: 'csv', // or 'pdf', 'excel'
    record_count: 150
  },
  ip_address: userIP,
  user_agent: navigator.userAgent,
  created_at: new Date().toISOString()
});
```

### Populating `user_sessions` Table

#### 1. On Login - Create Session
```typescript
const { data: session, error } = await supabase
  .from('user_sessions')
  .insert({
    user_id: user.id,
    session_token: generateSessionToken(),
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    device_info: {
      device: detectDevice(),
      browser: detectBrowser(),
      os: detectOS()
    },
    location_info: await getLocationFromIP(getClientIP()), // Optional
    status: 'active',
    is_active: true,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString()
  })
  .select()
  .single();
```

#### 2. On Activity - Update Session
```typescript
// Update last_activity timestamp on user actions
await supabase
  .from('user_sessions')
  .update({
    last_activity: new Date().toISOString(),
    current_page: window.location.pathname,
    updated_at: new Date().toISOString()
  })
  .eq('id', sessionId)
  .eq('is_active', true);
```

#### 3. On Logout - Terminate Session
```typescript
await supabase
  .from('user_sessions')
  .update({
    is_active: false,
    status: 'inactive',
    updated_at: new Date().toISOString()
  })
  .eq('id', sessionId);
```

#### 4. Cleanup Expired Sessions (Cron Job)
```sql
-- Run this periodically to clean up expired sessions
UPDATE user_sessions
SET is_active = false, status = 'inactive'
WHERE expires_at < NOW() AND is_active = true;
```

## 🎯 Activity Type Values

The component maps these `activity_type` values to actions:

| activity_type Pattern | Mapped Action |
|----------------------|---------------|
| `login_success`, `login-success` | `login_success` |
| `login_failed`, `login-failed` | `login_failed` |
| `create`, `created` | `create` |
| `update`, `updated` | `update` |
| `delete`, `deleted` | `delete` |
| `export`, `exported` | `export` |
| `view`, `viewed` | `view` |
| (default) | `view` |

## 📦 Recommended Metadata Structure

For best results, store metadata in JSONB format:

```typescript
{
  module: 'Inventory' | 'Sales' | 'Reports' | 'Dashboard' | 'Staff' | 'Marketing' | 'Settings',
  action: 'create' | 'update' | 'delete' | 'view' | 'export',
  entity_type: 'product' | 'customer' | 'order' | 'report' | etc.,
  entity_id: 'uuid-string',
  details: 'Human readable description',
  old_values: { /* previous state for updates */ },
  new_values: { /* new state for updates */ }
}
```

## 🔧 Helper Functions to Create

You may want to create utility functions:

```typescript
// utils/activityLogger.ts
export const logActivity = async (
  activityType: string,
  description: string,
  metadata?: Record<string, any>
) => {
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();
  
  return await supabase.from('user_activity').insert({
    user_id: currentUser?.id,
    session_id: currentSession?.id,
    activity_type: activityType,
    description,
    page_url: window.location.pathname,
    metadata: metadata || {},
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent,
    created_at: new Date().toISOString()
  });
};
```

## ✅ Testing

1. **Test Activity Logging:**
   - Perform various actions (login, create, update, delete)
   - Check that events appear in the Activity Log tab
   - Verify filters work correctly

2. **Test Sessions:**
   - Log in as different users
   - Check that sessions appear in Active Sessions tab
   - Test terminating a session
   - Verify session details are correct

3. **Test Data Transformation:**
   - Verify module detection from page_url
   - Verify action mapping from activity_type
   - Verify device/OS detection from user_agent

## 🐛 Troubleshooting

### No data showing?
- Check that `user_activity` and `user_sessions` tables have data
- Check Supabase RLS policies allow reads
- Check browser console for errors

### Incorrect module/action mapping?
- Review the mapping logic in `loadActivityData()`
- Ensure `activity_type` values match expected patterns
- Check `metadata.module` is set correctly

### Sessions not showing?
- Ensure `is_active = true` in `user_sessions`
- Check `status = 'active'` condition
- Verify user join is working

### Device/location not showing?
- Ensure `device_info` and `location_info` JSONB fields are populated
- Component falls back to parsing `user_agent` if JSONB is empty
- Location requires third-party IP geolocation service integration

