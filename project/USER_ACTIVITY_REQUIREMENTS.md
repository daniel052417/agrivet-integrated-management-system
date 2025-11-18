# UserActivity.tsx - Full Functionality Requirements

## Overview
The `UserActivity.tsx` component displays user activity logs and active sessions. To be fully functional, it requires database tables, activity logging throughout the application, and some missing features to be implemented.

---

## ✅ What Already Works

1. **Component Structure**: The UI is complete with tabs, filters, and tables
2. **Data Fetching**: Queries `user_activity` and `user_sessions` tables
3. **Fallback Handling**: Falls back to mock data if database queries fail
4. **Session Termination**: Can terminate active sessions
5. **Event Details Modal**: Shows detailed event information

---

## ❌ What's Missing / Needs Implementation

### 1. Database Tables

#### `user_activity` Table
**Status**: ✅ Table exists, but needs verification of schema compatibility

**Required Columns**:
```sql
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL,  -- Maps to 'action' field
  description TEXT,                      -- Maps to 'details' field
  page_url VARCHAR(500),                 -- Used to infer 'module'
  metadata JSONB,                        -- Can store module, action, etc.
  ip_address INET,                       -- Maps to 'ip' field
  user_agent TEXT,                       -- Parsed to extract 'device'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_activity_type ON user_activity(activity_type);
```

**Foreign Key Relationships**:
- `user_id` → `users(id)` (with join to get user details and branch)
- `session_id` → `user_sessions(id)` (optional)

#### `user_sessions` Table
**Status**: ✅ Table exists, but needs verification of schema compatibility

**Required Columns**:
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,              -- Preferred source for device info
  location_info JSONB,            -- Preferred source for location
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'away', 'inactive'
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity DESC);
```

**Foreign Key Relationships**:
- `user_id` → `users(id)` (with join to get user email, name)

#### `users` Table (Referenced)
**Required Columns**:
- `id`, `email`, `first_name`, `last_name`, `role`, `branch_id`

#### `branches` Table (Referenced)
**Required Columns**:
- `id`, `name`

---

### 2. Activity Logging Service

**Status**: ❌ Not implemented

You need to create an activity logging service that records user actions throughout the application.

**Create**: `project/src/lib/activityLogger.ts`

```typescript
import { supabase } from './supabase';
import { customAuth } from './customAuth';

interface LogActivityParams {
  activityType: string;  // e.g., 'login_success', 'create', 'update', 'delete'
  description?: string;
  module?: string;       // 'Dashboard', 'Inventory', 'Sales', etc.
  metadata?: Record<string, any>;
  pageUrl?: string;
}

