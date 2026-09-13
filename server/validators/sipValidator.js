const { body } = require('express-validator');

exports.createSIPValidator = [
  body('sipName').trim().notEmpty().withMessage('SIP name is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('frequency').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid frequency'),
  body('sipDate').isInt({ min: 1, max: 31 }).withMessage('SIP date must be between 1 and 31'),
  body('accountId').isMongoId().withMessage('A valid accountId is required'),
];

exports.updateSIPValidator = [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('sipDate').optional().isInt({ min: 1, max: 31 }).withMessage('SIP date must be between 1 and 31'),
  body('status').optional().isIn(['active', 'paused', 'completed']).withMessage('Invalid status'),
];