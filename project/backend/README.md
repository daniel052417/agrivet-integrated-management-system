# AgriVet PWA Backend API

A comprehensive backend API for the AgriVet PWA (Progressive Web Application) built with Node.js, Express, and PostgreSQL.

## Features

- **Branch Management**: Complete branch operations with operating hours and availability
- **Product Catalog**: Product variants, inventory management, and search functionality
- **Customer Management**: Customer and guest customer support with loyalty system
- **Order Processing**: Full order lifecycle with inventory management
- **Promotional System**: Advanced promotion management with validation
- **PWA Support**: Session management, analytics, and caching
- **Real-time Features**: Push notifications and live updates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   - Ensure PostgreSQL is running
   - Create the database: `agrivet_pwa`
   - Run the SQL schema files you provided

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrivet_pwa
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## API Endpoints

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `GET /api/branches/availability` - Get branch availability status
- `POST /api/branches` - Create new branch

### Products
- `GET /api/products/:branchId` - Get products for branch
- `GET /api/products/categories` - Get product categories
- `GET /api/products/search/:branchId` - Search products
- `GET /api/products/:branchId/:productId` - Get product details

### Customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `POST /api/customers/guest` - Create guest customer
- `GET /api/customers/search` - Search customers

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/branch/:branchId` - Get orders by branch

### PWA
- `POST /api/pwa/sessions` - Create/update PWA session
- `GET /api/pwa/sessions/:sessionId` - Get PWA session
- `POST /api/pwa/analytics/track` - Track PWA event
- `GET /api/pwa/analytics` - Get analytics data

### Promotions
- `GET /api/promotions/active` - Get active promotions
- `GET /api/promotions/banners` - Get banner promotions
- `POST /api/promotions/:promotionId/apply` - Apply promotion

## Database Schema

The backend uses the database tables you provided:

- **branches** - Branch information and operating hours
- **products** - Product catalog and variants
- **customers** - Customer and guest management
- **orders** - Order processing and tracking
- **promotions** - Promotional campaigns and discounts
- **pwa_sessions** - PWA session management
- **pwa_analytics** - PWA usage analytics
- **notifications** - Push notification system

## PWA Integration

The backend is specifically designed to support PWA functionality:

1. **Session Management**: Persistent sessions for offline/online sync
2. **Analytics**: Event tracking for user behavior analysis
3. **Caching**: Redis-based caching for improved performance
4. **Notifications**: Push notification support
5. **Real-time Updates**: Live order status and inventory updates

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Database Errors**: Proper handling of PostgreSQL errors
- **Rate Limiting**: Protection against abuse
- **Security**: CORS, Helmet, and input sanitization

## Rate Limiting

- **Standard Endpoints**: 100 requests per 15 minutes
- **PWA Endpoints**: 200 requests per 5 minutes
- **Order Creation**: 5 requests per minute
- **Redis-based**: Distributed rate limiting support

## Monitoring and Logging

- **Winston Logger**: Structured logging with different levels
- **Request Logging**: Morgan for HTTP request logging
- **Error Tracking**: Comprehensive error logging and monitoring
- **Health Checks**: `/health` endpoint for monitoring

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Redis for caching
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure monitoring and logging

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## Performance Optimizations

- **Redis Caching**: Frequently accessed data caching
- **Connection Pooling**: Database connection optimization
- **Compression**: Gzip compression for responses
- **Query Optimization**: Efficient database queries
- **Indexing**: Database indexes for fast lookups

## Support

For support and questions, please refer to the main project documentation or contact the development team.
















