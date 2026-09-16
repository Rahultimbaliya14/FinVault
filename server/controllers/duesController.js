const { getAllUpcomingDues } = require('../services/duesService');
const SIP = require('../models/SIP');
const EMI = require('../models/EMI');
const Transaction = require('../models/Transaction');
const CommitmentAction = require('../models/CommitmentAction');
const { getDateInMonth } = require('../services/dueDateService');

// GET /api/v1/dues?month=10&year=2026
// month is 1-indexed here (10 = October) since that's how humans and
// frontend dropdowns naturally think about months - converted to
// JS's 0-indexed convention right before calling the service.
exports.getDues = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetYear = year ? Number(year) : undefined;
    const targetMonth = month ? Number(month) - 1 : undefined;

    const dues = await getAllUpcomingDues(req.user.id, targetYear, targetMonth);
    const totalDue = dues.reduce((sum, d) => sum + d.amount, 0);

    res.status(200).json({ count: dues.length, totalDue, dues });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dues', error: error.message });
  }
};

// Looks up the SIP or EMI and returns the bits every action below needs:
// its label, amount, day-of-month, and which account it debits from.
const getCommitmentDetails = async (refType, refId, userId) => {
  if (refType === 'sip') {
    const sip = await SIP.findOne({ _id: refId, userId });
    if (!sip) return null;
    return { label: sip.sipName, amount: sip.amount, dayOfMonth: sip.sipDate, accountId: sip.accountId };
  }
  if (refType === 'emi') {
    const emi = await EMI.findOne({ _id: refId, userId });
    if (!emi) return null;
    return { label: emi.loanName, amount: emi.emiAmount, dayOfMonth: emi.dueDate, accountId: emi.accountId };
  }
  return null;
};

// POST /api/v1/dues/:refType/:refId/pay
// Marks this month's occurrence as paid AND creates the actual expense
// transaction, deducting it from the linked account immediately.
exports.markDuePaid = async (req, res) => {
  try {
    const { refType, refId } = req.params;
    const now = new Date();
    const month = req.body.month || now.getMonth() + 1;
    const year = req.body.year || now.getFullYear();

    if (!['sip', 'emi'].includes(refType)) {
      return res.status(400).json({ message: 'refType must be sip or emi' });
    }

    const existing = await CommitmentAction.findOne({ refType, refId, month, year });
    if (existing) {
      return res.status(409).json({ message: `This period is already marked as ${existing.status}` });
    }

    const details = await getCommitmentDetails(refType, refId, req.user.id);
    if (!details) {
      return res.status(404).json({ message: `${refType.toUpperCase()} not found` });
    }

    const transactionDate = getDateInMonth(details.dayOfMonth, year, month - 1);

    const transaction = await Transaction.create({
      userId: req.user.id,
      accountId: details.accountId,
      amount: details.amount,
      type: 'expense',
      category: 'other',
      paymentMethod: 'net_banking',
      date: transactionDate,
      description: `${refType === 'sip' ? 'SIP' : 'EMI'} payment: ${details.label}`,
    });

    const action = await CommitmentAction.create({
      userId: req.user.id,
      refType,
      refId,
      month,
      year,
      status: 'paid',
      transactionId: transaction._id,
    });

    res.status(201).json({ message: 'Marked as paid', action, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as paid', error: error.message });
  }
};

// POST /api/v1/dues/:refType/:refId/skip
// Dismisses this month's occurrence WITHOUT creating a transaction -
// for when a SIP was paused, an EMI payment was waived, etc.
exports.markDueSkipped = async (req, res) => {
  try {
    const { refType, refId } = req.params;
    const now = new Date();
    const month = req.body.month || now.getMonth() + 1;
    const year = req.body.year || now.getFullYear();

    if (!['sip', 'emi'].includes(refType)) {
      return res.status(400).json({ message: 'refType must be sip or emi' });
    }

    const existing = await CommitmentAction.findOne({ refType, refId, month, year });
    if (existing) {
      return res.status(409).json({ message: `This period is already marked as ${existing.status}` });
    }

    const details = await getCommitmentDetails(refType, refId, req.user.id);
    if (!details) {
      return res.status(404).json({ message: `${refType.toUpperCase()} not found` });
    }

    const action = await CommitmentAction.create({
      userId: req.user.id,
      refType,
      refId,
      month,
      year,
      status: 'skipped',
    });

    res.status(201).json({ message: 'Marked as skipped', action });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as skipped', error: error.message });
  }
};