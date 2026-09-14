const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createTransactionValidator, updateTransactionValidator, transferValidator } = require('../validators/transactionValidator');
const {
  createTransaction,
  createTransfer,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

router.use(authenticate);

router.post('/transfer', transferValidator, validate, createTransfer);
router.post('/', createTransactionValidator, validate, createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransactionValidator, validate, updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;