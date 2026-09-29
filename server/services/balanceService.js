const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const IPO = require('../models/Ipo');

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

const getBalanceAsOf = async (account, asOfDate) => {
  const result = await Transaction.aggregate([
    {
      $match: {
        accountId: new mongoose.Types.ObjectId(account._id),
        date: { $lte: asOfDate },
      },
    },
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


const getBlockedAmount = async (accountId) => {
  const result = await IPO.aggregate([
    { $match: { accountId: new mongoose.Types.ObjectId(accountId), status: 'blocked' } },
    { $group: { _id: null, total: { $sum: '$amountApplied' } } },
  ]);
  return result[0]?.total || 0;
};


const getAvailableBalance = async (account) => {
  const [currentBalance, blockedAmount] = await Promise.all([
    getCurrentBalance(account),
    getBlockedAmount(account._id),
  ]);
  return { currentBalance, blockedAmount, availableBalance: currentBalance - blockedAmount };
};

module.exports = { getCurrentBalance, getBalanceAsOf, getBlockedAmount, getAvailableBalance, CREDIT_TYPES };