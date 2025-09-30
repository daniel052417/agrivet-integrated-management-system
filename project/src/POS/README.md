# AgriVet POS System

A comprehensive Point of Sale system designed specifically for agrivet/feed stores with offline capability, built using React + Tailwind CSS.

## 🚀 Features

### Core POS Features
- **Quick Product Search**: Barcode scanning, SKU search, and name-based search
- **Multiple Payment Methods**: Cash, GCash, PayMaya support
- **Tax Handling**: Automatic VAT calculation (12%)
- **Receipt Printing**: Physical receipt printing with BIR-compliant format
- **Offline Capability**: Works without internet connection, syncs when online

### Inventory Management
- **Real-time Stock Tracking**: Automatic stock deduction after sales
- **Low Stock Alerts**: Configurable thresholds with visual indicators
- **Batch/Expiry Tracking**: Track product batches and expiration dates
- **Multi-branch Support**: View stock across different branches
- **Inventory Valuation**: Real-time inventory value calculation

### Customer Management
- **Customer Profiles**: Complete customer information management
- **Loyalty Points System**: Track and manage customer loyalty points
- **Purchase History**: Complete transaction history per customer
- **Customer Analytics**: Insights into customer behavior

### User Management & Security
- **Role-based Access Control**: Different permission levels for different roles
- **Shift Tracking**: Monitor staff shifts and performance
- **Two-factor Authentication**: Enhanced security for login
- **Auto-logout**: Automatic session timeout for security
- **Audit Logs**: Complete activity tracking

### Reporting & Analytics
- **Daily Sales Summary**: Comprehensive daily sales reports
- **Inventory Valuation**: Current inventory value and cost analysis
- **Tax/VAT Reports**: BIR-compliant tax reporting
- **Staff Performance**: Sales performance by staff member
- **Export Capabilities**: CSV, Excel, and PDF export options

### User Experience
- **Touch-friendly Interface**: Large buttons optimized for tablets
- **Keyboard Shortcuts**: Quick access to common functions
- **Responsive Design**: Works on tablets, mobile, and desktop
- **Dark/Light Mode**: User preference support
- **Minimal Steps**: Streamlined checkout process

## 📁 Project Structure

```
src/POS/
├── App.tsx                          # Main POS application component
├── layouts/
│   └── POSLayout.tsx               # Main layout with navigation
├── screens/
│   ├── CashierScreen.tsx           # Main cashier interface
│   ├── InventoryScreen.tsx         # Inventory management
│   ├── CustomerScreen.tsx          # Customer management
│   ├── UserManagementScreen.tsx    # User and role management
│   └── ReportsScreen.tsx           # Reports and analytics
├── components/
│   └── shared/
│       ├── TouchButton.tsx         # Touch-friendly button component
│       ├── Modal.tsx               # Reusable modal component
│       ├── ProductCard.tsx         # Product display card
│       ├── KeyboardShortcuts.tsx   # Keyboard shortcut handler
│       ├── ReceiptPrinter.tsx      # Receipt printing component
│       └── OfflineIndicator.tsx    # Online/offline status indicator
└── README.md                       # This documentation
```

## 🎨 Design Principles

### Touch-Friendly Interface
- **Large Buttons**: Minimum 44px touch targets
- **Generous Spacing**: Adequate spacing between interactive elements
- **Clear Visual Hierarchy**: Easy to scan and navigate
- **High Contrast**: Excellent readability in various lighting conditions

### Responsive Design
- **Mobile First**: Optimized for mobile and tablet use
- **Flexible Grid**: Adapts to different screen sizes
- **Touch Gestures**: Swipe, pinch, and tap gestures supported
- **Orientation Support**: Works in both portrait and landscape

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Mode**: Support for high contrast displays
- **Font Scaling**: Respects user font size preferences

## 🛠 Technical Implementation

### State Management
- **React Hooks**: useState, useEffect for local state
- **Context API**: For global state management
- **Local Storage**: For offline data persistence
- **IndexedDB**: For complex offline data storage

### Performance Optimizations
- **Code Splitting**: Lazy loading of screens
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large product lists
- **Image Optimization**: Lazy loading and compression

### Offline Capabilities
- **Service Worker**: Background sync and caching
- **IndexedDB**: Local database for offline storage
- **Sync Queue**: Queued operations for when online
- **Conflict Resolution**: Handle data conflicts on sync

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern web browser
- Printer (for receipt printing)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Configuration
1. **Database Setup**: Configure Supabase connection
2. **Printer Setup**: Install printer drivers and configure
3. **Payment Gateway**: Configure GCash/PayMaya integration
4. **Tax Settings**: Set up VAT rates and tax configuration

## 📱 Usage Guide

### Cashier Workflow
1. **Start Sale**: Click "New Sale" or press F1
2. **Add Products**: Scan barcode or search for products
3. **Apply Discounts**: Use discount codes or manual discounts
4. **Select Customer**: Choose existing or add new customer
5. **Process Payment**: Select payment method and complete
6. **Print Receipt**: Print physical receipt

### Inventory Management
1. **View Stock**: Check current inventory levels
2. **Low Stock Alerts**: Review items needing restocking
3. **Add Products**: Add new products to inventory
4. **Update Stock**: Adjust stock levels manually
5. **Batch Tracking**: Monitor product batches and expiry

### Customer Management
1. **Add Customer**: Create new customer profiles
2. **View History**: Check customer purchase history
3. **Loyalty Points**: Manage points and rewards
4. **Customer Analytics**: View customer insights

### Reports
1. **Select Report Type**: Choose from available reports
2. **Set Date Range**: Specify time period
3. **Generate Report**: Create and view report
4. **Export Data**: Download in preferred format

## 🔧 Customization

### Theming
- **Colors**: Modify Tailwind color palette
- **Fonts**: Change typography settings
- **Spacing**: Adjust component spacing
- **Animations**: Customize transition effects

### Features
- **Payment Methods**: Add new payment options
- **Tax Rates**: Configure different tax rates
- **Loyalty System**: Customize points and rewards
- **Reports**: Add custom report types

## 🐛 Troubleshooting

### Common Issues
1. **Printer Not Working**: Check printer drivers and connection
2. **Offline Sync Issues**: Clear cache and retry sync
3. **Performance Issues**: Check browser memory usage
4. **Touch Issues**: Ensure proper touch target sizes

### Support
- **Documentation**: Check this README and inline comments
- **Logs**: Check browser console for errors
- **Network**: Verify internet connection for online features

## 🔒 Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted
- **Access Control**: Role-based permissions
- **Audit Logs**: Complete activity tracking
- **Data Backup**: Regular automated backups

### Compliance
- **GDPR**: Privacy-focused data handling
- **BIR Compliance**: Tax reporting requirements
- **PCI DSS**: Payment card data security
- **Local Regulations**: Compliance with local laws

## 📈 Performance Metrics

### Target Performance
- **Page Load**: < 2 seconds
- **Touch Response**: < 100ms
- **Search Results**: < 500ms
- **Offline Sync**: < 5 seconds

### Monitoring
- **Real-time Metrics**: Performance monitoring
- **Error Tracking**: Automatic error reporting
- **User Analytics**: Usage pattern analysis
- **System Health**: Resource usage monitoring

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow ESLint configuration
2. **Testing**: Write tests for new features
3. **Documentation**: Update docs for changes
4. **Performance**: Optimize for mobile devices

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Team**: For the amazing framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Lucide Icons**: For the beautiful icon set
- **AgriVet Community**: For feedback and suggestions

---

**Built with ❤️ for the AgriVet community**