export const activityLogger = {
  async logActivity(params: LogActivityParams): Promise<void> {
    try {
      const user = customAuth.getCurrentUser();
      if (!user) return;

      // Get current session
      const session = customAuth.getCurrentSession();
      const sessionId = session?.id || null;

      // Get IP address and user agent from browser
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const userAgent = navigator.userAgent;

      // Insert activity record
      await supabase.from('user_activity').insert({
        user_id: user.id,
        session_id: sessionId,
        activity_type: params.activityType,
        description: params.description,
        page_url: params.pageUrl || window.location.pathname,
        metadata: {
          module: params.module,
          ...params.metadata
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging should not break the app
    }
  }
};
```

**Usage Examples**:
```typescript
// In login handler
await activityLogger.logActivity({
  activityType: 'login_success',
  description: 'User logged in successfully',
  module: 'Authentication'
});

// In product creation
await activityLogger.logActivity({
  activityType: 'create',
  description: `Created product: ${productName}`,
  module: 'Inventory',
  metadata: { productId: newProduct.id }
});

// In product update
await activityLogger.logActivity({
  activityType: 'update',
  description: `Updated product: ${productName}`,
  module: 'Inventory',
  metadata: { productId: productId, changes: {...} }
});
```

---

### 3. Session Tracking

**Status**: ⚠️ Partially implemented (sessions are created in `customAuth.ts`)

**What's Working**:
- Sessions are created when users log in (in `customAuth.ts`)
- Sessions are updated on logout

**What's Missing**:
- Automatic `last_activity` updates during user interaction
- Location detection (optional, can use IP geolocation service)
- Device info parsing and storage

**Enhancement Needed**: Update `customAuth.ts` to:
1. Periodically update `last_activity` timestamp
2. Store device info in `device_info` JSONB field
3. Optionally store location info in `location_info` JSONB field

---

### 4. Export Functionality

**Status**: ❌ Not implemented

The "Export" button (line 649-652) currently does nothing.

**Implementation Needed**:
```typescript
const handleExport = async () => {
  try {
    // Convert filtered events to CSV
    const csv = convertToCSV(filteredEvents);
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data');
  }
};

const convertToCSV = (events: ActivityEvent[]): string => {
  const headers = ['Time', 'User', 'Email', 'Role', 'Branch', 'Module', 'Action', 'Details', 'IP', 'Device'];
  const rows = events.map(event => [
    new Date(event.timestamp).toLocaleString(),
    event.user,
    event.email,
    event.role,
    event.branch,
    event.module,
    event.action,
    event.details || '',
    event.ip || '',
    event.device || ''
  ]);
  
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};
```

---

### 5. Session View Modal

**Status**: ⚠️ Partially implemented

Currently, clicking "View" on a session shows an alert (line 385). Should show a proper modal like the event details modal.

**Implementation Needed**: Create a session details modal similar to the event details modal (lines 855-917).

---

### 6. Database RLS Policies

**Status**: ⚠️ Needs verification

Ensure Row Level Security (RLS) policies allow:
- Authenticated users to READ `user_activity` and `user_sessions`
- System/service role to INSERT into `user_activity`
- Users to UPDATE their own sessions in `user_sessions`

**Example Policies**:
```sql
-- Allow authenticated users to read activity logs
CREATE POLICY "Users can read user_activity"
ON user_activity FOR SELECT
TO authenticated
USING (true);

-- Allow service role to insert activity logs
CREATE POLICY "Service can insert user_activity"
ON user_activity FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow users to update their own sessions
CREATE POLICY "Users can update own sessions"
ON user_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
```

---

### 7. Location Detection (Optional Enhancement)

**Status**: ❌ Not implemented

Currently, location is extracted from `location_info` JSONB field, but this field is likely empty.

**Optional Implementation**: Use an IP geolocation service to populate location:
```typescript
const getLocationFromIP = async (ip: string): Promise<{city?: string, region?: string, country?: string}> => {
  try {
    // Using a free service like ipapi.co
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      city: data.city,
      region: data.region,
      country: data.country_name
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {};
  }
};
```

---

## 📋 Implementation Checklist

### Database Setup
- [ ] Verify `user_activity` table exists with correct schema
- [ ] Verify `user_sessions` table exists with correct schema
- [ ] Verify foreign key relationships are set up correctly
- [ ] Create/verify indexes for performance
- [ ] Set up RLS policies for security

### Activity Logging
- [ ] Create `activityLogger.ts` service
- [ ] Integrate activity logging in authentication (login/logout)
- [ ] Integrate activity logging in CRUD operations (create, update, delete)
- [ ] Integrate activity logging in view actions (optional)
- [ ] Test activity logging works correctly

### Session Tracking
- [ ] Verify sessions are created on login
- [ ] Implement periodic `last_activity` updates
- [ ] Store device info in `device_info` JSONB field
- [ ] Optionally implement location detection

### UI Features
- [ ] Implement Export functionality (CSV/Excel)
- [ ] Create session details modal (replace alert)
- [ ] Add loading states for better UX
- [ ] Add error handling for failed operations

### Testing
- [ ] Test activity log displays correctly
- [ ] Test session list displays correctly
- [ ] Test filters work correctly
- [ ] Test session termination works
- [ ] Test export functionality
- [ ] Test with empty database (no data)
- [ ] Test with large datasets (performance)

---

## 🚀 Quick Start Implementation

1. **Create Activity Logger Service**:
   ```bash
   # Create the file
   touch project/src/lib/activityLogger.ts
   ```
   Then implement the service as shown above.

2. **Add Activity Logging to Key Actions**:
   - Login: `activityLogger.logActivity({ activityType: 'login_success', module: 'Authentication' })`
   - Logout: `activityLogger.logActivity({ activityType: 'logout', module: 'Authentication' })`
   - Create Product: `activityLogger.logActivity({ activityType: 'create', module: 'Inventory', description: 'Created product: ...' })`
   - Update Product: `activityLogger.logActivity({ activityType: 'update', module: 'Inventory', description: 'Updated product: ...' })`
   - Delete Product: `activityLogger.logActivity({ activityType: 'delete', module: 'Inventory', description: 'Deleted product: ...' })`

3. **Implement Export Function**:
   Add the `handleExport` function to `UserActivity.tsx` and connect it to the Export button.

4. **Create Session Details Modal**:
   Create a modal component similar to the event details modal for viewing session information.

---

## 📊 Expected Data Flow

1. **User Action** → Activity Logger → `user_activity` table
2. **User Login** → `customAuth.ts` → `user_sessions` table
3. **User Activity** → Periodic update → `user_sessions.last_activity`
4. **Component Load** → Query `user_activity` and `user_sessions` → Display in UI

---

## 🔍 Verification Steps

1. **Check Database**:
   ```sql
   SELECT COUNT(*) FROM user_activity;
   SELECT COUNT(*) FROM user_sessions WHERE is_active = true;
   ```

2. **Check Activity Logging**:
   - Perform some actions (login, create product, etc.)
   - Check `user_activity` table has new records
   - Verify `UserActivity.tsx` displays the new records

3. **Check Session Tracking**:
   - Log in as a user
   - Check `user_sessions` table has a new record
   - Verify `UserActivity.tsx` shows the active session

---

## 📝 Notes

- Activity logging should be **non-blocking** - errors should not break the application
- Consider **rate limiting** for activity logging to avoid database overload
- For production, consider **archiving old activity logs** to maintain performance
- Location detection may require API keys for production use
- Export functionality can be extended to support PDF, Excel, or JSON formats



