# Staff Management System Setup Guide

## Quick Start

### 1. Database Setup

Run the database migration to set up the required tables:

```bash
# Apply the migration
psql -h your-db-host -U your-username -d your-database -f supabase/migrations/20250121000000_staff_user_integration.sql
```

### 2. Environment Configuration

Ensure your environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test the Integration

Run the integration tests to verify everything is working:

```typescript
import { getSystemStatus } from './src/lib/staffUserIntegration';

// Check system health
const status = await getSystemStatus();
console.log('System Status:', status);
```

## Navigation

### Accessing the Staff Management System

1. **Main Interface**: Navigate to "Staff & User Management" in the sidebar
2. **Add Staff**: Click "Add Staff" to create new staff with optional account creation
3. **Bulk Operations**: Use the "Create Accounts" button for bulk account creation
4. **User Accounts**: View all user accounts (including staff-linked accounts)

### Key Features

#### Enhanced Add Staff Form
- Personal information section
- Employment details
- **NEW**: User account creation options
- **NEW**: Password generation and validation
- **NEW**: Email invitation option

#### Staff-User Management Interface
- Unified view of staff and their accounts
- Account status indicators
- Bulk account creation
- Link/unlink operations
- Search and filtering

#### Account Creation Wizard
- Multi-step process for bulk operations
- Staff selection
- Account settings configuration
- Creation method selection
- Progress tracking

## Usage Examples

### Creating a Staff Member with Account

1. Navigate to "Staff & User Management"
2. Click "Add Staff"
3. Fill in personal information
4. Check "Create User Account"
5. Configure account settings:
   - Role: Select appropriate role
   - Username: Auto-generated or custom
   - Password: Use generator or enter manually
   - Email Invitation: Choose immediate creation or email invite
6. Click "Create Staff Member"

### Bulk Account Creation

1. Navigate to "Staff & User Management"
2. Click "Create Accounts" button
3. Follow the wizard:
   - Select staff members
   - Configure account settings
   - Choose creation method
   - Review and confirm
   - Monitor progress

### Managing Existing Staff

1. View staff list with account status
2. Use filters to find staff without accounts
3. Select multiple staff for bulk operations
4. Create accounts individually or in bulk
5. Link/unlink accounts as needed

## Security Features

### Password Requirements
- Minimum 8 characters
- Uppercase and lowercase letters
- Numbers and special characters
- Real-time strength validation

### Validation
- Email format validation
- Phone number validation
- Business rule validation
- Input sanitization

### Audit Logging
- All account operations logged
- User action tracking
- System change monitoring

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Check Supabase credentials
- Verify network connectivity
- Ensure database is accessible

#### "Account creation failed"
- Check email uniqueness
- Verify password requirements
- Ensure proper permissions

#### "Email invitation not sent"
- Check email service configuration
- Verify invitation token generation
- Review email templates

### Debug Tools

#### System Status Check
```typescript
import { getSystemStatus } from './src/lib/staffUserIntegration';
const status = await getSystemStatus();
```

#### Data Integrity Check
```typescript
import { validateDataIntegrity } from './src/lib/staffUserIntegration';
const integrity = await validateDataIntegrity();
```

## API Usage

### Basic Staff Creation
```typescript
import { staffManagementApi } from './src/lib/staffApi';

const staff = await staffManagementApi.staff.createStaff({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  // ... other fields
});
```

### Staff with Account Creation
```typescript
const result = await staffManagementApi.enhancedStaff.createStaffWithAccount({
  // ... staff data
  createUserAccount: true,
  accountDetails: {
    role: 'staff',
    sendEmailInvite: false,
    password: 'SecurePass123!'
  }
});
```

### Bulk Account Creation
```typescript
const result = await staffManagementApi.enhancedStaff.bulkCreateAccountsForStaff([
  'staff-id-1',
  'staff-id-2',
  'staff-id-3'
]);
```

## Best Practices

### Data Management
- Always validate input data
- Use strong passwords
- Regular data integrity checks
- Monitor audit logs

### Security
- Implement proper role-based access
- Use secure password generation
- Regular security audits
- Keep credentials secure

### Performance
- Use bulk operations for multiple accounts
- Monitor database performance
- Implement proper indexing
- Regular maintenance

## Support

For issues or questions:

1. Check the troubleshooting section
2. Run integration tests
3. Review system logs
4. Contact the development team

## Next Steps

After setup:

1. **Test the system** with sample data
2. **Configure email service** for invitations
3. **Set up monitoring** and alerts
4. **Train users** on the new features
5. **Plan migration** of existing data

The Staff Management System is now ready for use! 🎉



























