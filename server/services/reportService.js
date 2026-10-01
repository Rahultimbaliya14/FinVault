const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const SIP = require('../models/SIP');
const EMI = require('../models/EMI');
const BillingCycle = require('../models/BillingCycle');
const CardTransaction = require('../models/CardTransaction');
const LendBorrow = require('../models/LendBorrow');
const CommitmentAction = require('../models/CommitmentAction');
const { getBalanceAsOf, CREDIT_TYPES } = require('./balanceService');
const { getDateInMonth } = require('./dueDateService');
const { getEffectiveStatus } = require('./billingCycleService');

// Neither internal transfers NOR lend/borrow money movement count as
// real income or expense - same reasoning as the dashboard.
const EXCLUDED_FROM_TOTALS = ['transfer_in', 'transfer_out', 'loan_given', 'loan_received'];

const getMonthBounds = (year, monthIndex) => {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59);
  return { start, end };
};

const existedByMonth = (createdAt, year, monthIndex) => {
  const created = new Date(createdAt);
  const createdMonthIndex = created.getFullYear() * 12 + created.getMonth();
  const targetMonthIndex = year * 12 + monthIndex;
  return createdMonthIndex <= targetMonthIndex;
};

const getMonthlyReport = async (userId, year, monthIndex) => {
  const { start, end } = getMonthBounds(year, monthIndex);
  const monthLabel = start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const monthTransactions = await Transaction.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });

  let totalIncome = 0;
  let totalExpenses = 0;
  const expenseCategoryBreakdown = {};
  const incomeCategoryBreakdown = {};

  monthTransactions.forEach((tx) => {
    if (EXCLUDED_FROM_TOTALS.includes(tx.type)) return;
    if (CREDIT_TYPES.includes(tx.type)) {
      totalIncome += tx.amount;
      incomeCategoryBreakdown[tx.category] = (incomeCategoryBreakdown[tx.category] || 0) + tx.amount;
    } else {
      totalExpenses += tx.amount;
      expenseCategoryBreakdown[tx.category] = (expenseCategoryBreakdown[tx.category] || 0) + tx.amount;
    }
  });

  const allAccounts = await BankAccount.find({ userId, status: 'active' });
  const accountsThatExisted = allAccounts.filter((acc) => existedByMonth(acc.createdAt, year, monthIndex));
  const balances = await Promise.all(accountsThatExisted.map((acc) => getBalanceAsOf(acc, end)));
  const closingBankBalance = balances.reduce((sum, b) => sum + b, 0);

  const allSips = await SIP.find({ userId, status: 'active' });
  const sips = allSips.filter((sip) => existedByMonth(sip.createdAt, year, monthIndex));
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

  const allEmis = await EMI.find({ userId, status: 'active' });
  const emis = allEmis.filter((emi) => existedByMonth(emi.createdAt, year, monthIndex));
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

  const allCycles = await BillingCycle.find({ userId }).populate('cardId', 'cardName');
  const cyclesInMonth = allCycles.filter((cycle) => {
    const d = new Date(cycle.dueDate);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
  const cycleReport = await Promise.all(
    cyclesInMonth.map(async (cycle) => {
      const cardTransactions = await CardTransaction.find({ billingCycleId: cycle._id }).sort({ date: 1 });
      return {
        cardName: cycle.cardId ? cycle.cardId.cardName : 'Credit Card',
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        dueDate: cycle.dueDate,
        amount: cycle.statementAmount,
        status: getEffectiveStatus(cycle),
        transactions: cardTransactions.map((tx) => ({
          amount: tx.amount,
          date: tx.date,
          description: tx.description,
          category: tx.category,
        })),
      };
    })
  );

  const allLendBorrow = await LendBorrow.find({ userId });
  let repaymentsReceived = 0;
  let repaymentsPaid = 0;
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
      closingBankBalance,
      transactionCount: monthTransactions.filter((tx) => !EXCLUDED_FROM_TOTALS.includes(tx.type)).length,
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