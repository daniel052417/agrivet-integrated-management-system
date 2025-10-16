const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

// Promotion routes
router.get('/active', promotionController.getActivePromotions);
router.get('/banners', promotionController.getBannerPromotions);
router.get('/modals', promotionController.getModalPromotions);
router.get('/code/:code', promotionController.getPromotionByCode);
router.get('/:id', promotionController.getPromotionById);
router.get('/:id/targets', promotionController.getPromotionTargets);
router.get('/:id/branches', promotionController.getPromotionBranches);
router.post('/', promotionController.createPromotion);
router.post('/:promotionId/validate', promotionController.validatePromotion);
router.post('/:promotionId/apply', promotionController.applyPromotion);
router.post('/:promotionId/usage', promotionController.recordPromotionUsage);
router.put('/:id', promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);

module.exports = router;
















