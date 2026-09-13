const { body } = require('express-validator');

exports.createRecordValidator = [
  body('personName').trim().notEmpty().withMessage("Person's name is required"),
  body('type').isIn(['lend', 'borrow']).withMessage('Type must be lend or borrow'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('expectedRepaymentDate').optional().isISO8601().withMessage('Expected repayment date must be valid'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long'),
];

exports.repaymentValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Repayment amount must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Date must be valid'),
  body('note').optional().trim().isLength({ max: 200 }).withMessage('Note too long'),
];