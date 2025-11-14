# AgriVet Landing Page

A modern, responsive landing page for AgriVet Integrated Management System built with React, TypeScript, and Vite.

## Features

- 🚀 Built with React 19 and TypeScript
- ⚡ Powered by Vite for fast development and optimized builds
- 🎨 Styled with Tailwind CSS
- 📱 Fully responsive design
- 🎭 Smooth animations with Framer Motion
- 🔗 React Router for navigation
- 🗄️ Supabase integration for data management

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [Vercel](https://vercel.com) and import your repository
3. Vercel will automatically detect the Vite framework
4. Add your environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

### Environment Variables

Make sure to set these environment variables in your Vercel project settings:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

You can find these in your Supabase project settings under API.

### Build Configuration

The project is optimized for Vercel with:

- ✅ Automatic SPA routing (all routes redirect to index.html)
- ✅ Optimized build output with code splitting
- ✅ Asset caching headers for better performance
- ✅ Production-optimized Vite configuration

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/          # Page components
├── lib/            # Utilities and Supabase client
├── assets/         # Images and static assets
└── hooks/          # Custom React hooks
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Performance Optimizations

- Code splitting for vendor libraries
- Optimized asset loading
- Tree shaking enabled
- Minified CSS and JavaScript
- Immutable caching for static assets

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - AgriVet Integrated Management System
