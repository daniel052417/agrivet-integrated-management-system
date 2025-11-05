# Database Tables Required for SessionHistory.tsx

## Overview
The `SessionHistory.tsx` component requires **2 main tables** to be fully functional, with some additional fields that may need to be added to your existing schema.

## 1. `user_sessions` Table

### Current Schema (Based on Your Database)
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,              -- Can store device details
  location_info JSONB,            -- Can store location details
  current_page VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'away', 'inactive'
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
```

### ✅ Fields That Already Exist (Can Be Mapped)
- `id` → `sessionId`
- `user_id` → `userId`
- `created_at` → `loginTime`
- `last_activity` → `lastActivity`
- `ip_address` → `ipAddress`
- `user_agent` → `userAgent`
- `status` → Can be mapped to component status
- `is_active` → `isCurrentSession`

### ⚠️ Missing Fields (Need to Add)

#### 1. `logout_time` (TIMESTAMP WITH TIME ZONE)
```sql
ALTER TABLE user_sessions 
ADD COLUMN logout_time TIMESTAMP WITH TIME ZONE NULL;
```
- Purpose: Track when user logged out (for calculating session duration)
- Maps to: `logoutTime` in component

#### 2. `login_method` (VARCHAR(20))
```sql
ALTER TABLE user_sessions 
ADD COLUMN login_method VARCHAR(20) DEFAULT 'password',
ADD CONSTRAINT login_method_check CHECK (login_method IN ('password', 'mfa', 'sso'));
```
- Purpose: Track how user logged in (password, MFA, SSO)
- Maps to: `loginMethod` in component
- Values: 'password', 'mfa', 'sso'

#### 3. `mfa_used` (BOOLEAN)
```sql
ALTER TABLE user_sessions 
ADD COLUMN mfa_used BOOLEAN DEFAULT false;
```
- Purpose: Track if MFA was used during login
- Maps to: `mfaUsed` in component
- Note: Can be derived from `login_method = 'mfa'` but explicit field is clearer

#### 4. `risk_score` (VARCHAR(10))
```sql
ALTER TABLE user_sessions 
ADD COLUMN risk_score VARCHAR(10) DEFAULT 'low',
ADD CONSTRAINT risk_score_check CHECK (risk_score IN ('low', 'medium', 'high'));
```
- Purpose: Security risk assessment for the session
- Maps to: `riskScore` in component
- Values: 'low', 'medium', 'high'
- Can be calculated based on:
  - IP address location (unusual location = higher risk)
  - Device fingerprint (new device = higher risk)
  - Login method (MFA = lower risk)
  - Time of day (unusual hours = higher risk)

### 📋 Recommended JSONB Structure

#### `device_info` JSONB Structure
Store detailed device information:
```json
{
  "deviceType": "desktop" | "mobile" | "tablet",
  "deviceName": "MacBook Pro" | "iPhone 15 Pro" | "iPad Air",
  "browser": "Chrome 120.0" | "Safari 17.2" | "Firefox 121.0",
  "operatingSystem": "macOS 14.2" | "iOS 17.2" | "Windows 11",
  "screenResolution": "1920x1080",
  "timezone": "America/New_York"
}
```

#### `location_info` JSONB Structure
Store location information:
```json
{
  "city": "New York",
  "region": "NY",
  "country": "United States",
  "countryCode": "US",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "isp": "Verizon",
  "timezone": "America/New_York"
}
```

## 2. `users` Table

### Current Schema (You Already Have)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  -- ... other fields
);
```

### ✅ Fields Needed (Already Exist)
- `id` → `userId`
- `email` → `userEmail`
- `first_name` + `last_name` → `userName` (concatenated)
- `role` → `userRole`

## Complete Migration Script

Here's a complete migration to add missing fields:

```sql
-- Add missing columns to user_sessions
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS logout_time TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS login_method VARCHAR(20) DEFAULT 'password',
ADD COLUMN IF NOT EXISTS mfa_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS risk_score VARCHAR(10) DEFAULT 'low';

-- Add constraints
ALTER TABLE user_sessions
DROP CONSTRAINT IF EXISTS login_method_check,
ADD CONSTRAINT login_method_check CHECK (login_method IN ('password', 'mfa', 'sso'));

ALTER TABLE user_sessions
DROP CONSTRAINT IF EXISTS risk_score_check,
ADD CONSTRAINT risk_score_check CHECK (risk_score IN ('low', 'medium', 'high'));

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_user_sessions_logout_time ON user_sessions(logout_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_method ON user_sessions(login_method);
CREATE INDEX IF NOT EXISTS idx_user_sessions_risk_score ON user_sessions(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);
```

