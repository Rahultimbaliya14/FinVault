const IPO = require('../models/Ipo');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const { getAvailableBalance } = require('../services/balanceService');

// POST /api/v1/ipos - apply for an IPO, blocking the amount in the account
exports.createIPO = async (req, res) => {
  try {
    const { accountId, ipoName, amountApplied, applicationDate, allotmentDate } = req.body;

    if (!accountId || !ipoName || !amountApplied || !allotmentDate) {
      return res.status(400).json({ message: 'accountId, ipoName, amountApplied, and allotmentDate are required' });
    }

    const account = await BankAccount.findOne({ _id: accountId, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Can't block more than what's actually available - prevents
    // applying for more IPOs than the account can really cover.
    const { availableBalance } = await getAvailableBalance(account);
    if (amountApplied > availableBalance) {
      return res.status(400).json({
        message: `Insufficient available balance. Only ₹${availableBalance.toLocaleString('en-IN')} is available (after existing holds).`,
      });
    }

    const ipo = await IPO.create({
      userId: req.user.id,
      accountId,
      ipoName,
      amountApplied,
      applicationDate,
      allotmentDate,
      status: 'blocked',
    });

    res.status(201).json({ message: 'IPO application recorded, amount blocked', ipo });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply for IPO', error: error.message });
  }
};

// GET /api/v1/ipos?status=blocked
exports.getIPOs = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const ipos = await IPO.find(filter).sort({ allotmentDate: 1 });
    res.status(200).json({ ipos });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch IPO applications', error: error.message });
  }
};

// PUT /api/v1/ipos/:id/allot - IPO was allotted: actually deduct the
// blocked amount now, converting the hold into a real transaction.
exports.markAllotted = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ipo) {
      return res.status(404).json({ message: 'IPO application not found' });
    }
    if (ipo.status !== 'blocked') {
      return res.status(409).json({ message: `This application is already marked as ${ipo.status}` });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      accountId: ipo.accountId,
      amount: ipo.amountApplied,
      type: 'expense',
      category: 'other',
      paymentMethod: 'other',
      date: ipo.allotmentDate,
      description: `IPO allotment: ${ipo.ipoName}`,
    });

    ipo.status = 'allotted';
    ipo.transactionId = transaction._id;
    await ipo.save();

    res.status(200).json({ message: 'Marked as allotted - amount deducted', ipo, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update IPO application', error: error.message });
  }
};

// PUT /api/v1/ipos/:id/not-allot - IPO was NOT allotted: just release
// the hold. No transaction, since the money was never actually spent.
exports.markNotAllotted = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ipo) {
      return res.status(404).json({ message: 'IPO application not found' });
    }
    if (ipo.status !== 'blocked') {
      return res.status(409).json({ message: `This application is already marked as ${ipo.status}` });
    }

    ipo.status = 'not_allotted';
    await ipo.save();

    res.status(200).json({ message: 'Marked as not allotted - hold released', ipo });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update IPO application', error: error.message });
  }
};

// DELETE /api/v1/ipos/:id - cancel an application while still blocked
// (e.g. applied by mistake). Releases the hold immediately.
exports.cancelIPO = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ipo) {
      return res.status(404).json({ message: 'IPO application not found' });
    }
    if (ipo.status !== 'blocked') {
      return res.status(409).json({ message: 'Only a still-blocked application can be cancelled' });
    }

    await IPO.findByIdAndDelete(ipo._id);
    res.status(200).json({ message: 'Application cancelled, hold released' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel application', error: error.message });
  }
};