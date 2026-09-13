const { body } = require('express-validator');

exports.createAccountValidator = [
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('accountName').trim().notEmpty().withMessage('Account name is required'),
  body('accountType').optional().isIn(['savings', 'current', 'salary', 'other']).withMessage('Invalid account type'),
  body('initialBalance').optional().isFloat({ min: 0 }).withMessage('Initial balance must be a positive number'),
];

exports.updateAccountValidator = [
  body('bankName').optional().trim().notEmpty().withMessage('Bank name cannot be empty'),
  body('accountName').optional().trim().notEmpty().withMessage('Account name cannot be empty'),
  body('accountType').optional().isIn(['savings', 'current', 'salary', 'other']).withMessage('Invalid account type'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];