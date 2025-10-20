const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')

// PWA Session routes
router.post('/pwa-sessions', cartController.createOrUpdateSession)
router.get('/pwa-sessions/:sessionId', cartController.getSession)

// Cart-specific routes
router.get('/cart/:sessionId', cartController.getCart)
router.put('/cart/:sessionId', cartController.updateCart)

// Guest cart migration
router.post('/migrate-guest-cart', cartController.migrateGuestCart)

// Session cleanup
router.post('/cleanup-sessions', cartController.cleanupExpiredSessions)

module.exports = router
