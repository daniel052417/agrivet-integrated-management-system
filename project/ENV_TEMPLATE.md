# Environment Variables Template

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard: https://app.supabase.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role Key (Optional - for server-side operations)
# WARNING: Never expose this key in client-side code!
# Only use this in secure server environments (Edge Functions, API routes)
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Environment
# Options: development, production
NODE_ENV=development

# Bundle Analyzer (Optional)
# Set to 'true' to generate bundle analysis report during build
ANALYZE=false
```

## Instructions for Deployment

### Local Development
1. Copy this template to `.env.local` in the project root
2. Fill in your actual Supabase credentials
3. The `.env.local` file is gitignored and won't be committed

### Vercel Deployment
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable from the template above
4. Set the correct environment (Production, Preview, Development)
5. Redeploy your application for changes to take effect

## Security Notes
- **NEVER** commit `.env.local` or `.env` to version control
- The `SERVICE_ROLE_KEY` should **NEVER** be used in client-side code
- Only use `SERVICE_ROLE_KEY` in secure server environments (Edge Functions)
- Make sure to use different keys for different environments (dev, staging, production)



