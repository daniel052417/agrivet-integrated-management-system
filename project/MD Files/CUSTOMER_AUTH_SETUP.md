# Customer Authentication Setup Guide

This guide explains how to implement a clean Supabase authentication flow for customers in your PWA, where `auth.users` remains the single source of truth and `public.customers` is automatically synced via triggers.

## Overview

The implementation includes:
- **Database Schema**: `public.customers` table with proper relationships
- **Trigger Function**: Automatically creates customer records when users sign up with `role: 'customer'`
- **RLS Policies**: Secure access control for customer data
- **TypeScript Services**: Complete authentication service with React hooks
- **React Components**: Ready-to-use sign up, sign in, and profile components

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the necessary database structure:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20250125000004_customer_auth_flow.sql
```

This migration creates:
- `public.customers` table with all necessary fields
- `handle_new_customer()` trigger function
- Trigger on `auth.users` table
- RLS policies for secure access
- Proper indexes for performance

### 2. Configure Supabase Auth

In your Supabase dashboard:

1. **Enable Email Authentication**:
   - Go to Authentication > Settings
   - Enable "Email" provider
   - Configure email templates if needed

2. **Enable Google OAuth** (optional):
   - Go to Authentication > Providers
   - Enable "Google" provider
   - Add your Google OAuth credentials

3. **Configure Site URL**:
   - Set your site URL in Authentication > URL Configuration
   - Add redirect URLs for your app

## Frontend Setup

### 1. Install Dependencies

Make sure you have the required dependencies:

```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables

Add these to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Import and Use

```typescript
// In your main App component
import { CustomerAuthProvider } from './hooks/useCustomerAuth'
import { CustomerAuthExample } from './pages/CustomerAuthExample'

function App() {
  return (
    <CustomerAuthProvider>
      <CustomerAuthExample />
    </CustomerAuthProvider>
  )
}
```

## Usage Examples

### Basic Authentication

```typescript
import { useCustomerAuth } from './hooks/useCustomerAuth'

function MyComponent() {
  const { 
    customer, 
    isAuthenticated, 
    signUp, 
    signIn, 
    signOut 
  } = useCustomerAuth()

  const handleSignUp = async () => {
    const result = await signUp({
      email: 'customer@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      customer_type: 'individual'
    })
    
    if (result.success) {
      console.log('Customer created:', result.customer)
    }
  }

  const handleSignIn = async () => {
    const result = await signIn({
      email: 'customer@example.com',
      password: 'password123'
    })
    
    if (result.success) {
      console.log('Customer signed in:', result.customer)
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {customer?.first_name}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
        </div>
      )}
    </div>
  )
}
```

### Google OAuth

```typescript
const { signInWithGoogle } = useCustomerAuth()

const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle()
  // User will be redirected to Google OAuth
  // On return, the auth state will be updated automatically
}
```

### Profile Management

```typescript
const { customer, updateProfile } = useCustomerAuth()

const handleUpdateProfile = async () => {
  const result = await updateProfile({
    phone: '+0987654321',
    address: '123 Main St',
    city: 'Toronto',
    province: 'ON'
  })
  
  if (result.success) {
    console.log('Profile updated:', result.customer)
  }
}
```

## Authentication Flow

### 1. Sign Up Flow

1. User fills out sign-up form
2. `customerAuthService.signUpWithEmail()` is called
3. Supabase creates user in `auth.users` with `raw_app_meta_data.role = 'customer'`
4. Trigger `handle_new_customer()` automatically creates record in `public.customers`
5. Customer profile is returned to the frontend

### 2. Sign In Flow

1. User enters email/password or clicks Google sign-in
2. Supabase authenticates the user
3. `customerAuthService.getCurrentCustomer()` fetches profile from `public.customers`
4. Customer data is available in the app

### 3. Profile Updates

1. User updates profile information
2. `customerAuthService.updateCustomerProfile()` updates `public.customers`
3. RLS policies ensure users can only update their own data

## Security Features

### Row Level Security (RLS)

The implementation includes comprehensive RLS policies:

- **Customers can only view/update their own records**
- **Staff can view all customer records** (for admin purposes)
- **Anonymous users can create customer records** (during signup)

### Data Validation

- Email format validation
- Password strength requirements
- Phone number format validation
- Required field validation

## API Reference

### CustomerAuthService

#### `signUpWithEmail(data: SignUpData): Promise<AuthResponse>`
Creates a new customer account with email and password.

#### `signInWithEmail(data: SignInData): Promise<AuthResponse>`
Signs in an existing customer with email and password.

#### `signInWithGoogle(): Promise<AuthResponse>`
Initiates Google OAuth sign-in flow.

#### `getCurrentCustomer(): Promise<Customer | null>`
Fetches the current customer's profile.

#### `updateCustomerProfile(updates: Partial<Customer>): Promise<AuthResponse>`
Updates the current customer's profile.

#### `signOut(): Promise<{ success: boolean; error?: string }>`
Signs out the current user.

### useCustomerAuth Hook

Returns:
- `customer`: Current customer data
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state
- `error`: Error message
- `signUp`: Sign up function
- `signIn`: Sign in function
- `signInWithGoogle`: Google sign in function
- `signOut`: Sign out function
- `updateProfile`: Update profile function
- `refreshProfile`: Refresh profile function
- `clearError`: Clear error function

## Troubleshooting

### Common Issues

1. **Customer profile not created after signup**:
   - Check if the trigger is properly installed
   - Verify `raw_app_meta_data.role = 'customer'` is set
   - Check Supabase logs for trigger errors

2. **RLS policy errors**:
   - Ensure user is authenticated before accessing customer data
   - Check if RLS policies are properly applied
   - Verify user permissions

3. **Google OAuth not working**:
   - Check Google OAuth configuration in Supabase
   - Verify redirect URLs are correct
   - Ensure Google OAuth credentials are valid

### Debug Mode

Enable debug logging by checking the browser console. All authentication operations are logged with detailed information.

## File Structure

```
src/
├── services/
│   └── customerAuth.ts          # Authentication service
├── hooks/
│   └── useCustomerAuth.ts       # React hook for auth state
├── components/auth/
│   ├── CustomerSignUp.tsx       # Sign up component
│   ├── CustomerSignIn.tsx       # Sign in component
│   └── CustomerProfile.tsx      # Profile management component
├── pages/
│   └── CustomerAuthExample.tsx  # Complete example page
└── supabase/migrations/
    └── 20250125000004_customer_auth_flow.sql  # Database migration
```

## Next Steps

1. **Customize the UI**: Modify the React components to match your design
2. **Add more fields**: Extend the customer table with additional fields
3. **Implement business logic**: Add customer-specific features like order history
4. **Add admin features**: Create admin interfaces for customer management
5. **Add email verification**: Implement email verification flow
6. **Add password reset**: Implement password reset functionality

This implementation provides a solid foundation for customer authentication in your PWA while maintaining security and following Supabase best practices.





