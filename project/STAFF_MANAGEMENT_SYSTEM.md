# Staff Management System with User Account Integration

## Overview

The Staff Management System provides comprehensive functionality for managing staff members and their associated user accounts in the Agrivet Integrated Management System. This system allows administrators to create staff records, link them to user accounts, and manage permissions through a unified interface.

## Features

### Core Functionality
- **Staff Management**: Create, read, update, and delete staff records
- **User Account Integration**: Link staff records to user accounts
- **Account Creation Workflow**: Create user accounts during staff onboarding
- **Email Invitations**: Send email invitations for account setup
- **Bulk Operations**: Create accounts for multiple staff members
- **Role-Based Permissions**: Manage permissions based on staff roles
- **Audit Logging**: Track all account operations
- **Data Validation**: Comprehensive input validation and security checks

### User Interface Components
- **AddStaff**: Enhanced form for creating staff with optional account creation
- **StaffUserManagement**: Unified interface for managing staff-account relationships
- **AccountCreationWizard**: Multi-step wizard for bulk account creation
- **UserAccounts**: Enhanced view showing staff-linked accounts
- **RolesPermissions**: Role and permission management

## Database Schema

### Core Tables

#### `staff` (Enhanced)
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(50) NOT NULL,
  user_account_id UUID REFERENCES users(user_id), -- NEW
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `staff_user_links` (New)
```sql
CREATE TABLE staff_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  link_status VARCHAR(20) DEFAULT 'active',
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unlinked_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, user_id)
);
```

#### `account_creation_workflow` (New)
```sql
CREATE TABLE account_creation_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  workflow_status VARCHAR(20) DEFAULT 'pending',
  account_creation_method VARCHAR(20),
  email_invite_sent_at TIMESTAMP WITH TIME ZONE,
  account_created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `email_invitations` (New)
```sql
CREATE TABLE email_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `user_account_audit` (New)
```sql
CREATE TABLE user_account_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  target_user_email VARCHAR(255) NOT NULL,
  target_user_id UUID,
  target_staff_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## API Reference

### Staff Management API

#### `staffApi`
- `getAllStaff()`: Get all staff members
- `getStaffById(id)`: Get staff by ID
- `createStaff(data)`: Create new staff member
- `updateStaff(data)`: Update staff member
- `deleteStaff(id)`: Delete staff member
- `searchStaff(query)`: Search staff members
- `getStaffByDepartment(department)`: Get staff by department
- `getStaffByRole(role)`: Get staff by role
- `getActiveStaffCount()`: Get count of active staff

#### `staffUserApi` (New)
- `linkStaffToUser(staffId, userId)`: Link existing staff to user account
- `createUserForStaff(staffId, userData)`: Create user account for staff
- `getStaffWithUserAccount(staffId)`: Get staff with linked account info
- `getStaffWithoutAccounts()`: Get staff without user accounts
- `unlinkStaffFromUser(staffId, userId)`: Unlink staff from user account
- `transferStaffAccount(staffId, newUserId)`: Transfer staff account to different user

#### `enhancedStaffApi` (New)
- `createStaffWithAccount(data)`: Create staff with optional account creation
- `bulkCreateAccountsForStaff(staffIds)`: Bulk create accounts for staff
- `getAccountCreationStatus(staffId)`: Get account creation workflow status

#### `emailInvitationApi` (New)
- `sendAccountInvitation(staffId, email)`: Send account creation invitation
- `verifyInvitationAndCreateAccount(token, password)`: Verify invitation and create account
- `resendInvitation(staffId)`: Resend invitation

#### `auditApi` (New)
- `writeAuditLog(entry)`: Write audit log entry
- `getAuditLogs(limit)`: Get audit logs

## Usage Examples

### Creating Staff with Account

```typescript
import { staffManagementApi } from './lib/staffApi';

const staffData = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@agrivet.com',
  phone: '+1234567890',
  position: 'Sales Associate',
  department: 'Sales',
  branch_id: 'branch-uuid',
  hire_date: '2024-01-15',
  salary: 50000,
  is_active: true,
  role: 'staff',
  createUserAccount: true,
  accountDetails: {
    role: 'staff',
    sendEmailInvite: false,
    password: 'SecurePassword123!'
  }
};

