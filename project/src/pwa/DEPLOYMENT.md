# Vercel Deployment Guide

This project is a Vite-powered PWA that ships as a static build and can be deployed directly to Vercel. Follow the steps below to set up continuous deployment.

## 1. Project Setup

1. In Vercel, create a new project and import the repository.
2. When prompted for the *Root Directory*, select `project/src/pwa`.
3. Keep the default *Build & Output Settings* and let Vercel detect `npm`.

If you deploy manually via the CLI, run the following inside `project/src/pwa`:

```bash
npm install
npm run build
vercel deploy --prebuilt
```

## 2. Environment Variables

Add the required variables under **Settings → Environment Variables** in Vercel:

| Variable | Description |
| -------- | ----------- |
| `VITE_SUPABASE_URL` | Supabase project URL (starts with `https://...supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key. |
| `VITE_PRODUCTION_URL` or `VITE_SITE_URL` | **Required for OAuth redirects.** Set to your production domain (e.g., `https://tiongsononline.vercel.app`). This ensures Google OAuth and other OAuth providers redirect to the production domain instead of localhost. |
| `VITE_API_BASE_URL` | Base URL for your custom API (optional). |
| `VITE_GCASH_API_URL`, `VITE_PAYMAYA_API_URL` | Payment gateway endpoints (optional). |
| `VITE_SMS_API_URL`, `VITE_SMS_API_KEY` | SMS provider configuration (optional). |
| `VITE_ENABLE_OFFLINE_MODE`, `VITE_ENABLE_PUSH_NOTIFICATIONS`, `VITE_ENABLE_ANALYTICS` | Feature flags. |

> **Security note:** Never expose Supabase service-role keys or other server-only secrets in Vite `VITE_` variables. Anything prefixed with `VITE_` is bundled into the client.

> **OAuth Redirect Note:** For Google OAuth and other OAuth providers to work correctly in production, you must set `VITE_PRODUCTION_URL` (or `VITE_SITE_URL`) to your production domain (e.g., `https://tiongsononline.vercel.app`). This ensures that after successful OAuth authentication, users are redirected to your production domain and not localhost. Also, make sure this same URL is added to your Supabase project's allowed redirect URLs in the Supabase dashboard under Authentication → URL Configuration.

After saving the variables, trigger a redeploy so the build picks them up.

## 3. Build Configuration

- `npm run build` runs the Vite production build. Run `npm run type-check` locally if you want a full TypeScript pass.
- `vercel.json` configures the output directory (`dist`) and SPA routing so client-side routes work when directly accessed.
- `vite.config.ts` splits vendor chunks and minifies output with Terser. Errors are still surfaced in production builds.

## 4. Post-Deployment Checklist

- Visit the deployed URL and confirm that client-side navigation works (no 404s on refresh).
- Open the browser dev tools → Application tab → Service Workers to verify the PWA is installed and assets are cached.
- Check Supabase requests in the Network tab to confirm the environment variables are correctly wired.
- Optionally run `npm run preview` locally to mirror the production build before deploying.

With these steps complete, the PWA is ready for production on Vercel. Continuous deployments will trigger automatically whenever changes land in the tracked branch.

