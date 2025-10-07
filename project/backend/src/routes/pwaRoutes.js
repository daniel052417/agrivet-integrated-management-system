const express = require('express');
const router = express.Router();
const pwaController = require('../controllers/pwaController');

// PWA Session Management routes
router.post('/sessions', pwaController.createOrUpdateSession);
router.get('/sessions/:sessionId', pwaController.getSession);
router.put('/sessions/:sessionId/cart', pwaController.updateCartData);
router.put('/sessions/:sessionId/banners', pwaController.updateDismissedBanners);
router.put('/sessions/:sessionId/modal', pwaController.updateModalShown);

// PWA Analytics routes
router.post('/analytics/track', pwaController.trackEvent);
router.get('/analytics', pwaController.getAnalytics);
router.get('/analytics/popular-products/:branchId', pwaController.getPopularProducts);
router.get('/analytics/conversion-funnel/:branchId', pwaController.getConversionFunnel);

// PWA Cache Management routes
router.delete('/cache', pwaController.clearCache);

// PWA Notification routes
router.post('/notifications', pwaController.createNotification);
router.get('/notifications/:customerId', pwaController.getNotifications);
router.put('/notifications/:notificationId/read', pwaController.markNotificationAsRead);
router.post('/notifications/push', pwaController.sendPushNotification);

module.exports = router;











