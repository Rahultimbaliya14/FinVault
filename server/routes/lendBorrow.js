const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createRecordValidator, repaymentValidator } = require('../validators/lendBorrowValidator');
const {
  createRecord,
  getRecords,
  addRepayment,
  deleteRecord,
} = require('../controllers/lendBorrowController');

router.use(authenticate);

router.post('/', createRecordValidator, validate, createRecord);
router.get('/', getRecords);
router.post('/:id/repayments', repaymentValidator, validate, addRepayment);
router.delete('/:id', deleteRecord);

module.exports = router;