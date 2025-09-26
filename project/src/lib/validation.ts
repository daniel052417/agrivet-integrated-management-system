// Enhanced Validation and Security Utilities
import { CreateStaffData, CreateUserData, CreateStaffWithAccountData } from './staffApi';
import { canManageUser } from './roleHierarchy';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export class ValidationService {
  // Email validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation (supports international formats)
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Password strength validation
  static validatePassword(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Username validation
  static validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  // Staff data validation
  static validateStaffData(data: CreateStaffData): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Required fields
    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.position?.trim()) {
      errors.position = 'Position is required';
    }

    if (!data.department?.trim()) {
      errors.department = 'Department is required';
    }

    // Optional field validation
    if (data.phone && !this.validatePhone(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (data.salary && data.salary < 0) {
      errors.salary = 'Salary cannot be negative';
    }

    if (data.salary && data.salary > 1000000) {
      warnings.push('Salary seems unusually high. Please verify.');
    }

    // Date validation
    if (data.hire_date) {
      const hireDate = new Date(data.hire_date);
      const today = new Date();
      
      if (hireDate > today) {
        warnings.push('Hire date is in the future');
      }
      
      if (hireDate < new Date('1900-01-01')) {
        errors.hire_date = 'Hire date seems invalid';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // User data validation
  static validateUserData(data: CreateUserData): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Required fields
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!data.role?.trim()) {
      errors.role = 'Role is required';
    }

    // Password validation
    if (data.password) {
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.feedback.join(', ');
      }
    }

    // Phone validation
    if (data.phone && !this.validatePhone(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Enhanced staff with account validation
  static validateStaffWithAccountData(data: CreateStaffWithAccountData): ValidationResult {
    // First validate basic staff data
    const staffValidation = this.validateStaffData(data);
    
    if (!staffValidation.isValid) {
      return staffValidation;
    }

    const errors = { ...staffValidation.errors };
    const warnings = [...staffValidation.warnings];

    // Validate account creation settings
    if (data.createUserAccount && data.accountDetails) {
      const { accountDetails } = data;

      if (!accountDetails.role?.trim()) {
        errors.accountRole = 'Account role is required';
      }

      if (!accountDetails.sendEmailInvite && !accountDetails.password) {
        errors.accountPassword = 'Password is required when not sending email invitation';
      }

      if (accountDetails.password) {
        const passwordValidation = this.validatePassword(accountDetails.password);
        if (!passwordValidation.isValid) {
          errors.accountPassword = passwordValidation.feedback.join(', ');
        }
      }

      if (accountDetails.username && !this.validateUsername(accountDetails.username)) {
        errors.accountUsername = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Business rule validation
  static validateBusinessRules(data: CreateStaffWithAccountData): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Role consistency check
    if (data.createUserAccount && data.accountDetails) {
      const staffRole = data.role.toLowerCase();
      const accountRole = data.accountDetails.role.toLowerCase();

      if (staffRole === 'admin' && accountRole !== 'admin') {
        warnings.push('Staff role is Admin but account role is different. This may cause permission issues.');
      }

      if (staffRole === 'manager' && accountRole === 'staff') {
        warnings.push('Staff role is Manager but account role is Staff. This may limit access.');
      }
    }

    // Email domain validation (optional business rule)
    if (data.email && !data.email.endsWith('@agrivet.com')) {
      warnings.push('Email is not from the company domain. Please verify.');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Comprehensive validation for staff with account creation
  static validateStaffWithAccount(data: CreateStaffWithAccountData): ValidationResult {
    const staffValidation = this.validateStaffWithAccountData(data);
    const businessValidation = this.validateBusinessRules(data);

    return {
      isValid: staffValidation.isValid && businessValidation.isValid,
      errors: { ...staffValidation.errors, ...businessValidation.errors },
      warnings: [...staffValidation.warnings, ...businessValidation.warnings]
    };
  }
}

// Security utilities
export class SecurityService {
  // Generate secure random password
  static generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate username from name
  static generateUsername(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
    return base.substring(0, 20); // Limit to 20 characters
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate role permissions
  static validateRolePermissions(role: string): boolean {
    const validRoles = ['admin', 'manager', 'staff', 'hr', 'marketing', 'inventory', 'cashier', 'user'];
    return validRoles.includes(role.toLowerCase());
  }

  // Check if user can perform action
  static canPerformAction(userRole: string, action: string, targetRole?: string): boolean {
    // Use the new role hierarchy system
    if (!targetRole) {
      return true; // No target role means general permission check
    }

    return canManageUser(userRole, targetRole, action as 'create' | 'update' | 'delete' | 'view');
  }
}

// Rate limiting utilities
export class RateLimitService {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - attempt.lastAttempt > windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if limit exceeded
    if (attempt.count >= maxAttempts) {
      return false;
    }
    
    // Increment count
    attempt.count++;
    attempt.lastAttempt = now;
    return true;
  }
  
  static resetRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}











