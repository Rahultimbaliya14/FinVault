const SIP = require('../models/SIP');
const EMI = require('../models/EMI');
const BillingCycle = require('../models/BillingCycle');
const LendBorrow = require('../models/LendBorrow');
const { getNextOccurrence, daysUntil } = require('./dueDateService');

// Pulls every upcoming financial obligation across the whole app into
// ONE normalized shape: { type, label, amount, dueDate, daysUntilDue, refId }
// This is the single source the Dashboard and "Upcoming Dues" screen both use -
// neither of them talks to SIP/EMI/CreditCard/LendBorrow directly.
const getAllUpcomingDues = async (userId) => {
  const dues = [];

  // --- SIPs ---
  const sips = await SIP.find({ userId, status: 'active' });
  sips.forEach((sip) => {
    const nextDueDate = getNextOccurrence(sip.sipDate);
    dues.push({
      type: 'sip',
      label: sip.sipName,
      amount: sip.amount,
      dueDate: nextDueDate,
      daysUntilDue: daysUntil(nextDueDate),
      refId: sip._id,
    });
  });

  // --- EMIs ---
  const emis = await EMI.find({ userId, status: 'active' });
  emis.forEach((emi) => {
    const nextDueDate = getNextOccurrence(emi.dueDate);
    dues.push({
      type: 'emi',
      label: emi.loanName,
      amount: emi.emiAmount,
      dueDate: nextDueDate,
      daysUntilDue: daysUntil(nextDueDate),
      refId: emi._id,
    });
  });

  // --- Credit card bills (unpaid cycles only) ---
  const unpaidCycles = await BillingCycle.find({ userId, status: { $ne: 'paid' } }).populate(
    'cardId',
    'cardName'
  );
  unpaidCycles.forEach((cycle) => {
    dues.push({
      type: 'credit_card_bill',
      label: cycle.cardId ? cycle.cardId.cardName : 'Credit Card',
      amount: cycle.statementAmount,
      dueDate: cycle.dueDate,
      daysUntilDue: daysUntil(cycle.dueDate),
      refId: cycle._id,
    });
  });

  // --- Money I have to pay (borrow records not yet settled) ---
  const borrowRecords = await LendBorrow.find({
    userId,
    type: 'borrow',
    status: { $ne: 'settled' },
  });
  borrowRecords.forEach((record) => {
    const totalRepaid = record.repayments.reduce((sum, r) => sum + r.amount, 0);
    const remaining = record.amount - totalRepaid;
    dues.push({
      type: 'borrow_repayment',
      label: `Repay ${record.personName}`,
      amount: remaining,
      dueDate: record.expectedRepaymentDate || null,
      daysUntilDue: record.expectedRepaymentDate ? daysUntil(record.expectedRepaymentDate) : null,
      refId: record._id,
    });
  });

  // Sort by due date ascending; items with no due date go last
  dues.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return dues;
};

module.exports = { getAllUpcomingDues };