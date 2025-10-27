# POS Session Integration

This document explains how POS sessions are automatically created when cashiers log in to the system.

## Overview

When a user with the role "cashier" logs in, the system automatically:
1. Checks if the cashier already has an open POS session
2. Finds an available POS terminal for their branch
3. Creates a new POS session if possible
4. Attaches the session information to the user object

## Database Tables

### pos_sessions
- Stores all POS session data including cashier, branch, terminal, and transaction totals
- Automatically generates session numbers and tracks session duration
- Includes cash variance calculations and session status

### pos_terminals
- Stores POS terminal information including name, code, branch, and assigned user
- Tracks terminal status (active/inactive) and last sync time

## Integration Points

### 1. Authentication Service (`customAuth.ts`)

The POS session creation is integrated into the `signInWithPassword` method:

```typescript
// After successful authentication
if (userRole.name === 'cashier' && customUser.branch_id) {
  // Validate and create POS session
  const validation = await posSessionService.canStartNewSession(
    customUser.id, 
    customUser.branch_id
  );
  
  if (validation.canStart) {
    const posSession = await posSessionService.createSession({
      cashier_id: customUser.id,
      branch_id: customUser.branch_id,
      terminal_id: terminalId,
      starting_cash: 0.00,
      notes: `Session started by ${customUser.first_name} ${customUser.last_name}`
    });
    
    // Attach session to user object
    (customUser as any).current_pos_session = posSession;
  }
}
```

### 2. POS Session Service (`posSessionService.ts`)

Provides comprehensive POS session management:

#### Key Methods:
- `createSession()` - Creates a new POS session
- `getOpenSessionByCashier()` - Gets current open session for a cashier
- `getAvailableTerminalForBranch()` - Finds available terminal for branch
- `canStartNewSession()` - Validates if cashier can start new session
- `closeSession()` - Closes a POS session
- `updateSessionTotals()` - Updates sales and transaction totals

#### Terminal Assignment Logic:
1. **Priority 1**: Terminal assigned to the specific cashier
2. **Priority 2**: Terminal with no assigned user in the branch
3. **Priority 3**: Any active terminal in the branch

## Session Flow

### Login Process:
1. User authenticates with email/password
2. System checks user role and branch assignment
3. If role is "cashier":
   - Validates if cashier can start new session
   - Checks for existing open sessions
   - Finds available terminal
   - Creates new session or attaches existing one
4. User object includes `current_pos_session` property

### Session Management:
- **Session Numbers**: Auto-generated format `POS-YYYYMMDD-XXXX`
- **Status Tracking**: `open` or `closed`
- **Cash Tracking**: Starting cash, ending cash, and variance
- **Transaction Totals**: Sales, discounts, returns, taxes
- **Duration**: Automatically calculated when session closes

## Error Handling

The system gracefully handles various scenarios:

- **No Available Terminal**: Logs warning, continues login without session
- **Existing Open Session**: Attaches existing session to user
- **Database Errors**: Logs error, doesn't fail login
- **Missing Branch**: Skips POS session creation

## Usage Examples

### Check if User has POS Session:
```typescript
const user = await customAuthService.getCurrentUser();
if (user?.current_pos_session) {
  console.log('User has active POS session:', user.current_pos_session.id);
}
```

### Get Current Session:
```typescript
const currentSession = await posSessionService.getCurrentSession(cashierId);
if (currentSession) {
  console.log('Current session:', currentSession.session_number);
}
```

### Close Session:
```typescript
await posSessionService.closeSession(
  sessionId, 
  cashierId, 
  endingCash, 
  'End of shift'
);
```

## Testing

Use the test script to verify functionality:

```bash
node test-pos-session.js
```

The test script will:
1. Create a test cashier user
2. Create a test POS terminal
3. Test session creation
4. Test session retrieval
5. Clean up test data

## Configuration

### Environment Variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Database Setup:
Ensure the following tables exist:
- `pos_sessions` - POS session data
- `pos_terminals` - POS terminal information
- `users` - User accounts with role and branch information
- `branches` - Branch information

## Security Considerations

- POS sessions are tied to specific cashiers and branches
- Session validation prevents multiple open sessions per cashier
- Terminal assignment respects user permissions
- All session operations are logged for audit purposes

## Future Enhancements

- Real-time session monitoring
- Session timeout handling
- Multi-terminal support per cashier
- Session transfer between cashiers
- Advanced reporting and analytics
