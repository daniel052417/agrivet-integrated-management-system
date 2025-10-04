const Joi = require('joi');
const logger = require('../config/logger');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // Branch validation
  branch: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    code: Joi.string().min(1).max(10).required(),
    address: Joi.string().min(1).required(),
    city: Joi.string().min(1).max(50).required(),
    province: Joi.string().min(1).max(50).required(),
    postal_code: Joi.string().max(10).allow(null),
    phone: Joi.string().max(20).allow(null),
    email: Joi.string().email().max(255).allow(null),
    manager_id: Joi.string().uuid().allow(null),
    operating_hours: Joi.object().allow(null),
    branch_type: Joi.string().valid('main', 'satellite').default('satellite')
  }),

  // Customer validation
  customer: Joi.object({
    first_name: Joi.string().min(1).max(100).required(),
    last_name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().max(255).required(),
    phone: Joi.string().max(20).required(),
    address: Joi.string().min(1).required(),
    city: Joi.string().min(1).max(50).required(),
    province: Joi.string().min(1).max(50).required(),
    customer_type: Joi.string().valid('regular', 'vip', 'wholesale').default('regular'),
    date_of_birth: Joi.date().allow(null)
  }),

  // Guest customer validation
  guestCustomer: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    email: Joi.string().email().max(255).required(),
    phone: Joi.string().max(20).required(),
    address: Joi.string().min(1).required(),
    city: Joi.string().min(1).max(50).required(),
    province: Joi.string().max(50).default('')
  }),

  // Order validation
  order: Joi.object({
    customer_id: Joi.string().uuid().allow(null),
    branch_id: Joi.string().uuid().required(),
    subtotal: Joi.number().min(0).required(),
    tax_amount: Joi.number().min(0).required(),
    total_amount: Joi.number().min(0).required(),
    payment_method: Joi.string().valid('cash', 'card', 'gcash', 'paymaya', 'bank_transfer').required(),
    payment_reference: Joi.string().max(255).allow(null),
    payment_notes: Joi.string().max(500).allow(null),
    is_guest_order: Joi.boolean().default(false),
    items: Joi.array().items(
      Joi.object({
        product_variant_id: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        unit_price: Joi.number().min(0).required(),
        line_total: Joi.number().min(0).required(),
        weight: Joi.number().min(0).allow(null),
        expiry_date: Joi.date().allow(null),
        batch_number: Joi.string().max(100).allow(null),
        notes: Joi.string().max(500).allow(null)
      })
    ).min(1).required()
  }),

  // PWA Session validation
  pwaSession: Joi.object({
    sessionId: Joi.string().required(),
    branchId: Joi.string().uuid().required(),
    customerId: Joi.string().uuid().allow(null),
    isGuest: Joi.boolean().default(false),
    cartData: Joi.object().allow(null),
    dismissedBanners: Joi.array().items(Joi.string()).default([]),
    modalShown: Joi.object().default({})
  }),

  // PWA Event validation
  pwaEvent: Joi.object({
    sessionId: Joi.string().required(),
    eventType: Joi.string().valid(
      'page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
      'checkout_start', 'checkout_complete', 'order_complete', 'search'
    ).required(),
    eventData: Joi.object().required(),
    branchId: Joi.string().uuid().required(),
    customerId: Joi.string().uuid().allow(null)
  }),

  // Promotion validation
  promotion: Joi.object({
    campaign_id: Joi.string().uuid().allow(null),
    name: Joi.string().min(1).max(200).required(),
    code: Joi.string().min(1).max(50).required(),
    type: Joi.string().valid('percentage', 'fixed', 'bogo').required(),
    discount_value: Joi.number().min(0).required(),
    minimum_amount: Joi.number().min(0).allow(null),
    maximum_discount: Joi.number().min(0).allow(null),
    usage_limit: Joi.number().integer().min(1).allow(null),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    applies_to: Joi.string().valid('all', 'products', 'categories').default('all')
  }),

  // Order status update validation
  orderStatusUpdate: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'ready', 'completed', 'cancelled').required()
  }),

  // Promotion validation request
  promotionValidation: Joi.object({
    subtotal: Joi.number().min(0).required(),
    customer_id: Joi.string().uuid().allow(null),
    items: Joi.array().items(
      Joi.object({
        product_variant_id: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required()
  })
};

module.exports = {
  validate,
  schemas
};








