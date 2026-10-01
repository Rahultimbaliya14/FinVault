const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const IPO = require('../models/Ipo');

// Types that ADD to the account balance. Everything else SUBTRACTS.
// transfer_in is a credit at the per-account level (money arriving into
// that specific account) even though, across all accounts combined, a
// transfer nets to zero - dashboardService handles that distinction
// separately when computing overall income/expense totals.
const CREDIT_TYPES = ['income', 'refund', 'transfer_in', 'loan_received'];

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

// Same math as getCurrentBalance, but as of a SPECIFIC point in time
// instead of "right now" - only counts transactions dated on or before
// asOfDate. Used by reports so a February report shows what the balance
// actually was at the end of February, not today's live number.
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

// Sum of all currently-BLOCKED IPO applications against this account -
// money that's real balance-wise (no transaction exists yet) but isn't
// actually spendable, since it's on hold pending allotment.
const getBlockedAmount = async (accountId) => {
  const result = await IPO.aggregate([
    { $match: { accountId: new mongoose.Types.ObjectId(accountId), status: 'blocked' } },
    { $group: { _id: null, total: { $sum: '$amountApplied' } } },
  ]);
  return result[0]?.total || 0;
};

// What the user can ACTUALLY spend right now: current balance minus
// whatever is on hold for pending IPO applications.
const getAvailableBalance = async (account) => {
  const [currentBalance, blockedAmount] = await Promise.all([
    getCurrentBalance(account),
    getBlockedAmount(account._id),
  ]);
  return { currentBalance, blockedAmount, availableBalance: currentBalance - blockedAmount };
};

module.exports = { getCurrentBalance, getBalanceAsOf, getBlockedAmount, getAvailableBalance, CREDIT_TYPES };