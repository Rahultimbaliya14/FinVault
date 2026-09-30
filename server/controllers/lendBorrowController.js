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
exports.createRecord = async (req, res) => {
  try {
    const { personName, type, amount, date, expectedRepaymentDate, description } = req.body;

    if (!personName || !type || !amount) {
      return res.status(400).json({ message: 'personName, type, and amount are required' });
    }

    const record = await LendBorrow.create({
      userId: req.user.id,
      personName,
      type,
      amount,
      date,
      expectedRepaymentDate,
      description,
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

// POST /api/v1/lend-borrow/:id/repayments - add a partial or full repayment.
// If accountId is provided, this ALSO creates a real transaction that
// actually moves money: a 'lend' repayment credits the account (you're
// getting money back), a 'borrow' repayment debits it (you're paying
// money out). Without accountId, it's tracked as before with no
// account impact - both behaviors are supported.
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
        // lend repayment = money coming back to you = a credit ('refund'
        // fits better than 'income', since it's your own principal
        // returning, not new earnings). borrow repayment = you paying
        // money out = a real expense.
        type: record.type === 'lend' ? 'refund' : 'expense',
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