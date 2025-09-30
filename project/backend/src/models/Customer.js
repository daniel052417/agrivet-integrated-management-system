const { query } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class Customer {
  constructor(data) {
    this.id = data.id;
    this.customer_number = data.customer_number;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.city = data.city;
    this.province = data.province;
    this.customer_type = data.customer_type;
    this.is_active = data.is_active;
    this.user_id = data.user_id;
    this.customer_code = data.customer_code;
    this.date_of_birth = data.date_of_birth;
    this.registration_date = data.registration_date;
    this.total_spent = data.total_spent;
    this.last_purchase_date = data.last_purchase_date;
    this.loyalty_points = data.loyalty_points;
    this.loyalty_tier = data.loyalty_tier;
    this.total_lifetime_spent = data.total_lifetime_spent;
    this.is_guest = data.is_guest || false;
    this.guest_session_id = data.guest_session_id;
    this.created_at = data.created_at;
  }

  // Get customer by ID
  static async getById(id) {
    try {
      const result = await query(`
        SELECT * FROM customers 
        WHERE id = $1 AND is_active = true
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching customer by ID:', error);
      throw error;
    }
  }

  // Get customer by email
  static async getByEmail(email) {
    try {
      const result = await query(`
        SELECT * FROM customers 
        WHERE email = $1 AND is_active = true
      `, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching customer by email:', error);
      throw error;
    }
  }

  // Get customer by phone
  static async getByPhone(phone) {
    try {
      const result = await query(`
        SELECT * FROM customers 
        WHERE phone = $1 AND is_active = true
      `, [phone]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching customer by phone:', error);
      throw error;
    }
  }

  // Create new customer
  static async create(customerData) {
    try {
      const customerNumber = await this.generateCustomerNumber();
      const customerCode = await this.generateCustomerCode();
      
      const result = await query(`
        INSERT INTO customers (
          customer_number, first_name, last_name, email, phone, address, city, province,
          customer_type, is_guest, guest_session_id, customer_code, date_of_birth
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        customerNumber,
        customerData.first_name,
        customerData.last_name,
        customerData.email,
        customerData.phone,
        customerData.address,
        customerData.city,
        customerData.province,
        customerData.customer_type || 'regular',
        customerData.is_guest || false,
        customerData.guest_session_id,
        customerCode,
        customerData.date_of_birth
      ]);
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  // Create guest customer
  static async createGuest(guestData) {
    try {
      const guestSessionId = uuidv4();
      
      const customerData = {
        first_name: guestData.name.split(' ')[0] || 'Guest',
        last_name: guestData.name.split(' ').slice(1).join(' ') || 'Customer',
        email: guestData.email,
        phone: guestData.phone,
        address: guestData.address,
        city: guestData.city,
        province: guestData.province || '',
        is_guest: true,
        guest_session_id: guestSessionId,
        customer_type: 'regular'
      };
      
      return await this.create(customerData);
    } catch (error) {
      logger.error('Error creating guest customer:', error);
      throw error;
    }
  }

  // Update customer
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(id);
      
      const result = await query(`
        UPDATE customers 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  // Update customer loyalty points
  static async updateLoyaltyPoints(customerId, points, spentAmount = 0) {
    try {
      const result = await query(`
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
        RETURNING *
      `, [customerId, points, spentAmount]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error updating customer loyalty points:', error);
      throw error;
    }
  }

  // Generate customer number
  static async generateCustomerNumber() {
    try {
      const result = await query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(customer_number FROM 4) AS INTEGER)), 0) + 1 as next_number
        FROM customers
        WHERE customer_number LIKE 'CUS%'
      `);
      
      const nextNumber = result.rows[0].next_number;
      return `CUS${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      logger.error('Error generating customer number:', error);
      return `CUS${Date.now().toString().slice(-6)}`;
    }
  }

  // Generate customer code
  static async generateCustomerCode() {
    try {
      const result = await query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1 as next_code
        FROM customers
        WHERE customer_code LIKE 'CC%'
      `);
      
      const nextCode = result.rows[0].next_code;
      return `CC${nextCode.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating customer code:', error);
      return `CC${Date.now().toString().slice(-4)}`;
    }
  }

  // Get customer order history
  static async getOrderHistory(customerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await query(`
        SELECT 
          o.id,
          o.order_number,
          o.status,
          o.total_amount,
          o.created_at,
          b.name as branch_name
        FROM orders o
        JOIN branches b ON o.branch_id = b.id
        WHERE o.customer_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3
      `, [customerId, limit, offset]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching customer order history:', error);
      throw error;
    }
  }

  // Get customer statistics
  static async getCustomerStats(customerId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_spent,
          COALESCE(AVG(o.total_amount), 0) as average_order_value,
          MAX(o.created_at) as last_order_date,
          MIN(o.created_at) as first_order_date
        FROM orders o
        WHERE o.customer_id = $1
      `, [customerId]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching customer statistics:', error);
      throw error;
    }
  }

  // Search customers
  static async searchCustomers(searchTerm, limit = 10) {
    try {
      const result = await query(`
        SELECT 
          id, customer_number, first_name, last_name, email, phone,
          customer_type, loyalty_tier, total_spent
        FROM customers
        WHERE is_active = true 
          AND (
            first_name ILIKE $1 OR 
            last_name ILIKE $1 OR 
            email ILIKE $1 OR 
            phone ILIKE $1 OR
            customer_number ILIKE $1
          )
        ORDER BY first_name, last_name
        LIMIT $2
      `, [`%${searchTerm}%`, limit]);
      
      return result.rows.map(row => new Customer(row));
    } catch (error) {
      logger.error('Error searching customers:', error);
      throw error;
    }
  }

  // Delete customer (soft delete)
  static async delete(id) {
    try {
      const result = await query(`
        UPDATE customers 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }
}

module.exports = Customer;

