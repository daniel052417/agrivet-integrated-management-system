const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');

// Branch routes
router.get('/', branchController.getAllBranches);
router.get('/availability', branchController.getBranchAvailability);
router.get('/:id', branchController.getBranchById);
router.get('/:id/operating-hours', branchController.getBranchOperatingHours);
router.get('/:id/status', branchController.isBranchOpen);
router.get('/code/:code', branchController.getBranchByCode);
router.post('/', branchController.createBranch);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;











