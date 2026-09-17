const express = require('express');
const router = express.Router();
const authenticateAdmin = require('../middleware/authenticateAdmin');
const validate = require('../middleware/validate');
const { setupAdminValidator, loginAdminValidator, approvalValidator } = require('../validators/setupAdminValidator');
const {
  setupAdmin,
  loginAdmin,
  getDashboardSummary,
  getAllUsers,
  updateUserApproval,
} = require('../controllers/superAdminController');

router.post('/setup', setupAdminValidator, validate, setupAdmin);
router.post('/login', loginAdminValidator, validate, loginAdmin);

// Everything below requires a valid admin token
router.use(authenticateAdmin);
router.get('/dashboard', getDashboardSummary);
router.get('/users', getAllUsers);
router.put('/users/:id/status', approvalValidator, validate, updateUserApproval);

module.exports = router;