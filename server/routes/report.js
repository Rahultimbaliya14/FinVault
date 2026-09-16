const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getReport } = require('../controllers/reportController');

router.use(authenticate);
router.get('/', getReport);

module.exports = router;