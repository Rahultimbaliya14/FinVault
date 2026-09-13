const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getDues } = require('../controllers/duesController');

router.use(authenticate);
router.get('/', getDues);

module.exports = router;