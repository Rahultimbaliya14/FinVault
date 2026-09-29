const { body } = require('express-validator');

exports.createIPOValidator = [
  body('accountId').isMongoId().withMessage('A valid accountId is required'),
  body('ipoName').trim().notEmpty().withMessage('IPO name is required'),
  body('amountApplied').isFloat({ gt: 0 }).withMessage('Amount applied must be greater than 0'),
  body('applicationDate').optional().isISO8601().withMessage('Application date must be valid'),
  body('allotmentDate').isISO8601().withMessage('A valid allotment date is required'),
];