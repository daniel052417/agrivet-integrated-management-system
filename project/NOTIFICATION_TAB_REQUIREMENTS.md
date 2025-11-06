# Notification Tab - Full Functionality Requirements

## Current Status

### ✅ What's Working
1. **Settings UI** - The Notification tab in `SettingsPage.tsx` is fully functional for:
   - Saving notification preferences (email, push, alert types, recipients)
   - Loading saved settings from database
   - All UI controls are working

2. **Settings Storage** - Settings are properly saved to the database via `settingsService`

### ❌ What's Missing

#### 1. **Header Notification Bell (NOT Connected)**
The notification bell icon in the header (`Header.tsx` line 49-52) is currently:
- **Just a static button** with no functionality
- Shows a red dot badge (hardcoded)
- **Does NOT** display actual notifications
- **Does NOT** connect to notification settings

**Current Code:**
```tsx
<button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
  <Bell className="w-5 h-5" />
  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
</button>
```

#### 2. **Notification Service Integration**
The notification settings are **NOT being used** anywhere in the codebase to:
- Check if email notifications are enabled before sending
- Check if push notifications are enabled
- Filter which alerts to send based on settings
- Send daily sales summaries
- Send attendance alerts

#### 3. **Backend Services Missing**
No services exist to:
- Send low stock alerts when inventory is low
- Send new order alerts when orders are placed
- Send system alerts for critical issues
- Send daily sales summary emails
- Send attendance alerts

---

## What Needs to Be Implemented

### 1. **Notification Bell Component** (Header Integration)

**File:** `src/components/shared/layout/Header.tsx`

**Required:**
- Create a notification dropdown/popover component
- Fetch unread notifications from database
- Display notification count badge
- Show notification list when clicked
- Mark notifications as read
- Connect to `NotificationsService`

**Implementation Steps:**
```tsx
// 1. Add state for notifications
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showDropdown, setShowDropdown] = useState(false);

// 2. Fetch notifications on mount
useEffect(() => {
  fetchNotifications();
}, []);

// 3. Create notification dropdown UI
// 4. Add click handler to toggle dropdown
// 5. Display notification list
```

### 2. **Notification Settings Integration Service**

**New File:** `src/lib/notificationSettingsService.ts`

**Purpose:** Check notification settings before sending any notification

**Required Functions:**
```typescript
class NotificationSettingsService {
  // Check if email notifications are enabled
  static async isEmailNotificationsEnabled(): Promise<boolean>
  
  // Check if push notifications are enabled
  static async isPushNotificationsEnabled(): Promise<boolean>
  
  // Check if specific alert type is enabled
  static async isAlertEnabled(alertType: 'lowStock' | 'newOrder' | 'system' | 'dailySummary' | 'attendance'): Promise<boolean>
  
  // Get notification recipients for daily summary
  static async getDailySummaryRecipients(): Promise<string[]>
  
  // Get manager email for BCC
  static async getManagerEmail(): Promise<string | null>
}
```

### 3. **Alert Sending Services**

#### A. **Low Stock Alert Service**

**New File:** `src/lib/alerts/lowStockAlertService.ts`

