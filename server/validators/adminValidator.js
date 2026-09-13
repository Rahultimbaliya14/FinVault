const { body } = require('express-validator');

exports.createUserValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role must be admin or user'),
];

exports.updateStatusValidator = [
  body('isActive').isBoolean().withMessage('isActive must be true or false'),
];