const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// Types that ADD to the account balance. Everything else SUBTRACTS.
const CREDIT_TYPES = ['income', 'refund'];

// Computes current balance = initialBalance + income/refunds - everything else.
// This is the SINGLE place balance math happens. If the rules ever change
// (e.g. a new transaction type is added), this is the only function to touch.
const getCurrentBalance = async (account) => {
  const result = await Transaction.aggregate([
    { $match: { accountId: new mongoose.Types.ObjectId(account._id) } },
    {
      $group: {
        _id: null,
        totalCredits: {
          $sum: {
            $cond: [{ $in: ['$type', CREDIT_TYPES] }, '$amount', 0],
          },
        },
        totalDebits: {
          $sum: {
            $cond: [{ $in: ['$type', CREDIT_TYPES] }, 0, '$amount'],
          },
        },
      },
    },
  ]);

  const totals = result[0] || { totalCredits: 0, totalDebits: 0 };
  return account.initialBalance + totals.totalCredits - totals.totalDebits;
};

module.exports = { getCurrentBalance, CREDIT_TYPES };