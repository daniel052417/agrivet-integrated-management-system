const { query, testConnection } = require('../config/database');
const logger = require('../config/logger');

// Database migration script
const migrate = async () => {
  try {
    logger.info('Starting database migration...');
    
    // Test database connection
    await testConnection();
    
    // Create PWA-specific tables if they don't exist
    const migrations = [
      // PWA Sessions table
      `
        CREATE TABLE IF NOT EXISTS pwa_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR(255) UNIQUE NOT NULL,
          branch_id UUID REFERENCES branches(id),
          customer_id UUID REFERENCES customers(id),
          is_guest BOOLEAN DEFAULT false,
          cart_data JSONB,
          dismissed_banners JSONB DEFAULT '[]',
          modal_shown JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `,
      
      // PWA Analytics table
      `
        CREATE TABLE IF NOT EXISTS pwa_analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR(255) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          event_data JSONB NOT NULL,
          branch_id UUID REFERENCES branches(id),
          customer_id UUID REFERENCES customers(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      
      // Notifications table
      `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID REFERENCES customers(id),
          title VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          data JSONB,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      
      // Branch Operating Hours table
      `
        CREATE TABLE IF NOT EXISTS branch_operating_hours (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          is_open BOOLEAN DEFAULT true,
          open_time TIME,
          close_time TIME,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(branch_id, day_of_week)
        );
      `,
      
      // Promotion Usage table
      `
        CREATE TABLE IF NOT EXISTS promotion_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
          customer_id UUID REFERENCES customers(id),
          order_id UUID REFERENCES orders(id),
          used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(promotion_id, customer_id, order_id)
        );
      `,
      
      // Promotion Products table
      `
        CREATE TABLE IF NOT EXISTS promotion_products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(promotion_id, product_id),
          UNIQUE(promotion_id, category_id)
        );
      `,
      
      // Promotion Branches table
      `
        CREATE TABLE IF NOT EXISTS promotion_branches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
          branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(promotion_id, branch_id)
        );
      `
    ];
    
    // Execute migrations
    for (let i = 0; i < migrations.length; i++) {
      try {
        await query(migrations[i]);
        logger.info(`Migration ${i + 1} completed successfully`);
      } catch (error) {
        if (error.code === '42P07') { // Table already exists
          logger.info(`Migration ${i + 1} skipped - table already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_pwa_sessions_session_id ON pwa_sessions(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_pwa_sessions_expires_at ON pwa_sessions(expires_at);',
      'CREATE INDEX IF NOT EXISTS idx_pwa_analytics_session_id ON pwa_analytics(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_pwa_analytics_event_type ON pwa_analytics(event_type);',
      'CREATE INDEX IF NOT EXISTS idx_pwa_analytics_created_at ON pwa_analytics(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);',
      'CREATE INDEX IF NOT EXISTS idx_branch_operating_hours_branch_id ON branch_operating_hours(branch_id);',
      'CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion_id ON promotion_usage(promotion_id);',
      'CREATE INDEX IF NOT EXISTS idx_promotion_usage_customer_id ON promotion_usage(customer_id);',
      'CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion_id ON promotion_products(promotion_id);',
      'CREATE INDEX IF NOT EXISTS idx_promotion_branches_promotion_id ON promotion_branches(promotion_id);'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await query(indexQuery);
        logger.info('Index created successfully');
      } catch (error) {
        logger.warn('Index creation failed:', error.message);
      }
    }
    
    logger.info('Database migration completed successfully');
    
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      logger.info('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };











