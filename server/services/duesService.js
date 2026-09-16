const SIP = require('../models/SIP');
const EMI = require('../models/EMI');
const BillingCycle = require('../models/BillingCycle');
const LendBorrow = require('../models/LendBorrow');
const CommitmentAction = require('../models/CommitmentAction');
const { daysUntil, getDateInMonth } = require('./dueDateService');

const isSameMonth = (date, year, monthIndex) => {
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() === monthIndex;
};

// Pulls every financial obligation across the whole app into ONE
// normalized shape: { type, label, amount, dueDate, daysUntilDue, refId }
// for a SPECIFIC month. Defaults to the current month/year when no
// target is given, so existing callers (dashboard) keep working unchanged.
//
// targetMonth is 0-indexed (0 = January), matching JS Date conventions.
const getAllUpcomingDues = async (userId, targetYear, targetMonth) => {
  const now = new Date();
  const year = targetYear ?? now.getFullYear();
  const monthIndex = targetMonth ?? now.getMonth();
  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth();

  // SIP/EMI decisions already made for this exact period - anything
  // marked paid or skipped here should NOT show up as still due.
  const handledActions = await CommitmentAction.find({
    userId,
    month: monthIndex + 1,
    year,
  });
  const isHandled = (refType, refId) =>
    handledActions.some((a) => a.refType === refType && String(a.refId) === String(refId));

  const dues = [];

  // --- SIPs: generate this SIP's date directly within the target month ---
  const sips = await SIP.find({ userId, status: 'active' });
  sips.forEach((sip) => {
    if (isHandled('sip', sip._id)) return;
    const dueDate = getDateInMonth(sip.sipDate, year, monthIndex);
    dues.push({
      type: 'sip',
      label: sip.sipName,
      amount: sip.amount,
      dueDate,
      daysUntilDue: daysUntil(dueDate),
      refId: sip._id,
    });
  });

  // --- EMIs: same approach ---
  const emis = await EMI.find({ userId, status: 'active' });
  emis.forEach((emi) => {
    if (isHandled('emi', emi._id)) return;
    const dueDate = getDateInMonth(emi.dueDate, year, monthIndex);
    dues.push({
      type: 'emi',
      label: emi.loanName,
      amount: emi.emiAmount,
      dueDate,
      daysUntilDue: daysUntil(dueDate),
      refId: emi._id,
    });
  });

  // --- Credit card bills: only cycles whose due date actually falls in this month ---
  // Overdue (unpaid, past-month) cycles still surface when viewing the
  // current month, so nothing owed silently disappears.
  const unpaidCycles = await BillingCycle.find({ userId, status: { $ne: 'paid' } }).populate('cardId', 'cardName');
  unpaidCycles.forEach((cycle) => {
    const belongsToTargetMonth = isSameMonth(cycle.dueDate, year, monthIndex);
    const isOverdueIntoCurrentView = isCurrentMonth && new Date(cycle.dueDate) < now;
    if (!belongsToTargetMonth && !isOverdueIntoCurrentView) return;

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
  // Records WITH an expected date are shown only in their matching month
  // (or in the current month view if overdue). Records with NO expected
  // date have no natural month, so they only show on the current month.
  const borrowRecords = await LendBorrow.find({ userId, type: 'borrow', status: { $ne: 'settled' } });
  borrowRecords.forEach((record) => {
    const totalRepaid = record.repayments.reduce((sum, r) => sum + r.amount, 0);
    const remaining = record.amount - totalRepaid;

    if (record.expectedRepaymentDate) {
      const belongsToTargetMonth = isSameMonth(record.expectedRepaymentDate, year, monthIndex);
      const isOverdueIntoCurrentView = isCurrentMonth && new Date(record.expectedRepaymentDate) < now;
      if (!belongsToTargetMonth && !isOverdueIntoCurrentView) return;
    } else if (!isCurrentMonth) {
      return;
    }

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