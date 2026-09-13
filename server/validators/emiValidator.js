const { body } = require('express-validator');

exports.createEMIValidator = [
  body('loanName').trim().notEmpty().withMessage('Loan name is required'),
  body('principalAmount').isFloat({ gt: 0 }).withMessage('Principal amount must be greater than 0'),
  body('emiAmount').isFloat({ gt: 0 }).withMessage('EMI amount must be greater than 0'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate cannot be negative'),
  body('startDate').isISO8601().withMessage('A valid start date is required'),
  body('endDate').isISO8601().withMessage('A valid end date is required')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('numberOfInstallments').isInt({ min: 1 }).withMessage('Number of installments must be at least 1'),
  body('dueDate').isInt({ min: 1, max: 31 }).withMessage('Due date must be between 1 and 31'),
  body('accountId').isMongoId().withMessage('A valid accountId is required'),
];

exports.updateEMIValidator = [
  body('emiAmount').optional().isFloat({ gt: 0 }).withMessage('EMI amount must be greater than 0'),
  body('dueDate').optional().isInt({ min: 1, max: 31 }).withMessage('Due date must be between 1 and 31'),
  body('status').optional().isIn(['active', 'closed', 'defaulted']).withMessage('Invalid status'),
];