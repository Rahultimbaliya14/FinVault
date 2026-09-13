const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getDashboard } = require('../controllers/dashboardController');

router.use(authenticate);
router.get('/', getDashboard);

module.exports = router;