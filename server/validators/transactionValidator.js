const { body } = require('express-validator');

const TYPES = ['income', 'expense', 'upi_expense', 'bank_transfer', 'refund'];
const CATEGORIES = ['food', 'shopping', 'travel', 'entertainment', 'utilities', 'medical', 'fuel', 'online_purchase', 'salary', 'other'];
const PAYMENT_METHODS = ['cash', 'upi', 'debit_card', 'net_banking', 'neft', 'rtgs', 'imps', 'cheque', 'other'];

exports.createTransactionValidator = [
  body('accountId').isMongoId().withMessage('A valid accountId is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(TYPES).withMessage('Invalid transaction type'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long'),
];

exports.updateTransactionValidator = [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('type').optional().isIn(TYPES).withMessage('Invalid transaction type'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
];