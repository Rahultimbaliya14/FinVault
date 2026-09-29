const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const CreditCard = require('../models/CreditCard');
const BillingCycle = require('../models/BillingCycle');
const LendBorrow = require('../models/LendBorrow');
const IPO = require('../models/Ipo');
const { getCurrentBalance, getBlockedAmount, CREDIT_TYPES } = require('./balanceService');
const { getAllUpcomingDues } = require('./duesService');

const TRANSFER_TYPES = ['transfer_in', 'transfer_out'];

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

// Total balance across ALL of the user's bank accounts, combined,
// plus how much of that combined total is currently on hold for
// pending IPO applications.
const getTotalBankBalanceAndBlocked = async (userId) => {
  const accounts = await BankAccount.find({ userId, status: 'active' });
  const balances = await Promise.all(accounts.map((acc) => getCurrentBalance(acc)));
  const blocked = await Promise.all(accounts.map((acc) => getBlockedAmount(acc._id)));
  return {
    totalBankBalance: balances.reduce((sum, b) => sum + b, 0),
    totalBlockedInIPOs: blocked.reduce((sum, b) => sum + b, 0),
  };
};

// This month's income and expense totals, plus category breakdown -
// all computed with a single aggregation query rather than looping in JS
const getMonthlyTransactionSummary = async (userId) => {
  const { start, end } = getMonthRange();

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryBreakdown = {};

  const allTx = await Transaction.find({ userId, date: { $gte: start, $lte: end } });
  allTx.forEach((tx) => {
    // A transfer between your own accounts isn't real income or a real
    // expense - it just moves money you already had. Leave it out of
    // both totals entirely so it doesn't distort the monthly picture.
    if (TRANSFER_TYPES.includes(tx.type)) return;

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

// Pending IPO applications, soonest allotment date first - shown on the
// dashboard so upcoming allotment decisions aren't forgotten about.
const getPendingIPOs = async (userId) => {
  const ipos = await IPO.find({ userId, status: 'blocked' }).sort({ allotmentDate: 1 });
  return ipos;
};

// Assembles every piece into the single object the dashboard UI needs
const getDashboardData = async (userId) => {
  const [
    { totalBankBalance, totalBlockedInIPOs },
    { totalIncome, totalExpenses, categoryBreakdown },
    creditCardOutstanding,
    { moneyToReceive, moneyToPay },
    upcomingDues,
    pendingIPOs,
    recentTransactions,
  ] = await Promise.all([
    getTotalBankBalanceAndBlocked(userId),
    getMonthlyTransactionSummary(userId),
    getCreditCardOutstanding(userId),
    getMoneyToReceiveAndPay(userId),
    getAllUpcomingDues(userId),
    getPendingIPOs(userId),
    Transaction.find({ userId }).sort({ date: -1 }).limit(10),
  ]);

  // "Committed" = everything due that hasn't been paid yet (SIP, EMI, CC bill, borrow repayments)
  const totalPlannedCommitments = upcomingDues.reduce((sum, d) => sum + d.amount, 0);
  // Available funds now also excludes money on hold for IPO applications -
  // it's real balance, but not actually spendable right now.
  const availableFunds = totalBankBalance - totalPlannedCommitments - totalBlockedInIPOs;

  return {
    totalBankBalance,
    totalBlockedInIPOs,
    totalMonthlyIncome: totalIncome,
    totalMonthlyExpenses: totalExpenses,
    totalPlannedCommitments,
    creditCardOutstanding,
    moneyToReceive,
    moneyToPay,
    availableFunds,
    categoryWiseExpenses: categoryBreakdown,
    upcomingDues: upcomingDues.slice(0, 10),
    pendingIPOs,
    recentTransactions,
  };
};

module.exports = { getDashboardData, getMonthRange };