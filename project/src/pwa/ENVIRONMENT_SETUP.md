# Environment Setup Guide

## Supabase Configuration

To enable full order processing functionality, you need to configure your Supabase environment variables.

### 1. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2. Create Environment File

Create a `.env` file in the `project/src/pwa/` directory with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholder values with your actual Supabase credentials.

### 3. Restart Development Server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

## Current Behavior

### Without Environment Variables
- The app will use **MockOrderService** for checkout
- Orders will be processed locally for testing
- A blue "Demo Mode" indicator will be shown
- No warning messages will appear

### With Environment Variables
- The app will use the real **OrderService** with Supabase
- Orders will be persisted to the database
- Full order management functionality will be available

## Database Setup

Make sure your Supabase database has the required tables:

1. **branches** - Store branch information
2. **products** - Store product catalog
3. **product_units** - Store product unit variations
4. **inventory** - Store inventory levels
5. **orders** - Store order information
6. **order_items** - Store order line items
7. **customers** - Store customer information

## Testing

You can test the checkout functionality in both modes:

- **Demo Mode**: Perfect for development and testing
- **Production Mode**: Full database integration for real orders

The app will automatically detect which mode to use based on your environment configuration.
