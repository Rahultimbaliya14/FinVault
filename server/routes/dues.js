const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { dueActionValidator } = require('../validators/duesValidator');
const { getDues, markDuePaid, markDueSkipped } = require('../controllers/duesController');

router.use(authenticate);
router.get('/', getDues);
router.post('/:refType/:refId/pay', dueActionValidator, validate, markDuePaid);
router.post('/:refType/:refId/skip', dueActionValidator, validate, markDueSkipped);

module.exports = router;