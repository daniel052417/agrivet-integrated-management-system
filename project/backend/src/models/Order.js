const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class Order {
  constructor(data) {
    this.id = data.id;
    this.order_number = data.order_number;
    this.customer_id = data.customer_id;
    this.branch_id = data.branch_id;
    this.status = data.status;
    this.subtotal = data.subtotal;
    this.tax_amount = data.tax_amount;
    this.total_amount = data.total_amount;
    this.payment_method = data.payment_method;
    this.payment_reference = data.payment_reference;
    this.payment_notes = data.payment_notes;
    this.estimated_ready_time = data.estimated_ready_time;
    this.is_guest_order = data.is_guest_order;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}

class OrderItem {
  constructor(data) {
    this.id = data.id;
    this.order_id = data.order_id;
    this.product_variant_id = data.product_variant_id;
    this.quantity = data.quantity;
    this.unit_price = data.unit_price;
    this.line_total = data.line_total;
    this.weight = data.weight;
    this.expiry_date = data.expiry_date;
    this.batch_number = data.batch_number;
    this.notes = data.notes;
    this.created_at = data.created_at;
  }
}

// Order Service
class OrderService {
  // Create new order
  static async createOrder(orderData) {
    try {
      return await transaction(async (client) => {
        // Generate order number
        const orderNumber = await this.generateOrderNumber();
        
        // Calculate estimated ready time (30 minutes from now)
        const estimatedReadyTime = new Date(Date.now() + 30 * 60 * 1000);
        
        // Create order
        const orderResult = await client.query(`
          INSERT INTO orders (
            order_number, customer_id, branch_id, status, subtotal, tax_amount, 
            total_amount, payment_method, payment_reference, payment_notes, 
            estimated_ready_time, is_guest_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          orderNumber,
          orderData.customer_id,
          orderData.branch_id,
          'pending',
          orderData.subtotal,
          orderData.tax_amount,
          orderData.total_amount,
          orderData.payment_method,
          orderData.payment_reference,
          orderData.payment_notes,
          estimatedReadyTime,
          orderData.is_guest_order || false
        ]);
        
        const order = new Order(orderResult.rows[0]);
        
        // Create order items
        const orderItems = [];
        for (const item of orderData.items) {
          const itemResult = await client.query(`
            INSERT INTO order_items (
              order_id, product_variant_id, quantity, unit_price, line_total,
              weight, expiry_date, batch_number, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `, [
            order.id,
            item.product_variant_id,
            item.quantity,
            item.unit_price,
            item.line_total,
            item.weight,
            item.expiry_date,
            item.batch_number,
            item.notes
          ]);
          
          orderItems.push(new OrderItem(itemResult.rows[0]));
          
          // Update inventory (reserve items)
          await client.query(`
            UPDATE inventory 
            SET 
              quantity_reserved = quantity_reserved + $2,
              updated_at = NOW()
            WHERE product_variant_id = $1 AND branch_id = $3
          `, [item.product_variant_id, item.quantity, orderData.branch_id]);
        }
        
        // Update customer loyalty points if not guest
        if (orderData.customer_id && !orderData.is_guest_order) {
          const loyaltyPoints = Math.floor(orderData.total_amount / 100); // 1 point per 100 pesos
          await client.query(`
            UPDATE customers 
            SET 
              loyalty_points = loyalty_points + $2,
              total_spent = total_spent + $3,
              total_lifetime_spent = total_lifetime_spent + $3,
              last_purchase_date = NOW(),
              loyalty_tier = CASE
                WHEN total_lifetime_spent + $3 >= 50000 THEN 'platinum'
                WHEN total_lifetime_spent + $3 >= 25000 THEN 'gold'
                WHEN total_lifetime_spent + $3 >= 10000 THEN 'silver'
                ELSE 'bronze'
              END
            WHERE id = $1
          `, [orderData.customer_id, loyaltyPoints, orderData.total_amount]);
        }
        
        return {
          order,
          items: orderItems
        };
      });
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  // Get order by ID
  static async getById(orderId) {
    try {
      const result = await query(`
        SELECT 
          o.*,
          c.first_name || ' ' || c.last_name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          b.name as branch_name,
          b.address as branch_address,
          b.phone as branch_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        JOIN branches b ON o.branch_id = b.id
        WHERE o.id = $1
      `, [orderId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const order = result.rows[0];
      
      // Get order items
      const itemsResult = await query(`
        SELECT 
          oi.*,
          pv.name as product_name,
          pv.sku as product_sku,
          p.name as base_product_name
        FROM order_items oi
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at
      `, [orderId]);
      
      return {
        ...order,
        items: itemsResult.rows
      };
    } catch (error) {
      logger.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  // Get order by order number
  static async getByOrderNumber(orderNumber) {
    try {
      const result = await query(`
        SELECT 
          o.*,
          c.first_name || ' ' || c.last_name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          b.name as branch_name,
          b.address as branch_address,
          b.phone as branch_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        JOIN branches b ON o.branch_id = b.id
        WHERE o.order_number = $1
      `, [orderNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const order = result.rows[0];
      
      // Get order items
      const itemsResult = await query(`
        SELECT 
          oi.*,
          pv.name as product_name,
          pv.sku as product_sku,
          p.name as base_product_name
        FROM order_items oi
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at
      `, [order.id]);
      
      return {
        ...order,
        items: itemsResult.rows
      };
    } catch (error) {
      logger.error('Error fetching order by order number:', error);
      throw error;
    }
  }

  // Update order status
  static async updateStatus(orderId, status) {
    try {
      const result = await query(`
        UPDATE orders 
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [orderId, status]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Order(result.rows[0]);
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  // Get orders by customer
  static async getByCustomer(customerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await query(`
        SELECT 
          o.*,
          b.name as branch_name
        FROM orders o
        JOIN branches b ON o.branch_id = b.id
        WHERE o.customer_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3
      `, [customerId, limit, offset]);
      
      return result.rows.map(row => new Order(row));
    } catch (error) {
      logger.error('Error fetching orders by customer:', error);
      throw error;
    }
  }

  // Get orders by branch
  static async getByBranch(branchId, status = null, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE o.branch_id = $1';
      const params = [branchId];
      
      if (status) {
        whereClause += ' AND o.status = $2';
        params.push(status);
      }
      
      const result = await query(`
        SELECT 
          o.*,
          c.first_name || ' ' || c.last_name as customer_name,
          c.phone as customer_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);
      
      return result.rows.map(row => new Order(row));
    } catch (error) {
      logger.error('Error fetching orders by branch:', error);
      throw error;
    }
  }

  // Cancel order
  static async cancelOrder(orderId) {
    try {
      return await transaction(async (client) => {
        // Get order items to restore inventory
        const itemsResult = await client.query(`
          SELECT product_variant_id, quantity, order_id
          FROM order_items
          WHERE order_id = $1
        `, [orderId]);
        
        // Get order details
        const orderResult = await client.query(`
          SELECT branch_id FROM orders WHERE id = $1
        `, [orderId]);
        
        if (orderResult.rows.length === 0) {
          throw new Error('Order not found');
        }
        
        const branchId = orderResult.rows[0].branch_id;
        
        // Restore inventory
        for (const item of itemsResult.rows) {
          await client.query(`
            UPDATE inventory 
            SET 
              quantity_reserved = quantity_reserved - $2,
              updated_at = NOW()
            WHERE product_variant_id = $1 AND branch_id = $3
          `, [item.product_variant_id, item.quantity, branchId]);
        }
        
        // Update order status
        const result = await client.query(`
          UPDATE orders 
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [orderId]);
        
        return new Order(result.rows[0]);
      });
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Generate order number
  static async generateOrderNumber() {
    try {
      const result = await query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1 as next_number
        FROM orders
        WHERE order_number LIKE 'ORD%'
      `);
      
      const nextNumber = result.rows[0].next_number;
      return `ORD${nextNumber.toString().padStart(8, '0')}`;
    } catch (error) {
      logger.error('Error generating order number:', error);
      return `ORD${Date.now().toString().slice(-8)}`;
    }
  }

  // Get order statistics
  static async getOrderStats(branchId = null, startDate = null, endDate = null) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (branchId) {
        params.push(branchId);
        whereClause += ` AND branch_id = $${params.length}`;
      }
      
      if (startDate) {
        params.push(startDate);
        whereClause += ` AND created_at >= $${params.length}`;
      }
      
      if (endDate) {
        params.push(endDate);
        whereClause += ` AND created_at <= $${params.length}`;
      }
      
      const result = await query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as average_order_value,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders
        ${whereClause}
      `, params);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching order statistics:', error);
      throw error;
    }
  }

  // Clear order cache
  static async clearCache() {
    try {
      await cache.delPattern('orders:*');
      logger.info('Order cache cleared');
    } catch (error) {
      logger.error('Error clearing order cache:', error);
    }
  }
}

module.exports = {
  Order,
  OrderItem,
  OrderService
};

