const { query } = require('../config/database');
const logger = require('../config/logger');

// Database seeding script
const seed = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Check if data already exists
    const existingBranches = await query('SELECT COUNT(*) as count FROM branches');
    if (parseInt(existingBranches.rows[0].count) > 0) {
      logger.info('Database already seeded, skipping...');
      return;
    }
    
    // Seed branches
    const branches = [
      {
        name: 'Main Branch',
        code: 'MAIN',
        address: '123 Main Street, Quezon City',
        city: 'Quezon City',
        province: 'Metro Manila',
        postal_code: '1100',
        phone: '+63-2-1234-5678',
        email: 'main@agrivet.com',
        branch_type: 'main'
      },
      {
        name: 'Makati Branch',
        code: 'MAKATI',
        address: '456 Ayala Avenue, Makati City',
        city: 'Makati City',
        province: 'Metro Manila',
        postal_code: '1200',
        phone: '+63-2-2345-6789',
        email: 'makati@agrivet.com',
        branch_type: 'satellite'
      },
      {
        name: 'Cebu Branch',
        code: 'CEBU',
        address: '789 Colon Street, Cebu City',
        city: 'Cebu City',
        province: 'Cebu',
        postal_code: '6000',
        phone: '+63-32-3456-7890',
        email: 'cebu@agrivet.com',
        branch_type: 'satellite'
      }
    ];
    
    for (const branch of branches) {
      await query(`
        INSERT INTO branches (name, code, address, city, province, postal_code, phone, email, branch_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        branch.name, branch.code, branch.address, branch.city,
        branch.province, branch.postal_code, branch.phone, branch.email, branch.branch_type
      ]);
    }
    
    // Seed categories
    const categories = [
      { name: 'Pet Food', description: 'Dog and cat food products', sort_order: 1 },
      { name: 'Pet Accessories', description: 'Collars, leashes, toys, and other accessories', sort_order: 2 },
      { name: 'Pet Health', description: 'Medicines, supplements, and health products', sort_order: 3 },
      { name: 'Farm Supplies', description: 'Agricultural and farming supplies', sort_order: 4 },
      { name: 'Veterinary Equipment', description: 'Medical equipment for veterinarians', sort_order: 5 }
    ];
    
    for (const category of categories) {
      await query(`
        INSERT INTO categories (name, description, sort_order)
        VALUES ($1, $2, $3)
      `, [category.name, category.description, category.sort_order]);
    }
    
    // Seed suppliers
    const suppliers = [
      {
        name: 'Pet Food Co.',
        code: 'PFC001',
        contact_person: 'John Smith',
        email: 'john@petfoodco.com',
        phone: '+63-2-1111-2222',
        address: '123 Pet Food Street, Manila'
      },
      {
        name: 'Vet Supplies Inc.',
        code: 'VSI001',
        contact_person: 'Jane Doe',
        email: 'jane@vetsupplies.com',
        phone: '+63-2-3333-4444',
        address: '456 Vet Street, Quezon City'
      }
    ];
    
    for (const supplier of suppliers) {
      await query(`
        INSERT INTO suppliers (name, code, contact_person, email, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        supplier.name, supplier.code, supplier.contact_person,
        supplier.email, supplier.phone, supplier.address
      ]);
    }
    
    // Get created IDs for relationships
    const branchResult = await query('SELECT id, code FROM branches');
    const categoryResult = await query('SELECT id, name FROM categories');
    const supplierResult = await query('SELECT id, code FROM suppliers');
    
    const branchesMap = {};
    const categoriesMap = {};
    const suppliersMap = {};
    
    branchResult.rows.forEach(row => {
      branchesMap[row.code] = row.id;
    });
    
    categoryResult.rows.forEach(row => {
      categoriesMap[row.name] = row.id;
    });
    
    supplierResult.rows.forEach(row => {
      suppliersMap[row.code] = row.id;
    });
    
    // Seed products
    const products = [
      {
        sku: 'PF001',
        name: 'Premium Dog Food',
        description: 'High-quality dog food for all breeds',
        category_id: categoriesMap['Pet Food'],
        brand: 'PetFood Co.',
        unit_of_measure: 'kg',
        weight: 5.0,
        is_prescription_required: false,
        supplier_id: suppliersMap['PFC001']
      },
      {
        sku: 'PA001',
        name: 'Dog Collar',
        description: 'Adjustable leather dog collar',
        category_id: categoriesMap['Pet Accessories'],
        brand: 'PetAccessories',
        unit_of_measure: 'piece',
        weight: 0.2,
        is_prescription_required: false,
        supplier_id: suppliersMap['VSI001']
      },
      {
        sku: 'PH001',
        name: 'Dog Vitamins',
        description: 'Multivitamin supplement for dogs',
        category_id: categoriesMap['Pet Health'],
        brand: 'VetHealth',
        unit_of_measure: 'bottle',
        weight: 0.5,
        is_prescription_required: true,
        supplier_id: suppliersMap['VSI001']
      }
    ];
    
    for (const product of products) {
      await query(`
        INSERT INTO products (sku, name, description, category_id, brand, unit_of_measure, weight, is_prescription_required, supplier_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        product.sku, product.name, product.description, product.category_id,
        product.brand, product.unit_of_measure, product.weight,
        product.is_prescription_required, product.supplier_id
      ]);
    }
    
    // Get product IDs
    const productResult = await query('SELECT id, sku FROM products');
    const productsMap = {};
    productResult.rows.forEach(row => {
      productsMap[row.sku] = row.id;
    });
    
    // Seed product variants
    const productVariants = [
      {
        product_id: productsMap['PF001'],
        sku: 'PF001-5KG',
        name: 'Premium Dog Food 5kg',
        variant_type: 'size',
        variant_value: '5kg',
        price: 500.00,
        cost: 300.00,
        stock_quantity: 100,
        minimum_stock: 10,
        maximum_stock: 200,
        weight_per_unit: 5.0,
        barcode: '1234567890123'
      },
      {
        product_id: productsMap['PA001'],
        sku: 'PA001-SM',
        name: 'Dog Collar Small',
        variant_type: 'size',
        variant_value: 'Small',
        price: 150.00,
        cost: 75.00,
        stock_quantity: 50,
        minimum_stock: 5,
        maximum_stock: 100,
        weight_per_unit: 0.2,
        barcode: '1234567890124'
      },
      {
        product_id: productsMap['PH001'],
        sku: 'PH001-100T',
        name: 'Dog Vitamins 100 tablets',
        variant_type: 'size',
        variant_value: '100 tablets',
        price: 250.00,
        cost: 150.00,
        stock_quantity: 30,
        minimum_stock: 5,
        maximum_stock: 50,
        weight_per_unit: 0.5,
        barcode: '1234567890125'
      }
    ];
    
    for (const variant of productVariants) {
      await query(`
        INSERT INTO product_variants (product_id, sku, name, variant_type, variant_value, price, cost, stock_quantity, minimum_stock, maximum_stock, weight_per_unit, barcode)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        variant.product_id, variant.sku, variant.name, variant.variant_type,
        variant.variant_value, variant.price, variant.cost, variant.stock_quantity,
        variant.minimum_stock, variant.maximum_stock, variant.weight_per_unit, variant.barcode
      ]);
    }
    
    // Get variant IDs
    const variantResult = await query('SELECT id, sku FROM product_variants');
    const variantsMap = {};
    variantResult.rows.forEach(row => {
      variantsMap[row.sku] = row.id;
    });
    
    // Seed inventory for each branch
    for (const branchCode of Object.keys(branchesMap)) {
      const branchId = branchesMap[branchCode];
      
      for (const variantSku of Object.keys(variantsMap)) {
        const variantId = variantsMap[variantSku];
        const stockQuantity = Math.floor(Math.random() * 100) + 10; // Random stock between 10-110
        
        await query(`
          INSERT INTO inventory (product_variant_id, branch_id, quantity_on_hand, quantity_available, quantity_reserved)
          VALUES ($1, $2, $3, $3, 0)
        `, [variantId, branchId, stockQuantity]);
      }
    }
    
    // Seed branch operating hours
    for (const branchCode of Object.keys(branchesMap)) {
      const branchId = branchesMap[branchCode];
      
      // Monday to Friday: 8 AM - 8 PM
      for (let day = 1; day <= 5; day++) {
        await query(`
          INSERT INTO branch_operating_hours (branch_id, day_of_week, is_open, open_time, close_time)
          VALUES ($1, $2, true, '08:00', '20:00')
        `, [branchId, day]);
      }
      
      // Saturday: 8 AM - 6 PM
      await query(`
        INSERT INTO branch_operating_hours (branch_id, day_of_week, is_open, open_time, close_time)
        VALUES ($1, 6, true, '08:00', '18:00')
      `, [branchId]);
      
      // Sunday: Closed
      await query(`
        INSERT INTO branch_operating_hours (branch_id, day_of_week, is_open, open_time, close_time)
        VALUES ($1, 0, false, NULL, NULL)
      `, [branchId]);
    }
    
    // Seed sample promotions
    const promotions = [
      {
        name: 'New Customer Discount',
        code: 'WELCOME10',
        type: 'percentage',
        discount_value: 10,
        minimum_amount: 500,
        usage_limit: 1000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        applies_to: 'all'
      },
      {
        name: 'Pet Food Sale',
        code: 'PETFOOD20',
        type: 'percentage',
        discount_value: 20,
        minimum_amount: 1000,
        usage_limit: 500,
        start_date: new Date(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        applies_to: 'products'
      }
    ];
    
    for (const promotion of promotions) {
      await query(`
        INSERT INTO promotions (name, code, type, discount_value, minimum_amount, usage_limit, start_date, end_date, applies_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        promotion.name, promotion.code, promotion.type, promotion.discount_value,
        promotion.minimum_amount, promotion.usage_limit, promotion.start_date,
        promotion.end_date, promotion.applies_to
      ]);
    }
    
    logger.info('Database seeding completed successfully');
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seed()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seed };