const result = await staffManagementApi.enhancedStaff.createStaffWithAccount(staffData);
```

### Bulk Account Creation

```typescript
const staffIds = ['staff-1', 'staff-2', 'staff-3'];
const result = await staffManagementApi.enhancedStaff.bulkCreateAccountsForStaff(staffIds);

console.log(`Success: ${result.success.length}, Failed: ${result.failed.length}`);
```

### Linking Existing Staff to User

```typescript
const link = await staffManagementApi.staffUser.linkStaffToUser('staff-id', 'user-id');
```

## Security Features

### Input Validation
- Email format validation
- Phone number validation
- Password strength validation
- Username format validation
- Business rule validation

### Security Utilities
- Secure password generation
- Input sanitization
- Role-based access control
- Rate limiting
- Audit logging

### Password Requirements
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

## Workflow Processes

### Staff Creation with Account
1. **Staff Information Entry**: Basic staff details
2. **Account Creation Decision**: Choose to create account
3. **Account Configuration**: Set role, username, password
4. **Creation Method**: Immediate or email invitation
5. **Account Activation**: Automatic or email verification

### Email Invitation Process
1. **Invitation Generation**: Create secure token
2. **Email Sending**: Send invitation email
3. **Token Verification**: Validate invitation token
4. **Account Creation**: Create account with provided password
5. **Account Linking**: Link to staff record

### Bulk Account Creation
1. **Staff Selection**: Choose multiple staff members
2. **Settings Configuration**: Set default role and method
3. **Batch Processing**: Create accounts in sequence
4. **Progress Tracking**: Monitor creation progress
5. **Result Summary**: Display success/failure results

## Error Handling

### Validation Errors
- Field-level validation with specific error messages
- Business rule validation with warnings
- Password strength feedback
- Email format validation

### API Errors
- Database connection errors
- Constraint violation errors
- Permission errors
- Network timeout errors

### User Experience
- Clear error messages
- Warning notifications
- Success confirmations
- Progress indicators

## Testing

### Integration Tests
```typescript
import { StaffUserIntegrationTester } from './lib/staffUserIntegration';

// Run all integration tests
const results = await StaffUserIntegrationTester.runAllTests();
console.log(results);

// Get system status
const status = await getSystemStatus();
console.log(status);
```

### Data Integrity Validation
```typescript
import { validateDataIntegrity } from './lib/staffUserIntegration';

const integrity = await validateDataIntegrity();
if (!integrity.valid) {
  console.log('Data integrity issues:', integrity.issues);
}
```

## Deployment

### Database Migration
1. Run the migration script: `20250121000000_staff_user_integration.sql`
2. Verify table creation and constraints
3. Test database functions and triggers

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuration
- Update Supabase types in `lib/supabase.ts`
- Configure RLS policies for security
- Set up email service for invitations

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify Supabase credentials
- Check network connectivity
- Validate database permissions

#### Account Creation Failures
- Check email uniqueness
- Verify role permissions
- Validate password requirements

#### Email Invitation Issues
- Verify email service configuration
- Check invitation token expiry
- Validate email templates

### Debug Tools
- Integration test suite
- Data integrity validator
- Audit log viewer
- System status checker

## Future Enhancements

### Planned Features
- Advanced role inheritance
- Custom permission sets
- Bulk import/export
- Advanced reporting
- Mobile app integration
- Two-factor authentication
- Single sign-on (SSO)

### Performance Optimizations
- Database query optimization
- Caching strategies
- Pagination improvements
- Background job processing

## Support

For technical support or questions about the Staff Management System:

1. Check the troubleshooting section
2. Run integration tests
3. Review audit logs
4. Contact the development team

## Changelog

### Version 1.0.0 (2024-01-21)
- Initial release of staff-user integration system
- Enhanced AddStaff component with account creation
- StaffUserManagement unified interface
- AccountCreationWizard for bulk operations
- Comprehensive validation and security features
- Database schema enhancements
- API layer improvements
- Audit logging system




















