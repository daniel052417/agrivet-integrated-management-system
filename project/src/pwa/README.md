# AgriVet Kiosk PWA

A Progressive Web Application (PWA) for AgriVet's online kiosk system, enabling customers to browse products, place orders, and make payments through their mobile devices.

## 🚀 Features

### Phase 1 (Current)
- ✅ **PWA Setup**: Service worker, manifest, offline capabilities
- ✅ **Branch Selection**: Customer chooses branch before browsing
- ✅ **Product Catalog**: Browse products with search and filters
- ✅ **Shopping Cart**: Add/remove items, quantity management
- ✅ **Responsive Design**: Mobile-first, touch-friendly interface

### Phase 2 (Planned)
- 🔄 **Guest Checkout**: OTP verification system
- 🔄 **Customer Registration**: Integration with existing user system
- 🔄 **Order Management**: Admin interface for order processing

### Phase 3 (Planned)
- 🔄 **Payment Integration**: GCash and PayMaya support
- 🔄 **Order Tracking**: Real-time status updates
- 🔄 **Notifications**: SMS/Email confirmations

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Database**: PostgreSQL with provided schema
- **PWA**: Vite PWA Plugin + Workbox
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **Consistency**: Same backend stack as main application

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── catalog/        # Product catalog components
│   ├── cart/           # Shopping cart components
│   ├── checkout/       # Checkout flow components
│   ├── common/         # Shared components
│   └── layout/         # Layout components
├── contexts/           # React Context providers
├── layouts/            # Page layouts
├── pages/              # Route components
├── services/           # API services
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone and navigate to PWA directory**
   ```bash
   cd project/src/pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📱 PWA Features

### Installation
- **Mobile**: Add to home screen via browser menu
- **Desktop**: Install prompt appears automatically
- **Offline**: Works without internet connection

### Offline Capabilities
- Cached product catalog
- Offline cart functionality
- Service worker for background sync
- Graceful degradation when offline

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_NAME=AgriVet Kiosk
VITE_ENABLE_OFFLINE_MODE=true
```

### PWA Settings
- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Icons**: `public/pwa-*.png`

## 🎨 Styling

### Design System
- **Colors**: AgriVet green theme (`#10b981`)
- **Typography**: Inter font family
- **Components**: Tailwind CSS with custom classes
- **Icons**: Lucide React

### Custom Classes
```css
.btn-primary     # Primary button style
.btn-secondary   # Secondary button style
.btn-outline     # Outline button style
.card           # Card container
.input-field    # Form input styling
.product-card   # Product display card
```

## 🔌 Integration

### Backend Integration
- **Supabase**: Database and real-time subscriptions
- **Authentication**: Guest checkout (Phase 2)
- **Payments**: GCash/PayMaya APIs (Phase 3)

### Data Flow
1. **Branch Selection** → Load products for selected branch
2. **Product Catalog** → Real-time inventory updates
3. **Shopping Cart** → Local storage + context state
4. **Checkout** → Order creation + payment processing

## 📊 Performance

### Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format, lazy loading
- **Caching**: Service worker with Workbox
- **Bundle Size**: Tree shaking, minification

### Metrics
- **Lighthouse Score**: 90+ (PWA, Performance, Accessibility)
- **First Contentful Paint**: < 2s
- **Time to Interactive**: < 3s

## 🧪 Testing

### Test Commands
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run build         # Production build
```

### Testing Strategy
- **Unit Tests**: Component testing (planned)
- **Integration Tests**: API integration (planned)
- **E2E Tests**: User flow testing (planned)

## 🚀 Deployment

### Build Process
1. **Development**: `npm run dev`
2. **Production**: `npm run build`
3. **Preview**: `npm run preview`

### Hosting Options
- **Vercel**: Recommended for easy deployment
- **Netlify**: Good PWA support
- **Firebase Hosting**: Google ecosystem integration

## 📱 Mobile Optimization

### Touch Interface
- **Large Touch Targets**: 44px minimum
- **Swipe Gestures**: Product navigation
- **Haptic Feedback**: Button interactions
- **Orientation**: Portrait/landscape support

### Performance
- **Fast Loading**: Optimized images and code
- **Smooth Animations**: 60fps transitions
- **Battery Efficient**: Minimal background processing

## 🔒 Security

### Data Protection
- **HTTPS Only**: Secure connections
- **Input Validation**: Client and server-side
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: Token-based validation

## 📈 Analytics

### Tracking (Phase 3)
- **User Behavior**: Page views, interactions
- **Conversion**: Cart abandonment, checkout completion
- **Performance**: Load times, error rates
- **Business**: Order values, popular products

## 🤝 Contributing

### Development Workflow
1. **Feature Branch**: Create from `main`
2. **Development**: Implement features
3. **Testing**: Run tests and linting
4. **Pull Request**: Submit for review
5. **Deploy**: Merge to `main`

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Conventional Commits**: Commit messages

## 📞 Support

### Documentation
- **API Docs**: `/docs/api`
- **Component Docs**: Storybook (planned)
- **Deployment Guide**: `/docs/deployment`

### Contact
- **Email**: dev@agrivet.com
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 📄 License

This project is proprietary software owned by AgriVet. All rights reserved.

---

**Built with ❤️ for AgriVet customers**
