const { body } = require('express-validator');

exports.registerValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.refreshValidator = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
];