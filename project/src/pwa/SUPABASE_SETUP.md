# Supabase Setup Instructions

## The Issue
The Google OAuth login is not working because the Supabase environment variables are missing. The app is currently using a mock Supabase client which prevents crashes but doesn't allow real authentication.

## Solution
You need to create a `.env` file in the `project/src/pwa/` directory with your Supabase credentials.

## Steps to Fix:

### 1. Create the .env file
Create a new file called `.env` in the `project/src/pwa/` directory.

### 2. Add your Supabase credentials
Add these lines to the `.env` file:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Get your Supabase credentials
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key
5. Replace the values in your `.env` file

### 4. Enable Google OAuth in Supabase
1. In your Supabase dashboard, go to Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Client Secret)
4. Set the redirect URL to: `http://localhost:3001/auth/callback`

### 5. Restart your development server
After creating the `.env` file, restart your development server:
```bash
npm run dev
```

## Example .env file:
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example-key-here
```

## After Setup
Once you've set up the environment variables, you should see these logs in the console:
- `🔧 VITE_SUPABASE_URL: Present`
- `🔧 VITE_SUPABASE_ANON_KEY: Present`
- `🔧 Supabase Client Created: true`

Then the Google OAuth login should work properly!

