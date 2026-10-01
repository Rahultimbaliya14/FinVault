const LendBorrow = require('../models/LendBorrow');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');

const attachRemaining = (record) => {
  const totalRepaid = record.repayments.reduce((sum, r) => sum + r.amount, 0);
  return {
    ...record.toObject(),
    totalRepaid,
    remainingAmount: record.amount - totalRepaid,
  };
};

// POST /api/v1/lend-borrow
// If accountId is provided, the INITIAL money movement is recorded as a
// real transaction immediately:
//   - 'lend'   : money leaves your account right now (you're handing it over) -> loan_given
//   - 'borrow' : money enters your account right now (you're receiving it) -> loan_received
// Without accountId, it's tracked exactly as before with no account impact.
exports.createRecord = async (req, res) => {
  try {
    const { personName, type, amount, date, expectedRepaymentDate, description, accountId } = req.body;

    if (!personName || !type || !amount) {
      return res.status(400).json({ message: 'personName, type, and amount are required' });
    }

    let transactionId;
    const recordDate = date ? new Date(date) : new Date();

    if (accountId) {
      const account = await BankAccount.findOne({ _id: accountId, userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const transaction = await Transaction.create({
        userId: req.user.id,
        accountId,
        amount,
        type: type === 'lend' ? 'loan_given' : 'loan_received',
        category: 'other',
        paymentMethod: 'other',
        date: recordDate,
        description:
          type === 'lend' ? `Lent to ${personName}` : `Borrowed from ${personName}`,
      });
      transactionId = transaction._id;
    }

    const record = await LendBorrow.create({
      userId: req.user.id,
      personName,
      type,
      amount,
      date: recordDate,
      expectedRepaymentDate,
      description,
      accountId: accountId || undefined,
      transactionId,
    });

    res.status(201).json({ message: 'Record created', record });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create record', error: error.message });
  }
};

// GET /api/v1/lend-borrow?type=lend|borrow&status=pending
exports.getRecords = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { userId: req.user.id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const records = await LendBorrow.find(filter).sort({ date: -1 });
    res.status(200).json({ records: records.map(attachRemaining) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch records', error: error.message });
  }
};

// POST /api/v1/lend-borrow/:id/repayments
// Settlement direction is the OPPOSITE of creation:
//   - 'lend'   repayment : money comes BACK to you -> loan_received
//   - 'borrow' repayment : you pay money OUT        -> loan_given
// Both loan_given/loan_received are excluded from income/expense totals
// everywhere (dashboard, reports) since lending/borrowing moves capital
// you owe or are owed, not money you earned or spent.
exports.addRepayment = async (req, res) => {
  try {
    const { amount, date, note, accountId } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'amount is required' });
    }

    const record = await LendBorrow.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const repaymentDate = date ? new Date(date) : new Date();
    let transactionId;

    if (accountId) {
      const account = await BankAccount.findOne({ _id: accountId, userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const transaction = await Transaction.create({
        userId: req.user.id,
        accountId,
        amount,
        type: record.type === 'lend' ? 'loan_received' : 'loan_given',
        category: 'other',
        paymentMethod: 'other',
        date: repaymentDate,
        description:
          record.type === 'lend'
            ? `Repayment received from ${record.personName}`
            : `Repayment paid to ${record.personName}`,
      });
      transactionId = transaction._id;
    }

    record.repayments.push({ amount, date: repaymentDate, note, accountId, transactionId });

    const totalRepaid = record.repayments.reduce((sum, r) => sum + r.amount, 0);
    if (totalRepaid >= record.amount) {
      record.status = 'settled';
    } else if (totalRepaid > 0) {
      record.status = 'partial';
    }

    await record.save();

    res.status(200).json({ message: 'Repayment recorded', record: attachRemaining(record) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record repayment', error: error.message });
  }
};

// DELETE /api/v1/lend-borrow/:id
exports.deleteRecord = async (req, res) => {
  try {
    const record = await LendBorrow.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.status(200).json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete record', error: error.message });
  }
};