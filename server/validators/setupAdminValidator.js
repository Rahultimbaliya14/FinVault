const { body } = require('express-validator');

exports.setupAdminValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim().isLength({ max: 100 }),
];

exports.loginAdminValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.approvalValidator = [
  body('isActive').isBoolean().withMessage('isActive must be true or false'),
];