const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const {
  createRecord,
  getRecords,
  addRepayment,
  deleteRecord,
} = require('../controllers/lendBorrowController');

router.use(authenticate);

router.post('/', createRecord);
router.get('/', getRecords);
router.post('/:id/repayments', addRepayment);
router.delete('/:id', deleteRecord);

module.exports = router;