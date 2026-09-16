const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const SIP = require('../models/SIP');
const EMI = require('../models/EMI');
const BillingCycle = require('../models/BillingCycle');
const LendBorrow = require('../models/LendBorrow');
const CommitmentAction = require('../models/CommitmentAction');
const CreditCard = require('../models/CreditCard');
const { getCurrentBalance, CREDIT_TYPES } = require('./balanceService');
const { getDateInMonth } = require('./dueDateService');

const TRANSFER_TYPES = ['transfer_in', 'transfer_out'];

const getMonthBounds = (year, monthIndex) => {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59);
  return { start, end };
};

// Builds a complete picture of everything that happened (or was due)
// in ONE month - the single source the Reports page renders from.
const getMonthlyReport = async (userId, year, monthIndex) => {
  const { start, end } = getMonthBounds(year, monthIndex);
  const monthLabel = start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // --- Income / Expenses / Category breakdown for the month ---
  const monthTransactions = await Transaction.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });

  let totalIncome = 0;
  let totalExpenses = 0;
  const expenseCategoryBreakdown = {};
  const incomeCategoryBreakdown = {};

  monthTransactions.forEach((tx) => {
    if (TRANSFER_TYPES.includes(tx.type)) return; // internal transfers are balance-neutral, excluded
    if (CREDIT_TYPES.includes(tx.type)) {
      totalIncome += tx.amount;
      incomeCategoryBreakdown[tx.category] = (incomeCategoryBreakdown[tx.category] || 0) + tx.amount;
    } else {
      totalExpenses += tx.amount;
      expenseCategoryBreakdown[tx.category] = (expenseCategoryBreakdown[tx.category] || 0) + tx.amount;
    }
  });

  // --- Current total bank balance (a live snapshot, not historical) ---
  const accounts = await BankAccount.find({ userId, status: 'active' });
  const balances = await Promise.all(accounts.map((acc) => getCurrentBalance(acc)));
  const totalBankBalance = balances.reduce((sum, b) => sum + b, 0);

  // --- SIPs: paid / skipped / pending for this specific month ---
  const sips = await SIP.find({ userId, status: 'active' });
  const sipActions = await CommitmentAction.find({ userId, refType: 'sip', month: monthIndex + 1, year });
  const sipReport = sips.map((sip) => {
    const action = sipActions.find((a) => String(a.refId) === String(sip._id));
    return {
      name: sip.sipName,
      amount: sip.amount,
      dueDate: getDateInMonth(sip.sipDate, year, monthIndex),
      status: action ? action.status : 'pending',
    };
  });

  // --- EMIs: same treatment ---
  const emis = await EMI.find({ userId, status: 'active' });
  const emiActions = await CommitmentAction.find({ userId, refType: 'emi', month: monthIndex + 1, year });
  const emiReport = emis.map((emi) => {
    const action = emiActions.find((a) => String(a.refId) === String(emi._id));
    return {
      name: emi.loanName,
      amount: emi.emiAmount,
      dueDate: getDateInMonth(emi.dueDate, year, monthIndex),
      status: action ? action.status : 'pending',
    };
  });

  // --- Credit card bills whose due date fell in this month ---
  const allCycles = await BillingCycle.find({ userId }).populate('cardId', 'cardName');
  const cycleReport = allCycles
    .filter((cycle) => {
      const d = new Date(cycle.dueDate);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    })
    .map((cycle) => ({
      cardName: cycle.cardId ? cycle.cardId.cardName : 'Credit Card',
      periodStart: cycle.periodStart,
      periodEnd: cycle.periodEnd,
      dueDate: cycle.dueDate,
      amount: cycle.statementAmount,
      status: cycle.status,
    }));

  // --- Lending & borrowing activity that happened during this month ---
  // Both new records created this month, AND repayments logged this
  // month against records created anytime.
  const allLendBorrow = await LendBorrow.find({ userId });
  let repaymentsReceived = 0; // on 'lend' records - money coming back to you
  let repaymentsPaid = 0; // on 'borrow' records - money you paid back
  const newRecordsThisMonth = [];

  allLendBorrow.forEach((record) => {
    if (record.date >= start && record.date <= end) {
      newRecordsThisMonth.push({
        personName: record.personName,
        type: record.type,
        amount: record.amount,
        date: record.date,
      });
    }
    record.repayments.forEach((repayment) => {
      if (repayment.date >= start && repayment.date <= end) {
        if (record.type === 'lend') repaymentsReceived += repayment.amount;
        else repaymentsPaid += repayment.amount;
      }
    });
  });

  return {
    period: { month: monthIndex + 1, year, label: monthLabel },
    summary: {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      totalBankBalance,
      transactionCount: monthTransactions.filter((tx) => !TRANSFER_TYPES.includes(tx.type)).length,
    },
    expenseCategoryBreakdown,
    incomeCategoryBreakdown,
    sips: sipReport,
    emis: emiReport,
    creditCardBills: cycleReport,
    lendingBorrowing: {
      newRecords: newRecordsThisMonth,
      repaymentsReceived,
      repaymentsPaid,
    },
    transactions: monthTransactions,
  };
};

module.exports = { getMonthlyReport };