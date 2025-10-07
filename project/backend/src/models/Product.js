const { query } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

class Product {
  constructor(data) {
    this.id = data.id;
    this.sku = data.sku;
    this.name = data.name;
    this.description = data.description;
    this.category_id = data.category_id;
    this.brand = data.brand;
    this.unit_of_measure = data.unit_of_measure;
    this.weight = data.weight;
    this.dimensions = data.dimensions;
    this.is_prescription_required = data.is_prescription_required;
    this.is_active = data.is_active;
    this.barcode = data.barcode;
    this.supplier_id = data.supplier_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}

class ProductVariant {
  constructor(data) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.sku = data.sku;
    this.name = data.name;
    this.variant_type = data.variant_type;
    this.variant_value = data.variant_value;
    this.price = data.price;
    this.cost = data.cost;
    this.is_active = data.is_active;
    this.stock_quantity = data.stock_quantity;
    this.minimum_stock = data.minimum_stock;
    this.maximum_stock = data.maximum_stock;
    this.pos_pricing_type = data.pos_pricing_type;
    this.weight_per_unit = data.weight_per_unit;
    this.bulk_discount_threshold = data.bulk_discount_threshold;
    this.bulk_discount_percentage = data.bulk_discount_percentage;
    this.requires_expiry_date = data.requires_expiry_date;
    this.requires_batch_tracking = data.requires_batch_tracking;
    this.is_quick_sale = data.is_quick_sale;
    this.barcode = data.barcode;
    this.expiry_date = data.expiry_date;
    this.batch_number = data.batch_number;
    this.image_url = data.image_url;
    this.created_at = data.created_at;
  }
}

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.parent_id = data.parent_id;
    this.sort_order = data.sort_order;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
  }
}

