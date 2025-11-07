# Database Tables Required for UserActivity.tsx

## Overview
The `UserActivity.tsx` component requires **2 main tables** to be fully functional:

## 1. `user_activity` Table (Activity Log Tab)

### Purpose
Tracks all user activity events across different modules of the system.

### Required Schema
```sql
CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,              -- Full name of the user
    "role" TEXT,                    -- User's role (Admin, Manager, Staff)
    "branch" TEXT,                  -- Branch name where activity occurred
    "module" TEXT,                  -- Module name (Dashboard, Inventory, Sales, etc.)
    "action" TEXT NOT NULL,          -- Action type (login_success, login_failed, view, create, update, delete, export)
    "details" TEXT,                 -- Additional details about the action
    "ip" TEXT,                      -- IP address
    "device" TEXT,                  -- Device/browser information
    "old_values" JSONB,             -- Previous state (for update/delete actions)
    "new_values" JSONB,             -- New state (for create/update actions)
    "user_agent" TEXT,              -- Full user agent string
    "entity_id" TEXT,               -- ID of affected entity
    "entity_type" TEXT,            -- Type of affected entity
    
    -- Constraints
    CONSTRAINT "user_activity_action_check" 
        CHECK (action IN ('login_success', 'login_failed', 'view', 'create', 'update', 'delete', 'export')),
    CONSTRAINT "user_activity_module_check" 
        CHECK (module IN ('Dashboard', 'Inventory', 'Sales', 'Reports', 'Staff', 'Marketing', 'Settings'))
);

-- Recommended Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_email ON user_activity(user_email);
CREATE INDEX IF NOT EXISTS idx_user_activity_module ON user_activity(module);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
```

### Field Mapping to Component
- `created_at` → `timestamp`
- `user_name` → `user`
- `user_email` → `email`
- `role` → `role`
- `branch` → `branch`
- `module` → `module`
- `action` → `action`
- `details` → `details`
- `ip` → `ip`
- `device` → `device`

### Status
✅ **Table exists** in `database-schema.txt` (lines 2133-2152)

---

## 2. `user_sessions` Table (Active Sessions Tab)

### Purpose
Tracks active user sessions for security and monitoring purposes.

### Required Schema
```sql
CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "device" TEXT,                  -- Device/browser information
    "ip" TEXT,                      -- IP address
    "location" TEXT,                -- Geographic location (optional, can be derived from IP)
    "started_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "last_active_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "is_current" BOOLEAN DEFAULT false NOT NULL,
    
    -- Optional: Link to users table if you want to use user_id instead of email
    "user_id" UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Recommended Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_email ON user_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_current ON user_sessions(is_current);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active_at ON user_sessions(last_active_at DESC);
```

### Field Mapping to Component
- `id` → `id`
- `user_email` → `email`
- `device` → `device`
- `ip` → `ip`
- `location` → `location`
- `started_at` → `startedAt`
- `last_active_at` → `lastActiveAt`
- `is_current` → `isCurrent`

### Status
✅ **Table exists** in `database-schema.txt` (lines 2169-2178)

---

## Optional: Supporting Tables

### `users` Table (Reference)
If you want to enhance the component to show more user details or link sessions to user accounts:
- Should have fields: `id`, `email`, `first_name`, `last_name`, `role`, `branch_id`
- Used for joining/lookup purposes

### `branches` Table (Reference)
If you want to get branch names dynamically instead of storing them as text:
- Should have fields: `id`, `name`
- Used for joining branch information

---

## Implementation Notes

### Current State
- Both tables **already exist** in your database schema
- The component is currently using **mock data** (MOCK_EVENTS and MOCK_SESSIONS)
- The commented code on lines 161-167 shows the intended query structure

### To Make Fully Functional

1. **Update `loadActivityData()` function** (around line 151):
   ```typescript
   // Replace mock data with real query
   const { data: eventsData, error: eventsError } = await supabase
     .from('user_activity')
     .select('*')
     .order('created_at', { ascending: false })
     .limit(1000); // Or paginate
   
   if (eventsError) throw eventsError;
   
   // Transform to ActivityEvent format
   const transformedEvents: ActivityEvent[] = eventsData?.map(event => ({
     id: event.id,
     timestamp: event.created_at,
     user: event.user_name || 'Unknown',
     email: event.user_email,
     role: event.role || 'Staff',
     branch: event.branch || 'Unknown Branch',
     module: event.module || 'Dashboard',
     action: event.action,
     details: event.details,
     ip: event.ip,
     device: event.device
   })) || [];
   
   setEvents(transformedEvents);
   ```

2. **Update sessions loading**:
   ```typescript
   const { data: sessionsData, error: sessionsError } = await supabase
     .from('user_sessions')
     .select('*')
     .order('last_active_at', { ascending: false });
   
   if (sessionsError) throw sessionsError;
   
   const transformedSessions: SessionItem[] = sessionsData?.map(session => ({
     id: session.id,
     email: session.user_email,
     device: session.device || 'Unknown',
     ip: session.ip || 'Unknown',
     location: session.location,
     startedAt: session.started_at,
     lastActiveAt: session.last_active_at,
     isCurrent: session.is_current || false
   })) || [];
   
   setSessions(transformedSessions);
   ```

3. **Add session termination functionality** (line 193):
   ```typescript
   case 'terminate':
     const { error: terminateError } = await supabase
       .from('user_sessions')
       .update({ 
         is_current: false,
         status: 'inactive'  // If you add a status field
       })
       .eq('id', sessionId);
     
     if (terminateError) throw terminateError;
     await loadActivityData(); // Reload to refresh
     break;
   ```

---

## Data Population Strategy

### For `user_activity` Table
You'll need to implement logging throughout your application:
- **On login**: Insert login_success/login_failed records
- **On CRUD operations**: Insert create/update/delete records with entity details
- **On exports**: Insert export records
- **On page views**: Optionally insert view records (might be too verbose)

### For `user_sessions` Table
You'll need to track sessions:
- **On login**: Create new session record with current timestamp
- **On activity**: Update `last_active_at` timestamp
- **On logout**: Mark session as inactive (`is_current = false`)
- **On session expiry**: Run cleanup job to mark expired sessions as inactive

---

## Summary

✅ **Required Tables:**
1. `user_activity` - Already exists
2. `user_sessions` - Already exists

⚠️ **Action Required:**
- Replace mock data with real database queries
- Implement logging mechanisms throughout the app to populate `user_activity`
- Implement session tracking to populate `user_sessions`
- Update component to handle real data transformation