## Data Mapping

### Status Mapping

The component expects: `'active' | 'expired' | 'terminated' | 'logout'`

Your current schema has: `'active' | 'away' | 'inactive'`

**Mapping Logic:**
```typescript
function mapStatus(session: any): 'active' | 'expired' | 'terminated' | 'logout' {
  // If logout_time exists, it's a logout
  if (session.logout_time) return 'logout';
  
  // If expired (expires_at < now) and not active
  if (session.expires_at < new Date() && !session.is_active) return 'expired';
  
  // If terminated (status = 'inactive' but no logout_time)
  if (session.status === 'inactive' && !session.logout_time) return 'terminated';
  
  // Otherwise active
  if (session.status === 'active' && session.is_active) return 'active';
  
  // Default fallback
  return 'logout';
}
```

### Session Duration Calculation

```typescript
function calculateDuration(session: any): number {
  const start = new Date(session.created_at);
  const end = session.logout_time 
    ? new Date(session.logout_time) 
    : (session.last_activity || new Date());
  
  return Math.floor((end.getTime() - start.getTime()) / 60000); // minutes
}
```

## Example Query for Component

Here's how to query the data:

```typescript
const { data: sessionsData, error } = await supabase
  .from('user_sessions')
  .select(`
    id,
    user_id,
    session_token,
    ip_address,
    user_agent,
    device_info,
    location_info,
    status,
    last_activity,
    created_at,
    expires_at,
    is_active,
    logout_time,
    login_method,
    mfa_used,
    risk_score,
    users:user_id (
      id,
      email,
      first_name,
      last_name,
      role
    )
  `)
  .order('created_at', { ascending: false })
  .limit(1000);
```

## Recommended Additional Enhancements

### 1. Session Risk Score Calculation

You can implement a function to calculate risk scores automatically:

```sql
CREATE OR REPLACE FUNCTION calculate_session_risk_score(
  p_login_method VARCHAR(20),
  p_location_info JSONB,
  p_device_info JSONB,
  p_ip_address INET
) RETURNS VARCHAR(10) AS $$
DECLARE
  risk_points INTEGER := 0;
BEGIN
  -- Low risk if MFA used
  IF p_login_method = 'mfa' THEN
    risk_points := risk_points - 1;
  END IF;
  
  -- Medium risk if password only
  IF p_login_method = 'password' THEN
    risk_points := risk_points + 1;
  END IF;
  
  -- Check for unusual location (you'd implement geo-checking)
  -- High risk if VPN/proxy detected (example)
  
  -- Calculate final score
  IF risk_points <= 0 THEN
    RETURN 'low';
  ELSIF risk_points = 1 THEN
    RETURN 'medium';
  ELSE
    RETURN 'high';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 2. Automatic Status Updates

You can create a trigger or scheduled job to update expired sessions:

```sql
-- Function to mark expired sessions
CREATE OR REPLACE FUNCTION update_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET 
    status = 'inactive',
    is_active = false
  WHERE 
    expires_at < NOW()
    AND is_active = true
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run periodically (e.g., every 5 minutes)
```

## Summary

### ✅ Tables Already Exist
1. `user_sessions` - ✅ Exists but needs additional fields
2. `users` - ✅ Exists

### ⚠️ Required Additions

**New Columns for `user_sessions`:**
- `logout_time` (TIMESTAMP WITH TIME ZONE)
- `login_method` (VARCHAR(20)) with constraint
- `mfa_used` (BOOLEAN)
- `risk_score` (VARCHAR(10)) with constraint

**JSONB Field Structure:**
- `device_info` - Should contain: deviceType, deviceName, browser, operatingSystem
- `location_info` - Should contain: city, region, country

### 📝 Status Mapping
- Need to map current status values (`active`, `away`, `inactive`) to component expected values (`active`, `expired`, `terminated`, `logout`)

### 🔧 Next Steps
1. Run the migration script to add missing columns
2. Update your login flow to populate `login_method`, `mfa_used`, and `risk_score`
3. Update logout flow to set `logout_time`
4. Ensure `device_info` and `location_info` JSONB fields are properly populated
5. Update the component's `loadSessionHistory()` function to query real data and transform it