// Product Service
class ProductService {
  // Get products with variants for a specific branch
  static async getProducts(branchId, filters = {}, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const cacheKey = `products:${branchId}:${JSON.stringify(filters)}:${page}:${limit}`;
      let result = await cache.get(cacheKey);
      
      if (!result) {
        let whereConditions = [
          'pv.is_active = true',
          'p.is_active = true',
          'c.is_active = true',
          'i.branch_id = $1',
          'i.quantity_available > 0'
        ];
        
        const queryParams = [branchId];
        let paramCount = 1;
        
        // Apply filters
        if (filters.category) {
          paramCount++;
          whereConditions.push(`p.category_id = $${paramCount}`);
          queryParams.push(filters.category);
        }
        
        if (filters.priceMin) {
          paramCount++;
          whereConditions.push(`pv.price >= $${paramCount}`);
          queryParams.push(filters.priceMin);
        }
        
        if (filters.priceMax) {
          paramCount++;
          whereConditions.push(`pv.price <= $${paramCount}`);
          queryParams.push(filters.priceMax);
        }
        
        if (filters.searchQuery) {
          paramCount++;
          whereConditions.push(`(pv.name ILIKE $${paramCount} OR p.name ILIKE $${paramCount} OR pv.sku ILIKE $${paramCount})`);
          queryParams.push(`%${filters.searchQuery}%`);
        }
        
        if (filters.inStock !== undefined) {
          if (filters.inStock) {
            whereConditions.push('i.quantity_available > 0');
          } else {
            whereConditions.push('i.quantity_available <= 0');
          }
        }
        
        // Get total count
        const countQuery = `
          SELECT COUNT(*) as total
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          JOIN inventory i ON pv.id = i.product_variant_id
          WHERE ${whereConditions.join(' AND ')}
        `;
        
        const countResult = await query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);
        
        // Get products
        paramCount++;
        queryParams.push(limit);
        paramCount++;
        queryParams.push(offset);
        
        const productsQuery = `
          SELECT 
            pv.*,
            p.name as product_name,
            p.description as product_description,
            p.brand,
            p.unit_of_measure as product_unit,
            c.name as category_name,
            c.description as category_description,
            i.quantity_available,
            i.quantity_on_hand,
            i.quantity_reserved
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          JOIN inventory i ON pv.id = i.product_variant_id
          WHERE ${whereConditions.join(' AND ')}
          ORDER BY pv.name
          LIMIT $${paramCount - 1} OFFSET $${paramCount}
        `;
        
        const productsResult = await query(productsQuery, queryParams);
        
        result = {
          data: productsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            sku: row.sku,
            price: parseFloat(row.price),
            cost: parseFloat(row.cost),
            weight_kg: parseFloat(row.weight_per_unit),
            unit_of_measure: row.variant_value,
            is_active: row.is_active,
            image_url: row.image_url,
            products: {
              id: row.product_id,
              name: row.product_name,
              description: row.product_description,
              brand: row.brand,
              unit_of_measure: row.product_unit,
              categories: {
                id: row.category_id,
                name: row.category_name,
                description: row.category_description
              }
            },
            inventory: {
              quantity_available: parseInt(row.quantity_available),
              quantity_on_hand: parseInt(row.quantity_on_hand),
              quantity_reserved: parseInt(row.quantity_reserved)
            }
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
        
        await cache.set(cacheKey, result, 1800); // Cache for 30 minutes
      }
      
      return result;
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get product by ID
  static async getProductById(productId, branchId) {
    try {
      const cacheKey = `product:${productId}:${branchId}`;
      let product = await cache.get(cacheKey);
      
      if (!product) {
        const result = await query(`
          SELECT 
            pv.*,
            p.name as product_name,
            p.description as product_description,
            p.brand,
            p.unit_of_measure as product_unit,
            c.name as category_name,
            c.description as category_description,
            i.quantity_available,
            i.quantity_on_hand,
            i.quantity_reserved
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          JOIN inventory i ON pv.id = i.product_variant_id
          WHERE pv.id = $1 AND i.branch_id = $2 AND pv.is_active = true
        `, [productId, branchId]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        product = {
          id: row.id,
          name: row.name,
          sku: row.sku,
          price: parseFloat(row.price),
          cost: parseFloat(row.cost),
          weight_kg: parseFloat(row.weight_per_unit),
          unit_of_measure: row.variant_value,
          is_active: row.is_active,
          image_url: row.image_url,
          products: {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            brand: row.brand,
            unit_of_measure: row.product_unit,
            categories: {
              id: row.category_id,
              name: row.category_name,
              description: row.category_description
            }
          },
          inventory: {
            quantity_available: parseInt(row.quantity_available),
            quantity_on_hand: parseInt(row.quantity_on_hand),
            quantity_reserved: parseInt(row.quantity_reserved)
          }
        };
        
        await cache.set(cacheKey, product, 1800);
      }
      
      return product;
    } catch (error) {
      logger.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  // Get categories
  static async getCategories() {
    try {
      const cacheKey = 'categories:all';
      let categories = await cache.get(cacheKey);
      
      if (!categories) {
        const result = await query(`
          SELECT * FROM categories 
          WHERE is_active = true 
          ORDER BY sort_order, name
        `);
        
        categories = result.rows.map(row => new Category(row));
        await cache.set(cacheKey, categories, 3600); // Cache for 1 hour
      }
      
      return categories;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Search products
  static async searchProducts(query, branchId, limit = 10) {
    try {
      const result = await query(`
        SELECT 
          pv.id,
          pv.name,
          pv.sku,
          pv.price,
          pv.image_url,
          p.name as product_name,
          c.name as category_name,
          i.quantity_available
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN inventory i ON pv.id = i.product_variant_id
        WHERE i.branch_id = $1 
          AND pv.is_active = true 
          AND p.is_active = true
          AND (pv.name ILIKE $2 OR p.name ILIKE $2 OR pv.sku ILIKE $2)
          AND i.quantity_available > 0
        ORDER BY pv.name
        LIMIT $3
      `, [branchId, `%${query}%`, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        price: parseFloat(row.price),
        image_url: row.image_url,
        product_name: row.product_name,
        category_name: row.category_name,
        quantity_available: parseInt(row.quantity_available)
      }));
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  // Check product availability
  static async checkAvailability(productId, branchId, quantity = 1) {
    try {
      const result = await query(`
        SELECT quantity_available
        FROM inventory
        WHERE product_variant_id = $1 AND branch_id = $2
      `, [productId, branchId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return parseInt(result.rows[0].quantity_available) >= quantity;
    } catch (error) {
      logger.error('Error checking product availability:', error);
      return false;
    }
  }

  // Clear product cache
  static async clearCache() {
    try {
      await cache.delPattern('products:*');
      await cache.delPattern('product:*');
      await cache.del('categories:all');
      logger.info('Product cache cleared');
    } catch (error) {
      logger.error('Error clearing product cache:', error);
    }
  }
}

module.exports = {
  Product,
  ProductVariant,
  Category,
  ProductService
};











