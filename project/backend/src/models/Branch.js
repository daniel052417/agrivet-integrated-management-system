const { query } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

class Branch {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.address = data.address;
    this.city = data.city;
    this.province = data.province;
    this.postal_code = data.postal_code;
    this.phone = data.phone;
    this.email = data.email;
    this.manager_id = data.manager_id;
    this.is_active = data.is_active;
    this.operating_hours = data.operating_hours;
    this.branch_type = data.branch_type;
    this.created_at = data.created_at;
  }

  // Get all active branches
  static async getAll() {
    try {
      const cacheKey = 'branches:all';
      let branches = await cache.get(cacheKey);
      
      if (!branches) {
        const result = await query(`
          SELECT 
            b.*,
            s.first_name || ' ' || s.last_name as manager_name
          FROM branches b
          LEFT JOIN staff s ON b.manager_id = s.id
          WHERE b.is_active = true
          ORDER BY b.name
        `);
        
        branches = result.rows.map(row => new Branch(row));
        await cache.set(cacheKey, branches, 1800); // Cache for 30 minutes
      }
      
      return branches;
    } catch (error) {
      logger.error('Error fetching branches:', error);
      throw error;
    }
  }

  // Get branch by ID
  static async getById(id) {
    try {
      const cacheKey = `branch:${id}`;
      let branch = await cache.get(cacheKey);
      
      if (!branch) {
        const result = await query(`
          SELECT 
            b.*,
            s.first_name || ' ' || s.last_name as manager_name
          FROM branches b
          LEFT JOIN staff s ON b.manager_id = s.id
          WHERE b.id = $1 AND b.is_active = true
        `, [id]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        branch = new Branch(result.rows[0]);
        await cache.set(cacheKey, branch, 1800);
      }
      
      return branch;
    } catch (error) {
      logger.error('Error fetching branch by ID:', error);
      throw error;
    }
  }

  // Get branch by code
  static async getByCode(code) {
    try {
      const result = await query(`
        SELECT * FROM branches 
        WHERE code = $1 AND is_active = true
      `, [code]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Branch(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching branch by code:', error);
      throw error;
    }
  }

  // Get branch operating hours
  static async getOperatingHours(branchId) {
    try {
      const result = await query(`
        SELECT 
          day_of_week,
          is_open,
          open_time,
          close_time
        FROM branch_operating_hours
        WHERE branch_id = $1
        ORDER BY day_of_week
      `, [branchId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching branch operating hours:', error);
      throw error;
    }
  }

  // Check if branch is currently open
  static async isBranchOpen(branchId) {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const result = await query(`
        SELECT 
          is_open,
          open_time,
          close_time
        FROM branch_operating_hours
        WHERE branch_id = $1 AND day_of_week = $2
      `, [branchId, currentDay]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const { is_open, open_time, close_time } = result.rows[0];
      
      if (!is_open) {
        return false;
      }
      
      return currentTime >= open_time && currentTime <= close_time;
    } catch (error) {
      logger.error('Error checking if branch is open:', error);
      return false;
    }
  }

  // Get branch availability status
  static async getBranchAvailability() {
    try {
      const branches = await this.getAll();
      const availability = [];
      
      for (const branch of branches) {
        const isOpen = await this.isBranchOpen(branch.id);
        const operatingHours = await this.getOperatingHours(branch.id);
        
        availability.push({
          branchId: branch.id,
          isOpen,
          operatingHours: operatingHours.reduce((acc, hour) => {
            acc[hour.day_of_week] = {
              is_open: hour.is_open,
              open_time: hour.open_time,
              close_time: hour.close_time
            };
            return acc;
          }, {}),
          lastUpdated: new Date().toISOString()
        });
      }
      
      return availability;
    } catch (error) {
      logger.error('Error fetching branch availability:', error);
      throw error;
    }
  }

  // Clear branch cache
  static async clearCache() {
    try {
      await cache.delPattern('branch:*');
      await cache.del('branches:all');
      logger.info('Branch cache cleared');
    } catch (error) {
      logger.error('Error clearing branch cache:', error);
    }
  }

  // Create new branch
  static async create(branchData) {
    try {
      const result = await query(`
        INSERT INTO branches (
          name, code, address, city, province, postal_code, 
          phone, email, manager_id, operating_hours, branch_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        branchData.name,
        branchData.code,
        branchData.address,
        branchData.city,
        branchData.province,
        branchData.postal_code,
        branchData.phone,
        branchData.email,
        branchData.manager_id,
        JSON.stringify(branchData.operating_hours),
        branchData.branch_type || 'satellite'
      ]);
      
      const branch = new Branch(result.rows[0]);
      await this.clearCache();
      
      return branch;
    } catch (error) {
      logger.error('Error creating branch:', error);
      throw error;
    }
  }

  // Update branch
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
        UPDATE branches 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const branch = new Branch(result.rows[0]);
      await this.clearCache();
      
      return branch;
    } catch (error) {
      logger.error('Error updating branch:', error);
      throw error;
    }
  }

  // Delete branch (soft delete)
  static async delete(id) {
    try {
      const result = await query(`
        UPDATE branches 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      await this.clearCache();
      return new Branch(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting branch:', error);
      throw error;
    }
  }
}

module.exports = Branch;













