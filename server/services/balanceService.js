const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const CREDIT_TYPES = ['income', 'refund', 'transfer_in'];

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