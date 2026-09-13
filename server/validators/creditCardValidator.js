const { body } = require('express-validator');

exports.createCardValidator = [
  body('cardName').trim().notEmpty().withMessage('Card name is required'),
  body('creditLimit').isFloat({ gt: 0 }).withMessage('Credit limit must be greater than 0'),
  body('billingDate').isInt({ min: 1, max: 31 }).withMessage('Billing date must be between 1 and 31'),
  body('dueDate').isInt({ min: 1, max: 31 }).withMessage('Due date must be between 1 and 31'),
];

exports.purchaseValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long'),
];