# 🚀 Deployment Guide for Vercel

This guide will help you deploy the Agrivet Integrated Management System to Vercel.

## Prerequisites

- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Supabase project with database configured
- [ ] GitHub/GitLab/Bitbucket repository (recommended)

## Step 1: Environment Variables Setup

### Local Development
1. Create a `.env.local` file in the project root
2. Copy the template from `ENV_TEMPLATE.md`
3. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Production**, **Preview**, and **Development**:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `VITE_SUPABASE_URL` | Your Supabase URL | All |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key | All |
   | `VITE_SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key (optional) | All |

4. Click **Save** for each variable

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `agrivet-integrated-management-system/project` (if your repo has subdirectories)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add environment variables (from Step 1)
5. Click **Deploy**

### Option B: Deploy via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login to Vercel:
   ```bash
   vercel login
   ```
3. Navigate to project directory:
   ```bash
   cd agrivet-integrated-management-system/project
   ```
4. Deploy:
   ```bash
   vercel
   ```
5. Follow the prompts to configure your project
6. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Verify Deployment

After deployment, verify the following:

1. **Homepage loads**: Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. **Routes work**: Test navigation to different routes
3. **Authentication works**: Test login/logout functionality
4. **Database connection**: Verify Supabase connection is working
5. **Face recognition**: Test face registration and attendance terminal (requires HTTPS)

## Step 4: Post-Deployment Configuration

### 1. Supabase Configuration
- Update Supabase allowed origins to include your Vercel domain
- Go to Supabase Dashboard → Settings → API → Add your Vercel URL to allowed origins

### 2. Custom Domain (Optional)
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase allowed origins with your custom domain

### 3. Environment-Specific Variables
If you have different Supabase projects for dev/staging/production:
- Set different environment variables for each environment in Vercel
- Production: Use production Supabase project
- Preview: Use staging Supabase project
- Development: Use dev Supabase project

## Step 5: Performance Optimization

### Bundle Analysis
To analyze your bundle size:
```bash
npm run build:analyze
```
This will generate a `dist/stats.html` file showing bundle composition.

### Monitoring
- Enable Vercel Analytics in project settings
- Monitor Core Web Vitals in Vercel dashboard
- Set up error tracking (optional: Sentry integration)

## Troubleshooting

### Build Fails
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Check Node.js version (should be 18+)
4. Ensure `package.json` scripts are correct

### Environment Variables Not Working
1. Verify variables are set in correct environment (Production/Preview/Development)
2. Redeploy after adding/changing variables
3. Check variable names start with `VITE_` for client-side access

### Routing Issues
1. Verify `vercel.json` is in the project root
2. Check that SPA fallback is configured correctly
3. Test all routes after deployment

### Database Connection Issues
1. Verify Supabase URL and keys are correct
2. Check Supabase allowed origins include your Vercel domain
3. Verify RLS (Row Level Security) policies are configured correctly

### Face Recognition Not Working
1. Ensure you're using HTTPS (Vercel provides this automatically)
2. Check camera permissions in browser
3. Verify face-api.js models are loading correctly
4. Check browser console for errors

## Performance Metrics

After deployment, you should see:
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 85
- **Bundle Size**: < 1.2MB (gzipped)

## Next Steps

1. ✅ Set up monitoring and error tracking
2. ✅ Configure custom domain (optional)
3. ✅ Set up CI/CD for automated deployments
4. ✅ Enable Vercel Analytics
5. ✅ Set up staging environment for testing

## Support

For issues or questions:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review project logs in Vercel dashboard

---

**Last Updated**: Phase 1 Optimization Complete



