# 🚀 Complete Vercel Setup Guide

This guide will walk you through deploying your Agrivet Management System to Vercel from your GitHub repository.

## Prerequisites

- ✅ GitHub account with your code pushed to a repository
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com) - it's free)
- ✅ Supabase project with database configured
- ✅ Environment variables ready (Supabase URL and keys)

---

## Step 1: Prepare Your GitHub Repository

### 1.1 Push Your Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Optimized for Vercel deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 1.2 Verify Repository Structure

Make sure your repository has the following structure:
```
your-repo/
└── agrivet-integrated-management-system/
    └── project/
        ├── src/
        ├── public/
        ├── package.json
        ├── vite.config.ts
        ├── vercel.json
        └── ... (other files)
```

**Important**: If your project is in a subdirectory (`agrivet-integrated-management-system/project`), you'll need to set the **Root Directory** in Vercel settings.

---

## Step 2: Sign Up / Log In to Vercel

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended for easier integration)
4. Authorize Vercel to access your GitHub account

### 2.2 Log In (if you already have an account)

1. Go to [vercel.com](https://vercel.com/login)
2. Click **"Continue with GitHub"**
3. Authorize Vercel

---

## Step 3: Import Your Project

### 3.1 Import from GitHub

1. After logging in, you'll see the Vercel dashboard
2. Click **"Add New..."** button
3. Select **"Project"**
4. Click **"Import Git Repository"**
5. You'll see a list of your GitHub repositories
6. Find and click on your repository (e.g., `your-repo-name`)
7. Click **"Import"**

### 3.2 Configure Project Settings

Vercel will automatically detect your project. Configure these settings:

#### Framework Preset
- **Framework**: Vite (should be auto-detected)
- If not detected, select **"Vite"** from the dropdown

#### Root Directory
- **If your project is in a subdirectory**, click **"Edit"** next to "Root Directory"
- Set it to: `agrivet-integrated-management-system/project`
- Or: `./agrivet-integrated-management-system/project`
- Click **"Continue"**

#### Build Settings
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

#### Node.js Version
- Use **Node.js 18.x** or higher (Vercel will auto-detect)

---

## Step 4: Configure Environment Variables

### 4.1 Add Environment Variables

**Before clicking "Deploy"**, you need to add environment variables:

1. In the project configuration page, find **"Environment Variables"** section
2. Click **"Add"** or **"Add Environment Variable"**

### 4.2 Add Required Variables

Add each of these variables:

#### Variable 1: VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://your-project-id.supabase.co`
  - Get this from your Supabase project dashboard → Settings → API
- **Environment**: Select all (Production, Preview, Development)

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `your-anon-key-here`
  - Get this from your Supabase project dashboard → Settings → API
- **Environment**: Select all (Production, Preview, Development)

#### Variable 3: VITE_SUPABASE_SERVICE_ROLE_KEY (Optional)
- **Key**: `VITE_SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `your-service-role-key-here`
  - Get this from your Supabase project dashboard → Settings → API
  - **⚠️ WARNING**: This should only be used in server-side code (Edge Functions)
- **Environment**: Select all (Production, Preview, Development)

### 4.3 How to Get Supabase Keys

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → Use for `VITE_SUPABASE_SERVICE_ROLE_KEY` (optional)

### 4.4 Verify Environment Variables

After adding all variables, you should see:
```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_SUPABASE_SERVICE_ROLE_KEY (if added)
```

---

## Step 5: Deploy

### 5.1 Start Deployment

1. Review all settings:
   - ✅ Framework: Vite
   - ✅ Root Directory: Correct path (if needed)
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `dist`
   - ✅ Environment Variables: All added
2. Click **"Deploy"** button

### 5.2 Wait for Deployment

Vercel will:
1. Install dependencies (`npm install`)
2. Build your project (`npm run build`)
3. Deploy to Vercel's CDN

This usually takes **2-5 minutes** for the first deployment.

### 5.3 Monitor Deployment

You can watch the deployment progress in real-time:
- Build logs will show in the deployment page
- You'll see each step of the build process
- Any errors will be displayed

---

## Step 6: Verify Deployment

### 6.1 Check Deployment Status

After deployment completes, you'll see:
- ✅ **"Ready"** status
- A URL like: `https://your-project-name.vercel.app`

### 6.2 Test Your Application

1. Click on the deployment URL
2. Test the following:
   - ✅ Homepage loads correctly
   - ✅ Navigation works
   - ✅ Login functionality works
   - ✅ Dashboard loads
   - ✅ All routes are accessible

### 6.3 Check for Errors

If something doesn't work:
1. Check the browser console for errors
2. Check Vercel deployment logs
3. Verify environment variables are set correctly
4. Check Supabase connection settings

---

## Step 7: Configure Supabase (Important!)

### 7.1 Update Supabase Allowed Origins

Your Supabase project needs to allow requests from your Vercel domain:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **"Additional Allowed Origins"**
5. Add your Vercel URL:
   - `https://your-project-name.vercel.app`
   - `https://*.vercel.app` (for preview deployments)
6. Click **"Save"**

### 7.2 Update RLS Policies (if needed)

If you have Row Level Security (RLS) enabled:
- Make sure your policies allow access from the Vercel domain
- Test database queries work correctly

---

## Step 8: Set Up Custom Domain (Optional)

### 8.1 Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Follow the DNS configuration instructions

### 8.2 Update Supabase Allowed Origins

After adding a custom domain:
1. Update Supabase allowed origins with your custom domain
2. Update environment variables if needed (usually not required)

---

## Step 9: Configure Automatic Deployments

### 9.1 How It Works

Vercel automatically deploys:
- **Production**: When you push to `main` or `master` branch
- **Preview**: When you push to any other branch or create a PR

### 9.2 Deployment Settings

1. Go to **Settings** → **Git**
2. Configure:
   - **Production Branch**: `main` (or `master`)
   - **Preview Deployments**: Enabled (default)
   - **Automatic Deployments**: Enabled (default)

### 9.3 Environment Variables per Branch

You can set different environment variables for:
- **Production**: Production branch deployments
- **Preview**: Preview deployments
- **Development**: Local development

---

## Step 10: Monitor and Maintain

### 10.1 View Deployments

- All deployments are listed in the **"Deployments"** tab
- Click on any deployment to see:
  - Build logs
  - Deployment URL
  - Status

### 10.2 View Analytics

- Go to **"Analytics"** tab to see:
  - Page views
  - Performance metrics
  - Core Web Vitals

### 10.3 View Logs

- Go to **"Logs"** tab to see:
  - Runtime logs
  - Error logs
  - Function logs

---

## Troubleshooting

### Issue: Build Fails

**Symptoms**: Build shows error in Vercel logs

**Solutions**:
1. Check build logs for specific errors
2. Verify `package.json` has all dependencies
3. Check Node.js version (should be 18+)
4. Verify build command is correct
5. Check for TypeScript errors locally: `npm run build`

### Issue: Environment Variables Not Working

**Symptoms**: App can't connect to Supabase

**Solutions**:
1. Verify all environment variables are set in Vercel
2. Check variable names match exactly (case-sensitive)
3. Ensure variables start with `VITE_` for client-side access
4. Redeploy after adding/changing variables
5. Check Supabase URL and keys are correct

### Issue: Routing Not Working

**Symptoms**: 404 errors on page refresh

**Solutions**:
1. Verify `vercel.json` is in the project root
2. Check SPA fallback is configured correctly
3. Verify all routes are set up correctly
4. Check `vercel.json` rewrites configuration

### Issue: Face Recognition Not Working

**Symptoms**: Camera access denied or models not loading

**Solutions**:
1. Ensure you're using HTTPS (Vercel provides this automatically)
2. Check browser console for errors
3. Verify camera permissions in browser
4. Check face-api.js models are in `public/models`
5. Verify models are loading correctly

### Issue: Slow Performance

**Symptoms**: App is slow to load

**Solutions**:
1. Check bundle size with `npm run build:analyze`
2. Verify lazy loading is working
3. Check network tab for slow requests
4. Verify caching is configured correctly
5. Check Core Web Vitals in Vercel Analytics

---

## Quick Reference

### Vercel Dashboard URLs
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Project Settings**: `https://vercel.com/[your-team]/[your-project]/settings`
- **Deployments**: `https://vercel.com/[your-team]/[your-project]/deployments`

### Important Commands
```bash
# Build locally
npm run build

# Analyze bundle
npm run build:analyze

# Preview production build
npm run preview

# Type check
npm run type-check
```

### Environment Variables Checklist
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` (optional)

### Supabase Configuration Checklist
- [ ] Allowed origins include Vercel domain
- [ ] RLS policies configured correctly
- [ ] Database migrations applied
- [ ] API keys are correct

---

## Next Steps After Deployment

1. ✅ **Test All Features**: Verify all functionality works
2. ✅ **Monitor Performance**: Check Core Web Vitals
3. ✅ **Set Up Analytics**: Enable Vercel Analytics
4. ✅ **Configure Custom Domain**: Add your domain (optional)
5. ✅ **Set Up Monitoring**: Configure error tracking (optional)

---

## Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Project Documentation**: See `DEPLOYMENT.md` in project root

---

## Success Checklist

After completing all steps, you should have:
- ✅ Project deployed to Vercel
- ✅ Environment variables configured
- ✅ Supabase connection working
- ✅ All routes accessible
- ✅ HTTPS enabled (automatic)
- ✅ Automatic deployments configured
- ✅ Custom domain (if configured)

---

**Congratulations!** 🎉 Your application is now live on Vercel!

If you encounter any issues, refer to the Troubleshooting section or check the deployment logs in Vercel.

---

**Last Updated**: Complete Vercel Setup Guide
**Status**: Ready for Deployment



