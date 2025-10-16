const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Generate unique ID
const generateId = () => {
  return uuidv4();
};

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD${timestamp}${random}`;
};

// Generate customer number
const generateCustomerNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `CUS${timestamp}`;
};

// Generate promotion code
const generatePromotionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format currency
const formatCurrency = (amount, currency = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

// Calculate tax
const calculateTax = (subtotal, taxRate = 0.12) => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

// Calculate discount
const calculateDiscount = (amount, discountType, discountValue) => {
  switch (discountType) {
    case 'percentage':
      return Math.round(amount * (discountValue / 100) * 100) / 100;
    case 'fixed':
      return Math.min(discountValue, amount);
    default:
      return 0;
  }
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Sanitize string
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Generate pagination metadata
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Generate random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Deep clone object
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Check if object is empty
const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Sleep function
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
};

// Validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Generate cache key
const generateCacheKey = (...parts) => {
  return parts.filter(part => part != null).join(':');
};

// Parse JSON safely
const parseJSON = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
};

// Stringify JSON safely
const stringifyJSON = (obj, defaultValue = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return defaultValue;
  }
};

// Check if date is today
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

// Check if date is in the past
const isPast = (date) => {
  return new Date(date) < new Date();
};

// Check if date is in the future
const isFuture = (date) => {
  return new Date(date) > new Date();
};

// Get time difference in minutes
const getTimeDifferenceInMinutes = (date1, date2) => {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  return Math.floor(diff / (1000 * 60));
};

// Generate slug from string
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Capitalize first letter
const capitalize = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncate string
const truncate = (str, length = 100, suffix = '...') => {
  if (typeof str !== 'string') return str;
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

module.exports = {
  generateId,
  generateOrderNumber,
  generateCustomerNumber,
  generatePromotionCode,
  formatCurrency,
  formatDate,
  calculateTax,
  calculateDiscount,
  isValidEmail,
  isValidPhone,
  sanitizeString,
  generatePagination,
  calculateDistance,
  generateRandomString,
  deepClone,
  isEmpty,
  sleep,
  retry,
  isValidUUID,
  generateCacheKey,
  parseJSON,
  stringifyJSON,
  isToday,
  isPast,
  isFuture,
  getTimeDifferenceInMinutes,
  generateSlug,
  capitalize,
  truncate
};
















