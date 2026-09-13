const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const CreditCard = require('../models/CreditCard');
const BillingCycle = require('../models/BillingCycle');
const LendBorrow = require('../models/LendBorrow');
const { getCurrentBalance, CREDIT_TYPES } = require('./balanceService');
const { getAllUpcomingDues } = require('./duesService');

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

// Total balance across ALL of the user's bank accounts, combined
const getTotalBankBalance = async (userId) => {
  const accounts = await BankAccount.find({ userId, status: 'active' });
  const balances = await Promise.all(accounts.map((acc) => getCurrentBalance(acc)));
  return balances.reduce((sum, b) => sum + b, 0);
};

// This month's income and expense totals, plus category breakdown -
// all computed with a single aggregation query rather than looping in JS
const getMonthlyTransactionSummary = async (userId) => {
  const { start, end } = getMonthRange();

  const results = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        type: { $first: '$type' },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryBreakdown = {};

  // Re-run a simpler pass to correctly separate income vs expense
  // (a category like 'salary' should only ever be income, but this
  // keeps the logic correct even if that assumption changes later)
  const allTx = await Transaction.find({ userId, date: { $gte: start, $lte: end } });
  allTx.forEach((tx) => {
    if (CREDIT_TYPES.includes(tx.type)) {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
      categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
    }
  });

  return { totalIncome, totalExpenses, categoryBreakdown };
};

const getCreditCardOutstanding = async (userId) => {
  const unpaidCycles = await BillingCycle.find({ userId, status: { $ne: 'paid' } });
  return unpaidCycles.reduce((sum, c) => sum + c.statementAmount, 0);
};

const getMoneyToReceiveAndPay = async (userId) => {
  const records = await LendBorrow.find({ userId, status: { $ne: 'settled' } });

  let moneyToReceive = 0;
  let moneyToPay = 0;

  records.forEach((r) => {
    const repaid = r.repayments.reduce((sum, rep) => sum + rep.amount, 0);
    const remaining = r.amount - repaid;
    if (r.type === 'lend') moneyToReceive += remaining;
    if (r.type === 'borrow') moneyToPay += remaining;
  });

  return { moneyToReceive, moneyToPay };
};

// Assembles every piece into the single object the dashboard UI needs
const getDashboardData = async (userId) => {
  const [
    totalBankBalance,
    { totalIncome, totalExpenses, categoryBreakdown },
    creditCardOutstanding,
    { moneyToReceive, moneyToPay },
    upcomingDues,
    recentTransactions,
  ] = await Promise.all([
    getTotalBankBalance(userId),
    getMonthlyTransactionSummary(userId),
    getCreditCardOutstanding(userId),
    getMoneyToReceiveAndPay(userId),
    getAllUpcomingDues(userId),
    Transaction.find({ userId }).sort({ date: -1 }).limit(10),
  ]);

  // "Committed" = everything due that hasn't been paid yet (SIP, EMI, CC bill, borrow repayments)
  const totalPlannedCommitments = upcomingDues.reduce((sum, d) => sum + d.amount, 0);
  const availableFunds = totalBankBalance - totalPlannedCommitments;

  return {
    totalBankBalance,
    totalMonthlyIncome: totalIncome,
    totalMonthlyExpenses: totalExpenses,
    totalPlannedCommitments,
    creditCardOutstanding,
    moneyToReceive,
    moneyToPay,
    availableFunds,
    categoryWiseExpenses: categoryBreakdown,
    upcomingDues: upcomingDues.slice(0, 10),
    recentTransactions,
  };
};

module.exports = { getDashboardData, getMonthRange };