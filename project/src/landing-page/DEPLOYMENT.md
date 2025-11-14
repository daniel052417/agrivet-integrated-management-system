# Vercel Deployment Checklist

## Pre-Deployment

- [ ] Ensure all environment variables are documented
- [ ] Test the build locally: `npm run build`
- [ ] Verify all routes work correctly
- [ ] Check that images and assets load properly
- [ ] Test on mobile devices

## Environment Variables Required

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Steps

### Via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Project**
   - Framework Preset: Vite (auto-detected)
   - Root Directory: `project/src/landing-page` (if deploying from monorepo)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Apply to: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live!

### Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time will ask for configuration)
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment

- [ ] Verify the site loads correctly
- [ ] Test all routes (/, /about, /contact, /products)
- [ ] Check that Supabase connections work
- [ ] Verify images and assets load
- [ ] Test on mobile devices
- [ ] Check browser console for errors
- [ ] Verify SEO meta tags are present

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## Performance Monitoring

- Vercel Analytics (optional): Enable in project settings
- Check build logs for any warnings
- Monitor bundle sizes in build output

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles without errors
- Check that environment variables are set

### Routes Not Working

- Verify `vercel.json` has the rewrite rule
- Check that React Router is configured correctly
- Ensure all routes are defined in `App.tsx`

### Environment Variables Not Working

- Verify variables start with `VITE_` prefix
- Check that variables are set for the correct environment
- Rebuild the project after adding variables

### Assets Not Loading

- Check that assets are in the `public` folder
- Verify asset paths in code use relative paths
- Check browser console for 404 errors

## Optimization Tips

- Images: Use WebP format and optimize sizes
- Fonts: Use `font-display: swap` for better loading
- Code Splitting: Already configured in `vite.config.ts`
- Caching: Headers configured in `vercel.json`

## Support

For issues or questions:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Check Vite documentation for build issues