**Triggers:**
- When product stock falls below threshold (database trigger exists but doesn't send notifications)
- When inventory is updated

**Required:**
```typescript
class LowStockAlertService {
  static async checkAndSendLowStockAlert(productId: string): Promise<void> {
    // 1. Check if lowStockAlerts is enabled in settings
    // 2. Get product details
    // 3. Check if stock is below threshold
    // 4. Send email to manager/owner if enabled
    // 5. Create notification record in database
    // 6. Send push notification if enabled
  }
}
```

#### B. **New Order Alert Service**

**New File:** `src/lib/alerts/newOrderAlertService.ts`

**Triggers:**
- When new online order is created
- When order status changes to "confirmed"

**Required:**
```typescript
class NewOrderAlertService {
  static async sendNewOrderAlert(orderId: string): Promise<void> {
    // 1. Check if newOrderAlerts is enabled
    // 2. Get order details
    // 3. Send email to manager/owner
    // 4. Create notification record
    // 5. Send push notification
  }
}
```

#### C. **Daily Sales Summary Service**

**New File:** `src/lib/alerts/dailySalesSummaryService.ts`

**Triggers:**
- Scheduled job (cron) at closing time (e.g., 6 PM daily)
- Manual trigger from admin

**Required:**
```typescript
class DailySalesSummaryService {
  static async sendDailySummary(date?: Date): Promise<void> {
    // 1. Check if dailySalesSummary is enabled
    // 2. Get daily sales data
    // 3. Get recipients from settings (owner, manager, cashier_lead)
    // 4. Generate summary email
    // 5. Send to all recipients
    // 6. Create notification records
  }
}
```

#### D. **Attendance Alert Service**

**New File:** `src/lib/alerts/attendanceAlertService.ts`

**Triggers:**
- When employee is marked late
- When employee is absent
- Daily attendance summary

**Required:**
```typescript
class AttendanceAlertService {
  static async sendAttendanceAlert(alertType: 'late' | 'absent' | 'summary', employeeId: string): Promise<void> {
    // 1. Check if attendanceAlerts is enabled
    // 2. Get employee details
    // 3. Send email to manager/HR
    // 4. Create notification record
  }
}
```

### 4. **Database Table for In-App Notifications**

**Migration File:** `supabase/migrations/XXXX_create_user_notifications.sql`

**Required Table:**
```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'low_stock', 'new_order', 'system', 'daily_summary', 'attendance'
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT, -- URL to navigate when clicked
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
```

### 5. **Email Templates**

**New Directory:** `src/lib/emailTemplates/`

**Required Templates:**
- `lowStockAlert.html` - Low stock notification email
- `newOrderAlert.html` - New order notification email
- `dailySalesSummary.html` - Daily sales summary email
- `attendanceAlert.html` - Attendance notification email
- `systemAlert.html` - System alert email

### 6. **Push Notification Service**

**New File:** `src/lib/pushNotificationService.ts`

**Required:**
- Browser Notification API integration
- Service Worker for PWA
- Permission request handling
- Notification display logic

### 7. **Scheduled Jobs (Cron)**

**Option A: Supabase Edge Function + pg_cron**
- Create Edge Function for daily sales summary
- Schedule with pg_cron extension

**Option B: External Cron Service**
- Use services like Vercel Cron, GitHub Actions, or external cron service
- Call Supabase Edge Function endpoint

---

## Implementation Priority

### Phase 1: Basic Functionality (MVP)
1. ✅ Notification settings UI (Already done)
2. ⚠️ Notification bell dropdown in header
3. ⚠️ User notifications table
4. ⚠️ Notification settings service
5. ⚠️ Low stock alert integration

### Phase 2: Core Alerts
1. ⚠️ New order alerts
2. ⚠️ System alerts
3. ⚠️ Email sending integration

### Phase 3: Advanced Features
1. ⚠️ Daily sales summary
2. ⚠️ Attendance alerts
3. ⚠️ Push notifications
4. ⚠️ Scheduled jobs

---

## Database Schema Requirements

### Existing Tables (Already Created)
- ✅ `notifications` - For marketing/campaign notifications
- ✅ `notification_templates` - Email templates
- ✅ `notification_deliveries` - Delivery tracking

### New Tables Needed
- ⚠️ `user_notifications` - In-app notifications for users
- ⚠️ `notification_settings` - Already exists via `settings` table, but may need optimization

---

## Integration Points

### Where to Add Notification Checks

1. **Inventory Management**
   - `src/lib/inventoryService.ts` - When stock is updated
   - `src/POS/services/posService.ts` - After POS transaction

2. **Order Management**
   - `src/POS/services/onlineOrdersService.ts` - When order is created/confirmed
   - `src/lib/orderService.ts` - Order status changes

3. **HR Management**
   - `src/lib/hrService.ts` - Attendance tracking
   - `src/lib/payrollService.ts` - Payroll alerts

4. **System Events**
   - Database triggers for critical errors
   - System health checks

---

## Testing Checklist

- [ ] Notification settings save correctly
- [ ] Notification bell shows unread count
- [ ] Notification dropdown displays notifications
- [ ] Low stock alerts send when enabled
- [ ] Low stock alerts don't send when disabled
- [ ] New order alerts send when enabled
- [ ] Daily summary sends at scheduled time
- [ ] Email notifications respect settings
- [ ] Push notifications respect settings
- [ ] Manager email BCC works
- [ ] Daily summary recipients work correctly

---

## Summary

**Current State:**
- ✅ Settings UI is complete and functional
- ❌ Settings are NOT being used anywhere
- ❌ Notification bell is just a static button
- ❌ No actual notification sending logic exists

**To Make It Fully Functional:**
1. Connect notification bell to database
2. Create notification sending services
3. Integrate settings checks before sending
4. Add scheduled jobs for daily summaries
5. Implement push notifications
6. Create email templates

**Estimated Development Time:**
- Phase 1 (MVP): 8-12 hours
- Phase 2 (Core): 6-8 hours
- Phase 3 (Advanced): 8-10 hours
- **Total: 22-30 hours**



