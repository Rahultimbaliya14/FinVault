const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/authenticate');
const {
  createUser,
  getAllUsers,
  updateUserStatus,
  deleteUser,
} = require('../controllers/adminController');

// Every route here requires BOTH a valid JWT AND role === 'admin'
router.use(authenticate, authorizeAdmin);

router.post('/users', createUser);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;