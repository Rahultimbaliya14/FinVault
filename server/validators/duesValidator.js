const { body } = require('express-validator');

exports.dueActionValidator = [
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid'),
];