# Cart Persistence Implementation

This document describes the database-backed cart system implementation for the AgriVet PWA.

## Overview

The cart persistence system provides a hybrid approach that combines localStorage for immediate responsiveness with database storage for persistence across devices and sessions. This ensures users don't lose their cart when switching devices or after browser crashes.

## Architecture

### Components

1. **CartService** (`src/services/cartService.ts`)
   - Core service handling cart persistence logic
   - Manages sync between localStorage and database
   - Handles conflict resolution
   - Manages guest vs authenticated user cart migration

2. **Enhanced CartContext** (`src/contexts/CartContext.tsx`)
   - Extended with database persistence capabilities
   - Automatic sync on cart changes
   - User authentication handling
   - Loading states and sync status

3. **useCartSync Hook** (`src/hooks/useCartSync.ts`)
   - React hook for managing cart synchronization
   - Auto-sync functionality
   - Manual sync controls
   - Authentication change handling

4. **CartSyncStatus Component** (`src/components/cart/CartSyncStatus.tsx`)
   - UI component showing sync status
   - Manual sync trigger
   - Online/offline indicators

5. **Backend API** (`project/backend/src/controllers/cartController.js`)
   - RESTful endpoints for cart operations
   - Session management
   - Guest cart migration

## Database Schema

### PWA Sessions Table

```sql
CREATE TABLE public.pwa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id varchar(255) UNIQUE NOT NULL,
  branch_id uuid REFERENCES branches(id),
  customer_id uuid REFERENCES customers(id),
  is_guest boolean DEFAULT true,
  cart_data jsonb,
  dismissed_banners jsonb,
  modal_shown jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  expires_at timestamp NOT NULL,
  device_info jsonb,
  last_activity timestamp DEFAULT now(),
  user_agent text,
  ip_address inet
);
```

### Key Functions

- `create_or_update_pwa_session()` - Create or update session with cart data
- `get_pwa_session()` - Retrieve session data
- `get_cart_data()` - Get cart data for a session
- `update_cart_data()` - Update cart data for a session
- `cleanup_expired_pwa_sessions()` - Clean up expired sessions

## API Endpoints

### Session Management
- `POST /api/pwa-sessions` - Create or update session
- `GET /api/pwa-sessions/:sessionId` - Get session data

### Cart Operations
- `GET /api/cart/:sessionId` - Get cart data
- `PUT /api/cart/:sessionId` - Update cart data

### Guest Migration
- `POST /api/migrate-guest-cart` - Migrate guest cart to authenticated user

### Maintenance
- `POST /api/cleanup-sessions` - Clean up expired sessions

## Usage

### Basic Usage

```tsx
import { useCart } from '../contexts/CartContext'

function MyComponent() {
  const { cart, addItem, isLoading, lastSyncTime } = useCart()
  
  // Cart operations work as before
  const handleAddItem = () => {
    addItem({
      product: productVariant,
      quantity: 1,
      unitPrice: 100
    })
  }
  
  return (
    <div>
      {isLoading && <div>Syncing cart...</div>}
      <p>Last synced: {lastSyncTime?.toLocaleString()}</p>
      {/* Your cart UI */}
    </div>
  )
}
```

### With Sync Controls

```tsx
import { useCartSync } from '../hooks/useCartSync'

function MyComponent() {
  const { syncNow, handleAuthChange, isLoading } = useCartSync({
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    onSyncStart: () => console.log('Sync started'),
    onSyncComplete: (result) => console.log('Sync completed'),
    onSyncError: (error) => console.error('Sync failed')
  })
  
  const handleManualSync = async () => {
    try {
      await syncNow()
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
  
  const handleLogin = async (userId: string) => {
    await handleAuthChange(userId, false)
  }
  
  return (
    <div>
      <button onClick={handleManualSync} disabled={isLoading}>
        Sync Cart
      </button>
    </div>
  )
}
```

### With Sync Status UI

```tsx
import CartSyncStatus from '../components/cart/CartSyncStatus'

function MyComponent() {
  return (
    <div>
      <CartSyncStatus showDetails={true} />
      {/* Your cart UI */}
    </div>
  )
}
```

## Features

### 1. Hybrid Storage
- **localStorage**: Immediate responsiveness, works offline
- **Database**: Persistence across devices, session recovery

### 2. Conflict Resolution
- Detects conflicts between local and server carts
- Resolves conflicts based on configurable strategies
- Supports item quantity, addition, and removal conflicts

### 3. Guest to Authenticated Migration
- Seamless cart migration when users log in
- Preserves cart data during authentication flow
- Handles both guest and authenticated states

### 4. Offline Support
- Works offline with localStorage fallback
- Syncs when connection is restored
- Graceful degradation

### 5. Auto-sync
- Automatic sync on cart changes (debounced)
- Periodic sync for consistency
- Manual sync controls

### 6. Session Management
- Unique session IDs for each browser/device
- Session expiration handling
- Device and user agent tracking

## Configuration

### Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### CartService Configuration

```typescript
const cartService = new CartService({
  apiUrl: 'http://localhost:3001/api',
  sessionId: 'unique-session-id',
  userId: 'user-id-or-undefined',
  isGuest: true
})
```

## Testing

### Test Component

Visit `/demo/cart-test` to access the cart persistence test component that provides:

- Test localStorage functionality
- Test database connectivity
- Test sync operations
- Simulate authentication changes
- View cart status and sync information

### Manual Testing

1. Add items to cart
2. Refresh page - items should persist
3. Open in new tab - cart should sync
4. Log in/out - cart should migrate appropriately
5. Go offline - cart should still work
6. Come back online - cart should sync

## Error Handling

The system includes comprehensive error handling:

- Network failures fall back to localStorage
- Database errors are logged and handled gracefully
- Sync conflicts are resolved automatically
- Authentication errors don't break cart functionality

## Performance Considerations

- Debounced sync (1 second) prevents excessive API calls
- Indexed database queries for fast lookups
- Efficient conflict resolution algorithms
- Minimal memory footprint

## Security

- Row Level Security (RLS) policies protect user data
- Session-based access control
- Guest and authenticated user separation
- Secure API endpoints with proper authentication

## Maintenance

### Cleanup

Expired sessions are automatically cleaned up, but you can also run manual cleanup:

```sql
SELECT public.cleanup_expired_pwa_sessions();
```

### Monitoring

Monitor cart sync performance and errors through:

- Browser console logs
- Database query logs
- API endpoint monitoring
- User feedback

## Future Enhancements

1. **Real-time Sync**: WebSocket-based real-time cart synchronization
2. **Conflict UI**: User interface for resolving cart conflicts
3. **Analytics**: Cart abandonment and sync analytics
4. **Bulk Operations**: Batch cart operations for better performance
5. **Cart Sharing**: Share cart between users
6. **Cart Templates**: Save and reuse cart configurations

## Troubleshooting

### Common Issues

1. **Cart not syncing**: Check network connection and API endpoint
2. **Items disappearing**: Check conflict resolution settings
3. **Slow performance**: Check database indexes and query performance
4. **Authentication issues**: Verify user ID and session configuration

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('cart-debug', 'true')
```

This will provide detailed console logs of cart operations and sync activities.
