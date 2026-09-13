const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');

// Confirms the account belongs to the requesting user BEFORE letting
// them attach a transaction to it. Without this, a user could pass
// someone else's accountId and post transactions into their account.
const verifyAccountOwnership = async (accountId, userId) => {
  const account = await BankAccount.findOne({ _id: accountId, userId });
  return account;
};

// POST /api/v1/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { accountId, amount, type, category, paymentMethod, date, description } = req.body;

    if (!accountId || !amount || !type) {
      return res.status(400).json({ message: 'accountId, amount, and type are required' });
    }

    const account = await verifyAccountOwnership(accountId, req.user.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      accountId,
      amount,
      type,
      category,
      paymentMethod,
      date,
      description,
    });

    res.status(201).json({ message: 'Transaction recorded', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
};

// GET /api/v1/transactions?accountId=&category=&type=&from=&to=
exports.getTransactions = async (req, res) => {
  try {
    const { accountId, category, type, from, to } = req.query;

    // Always scoped to req.user.id first - optional filters just narrow it further
    const filter = { userId: req.user.id };

    if (accountId) filter.accountId = accountId;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    res.status(200).json({ count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

// GET /api/v1/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transaction', error: error.message });
  }
};

// PUT /api/v1/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, paymentMethod, date, description } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { amount, type, category, paymentMethod, date, description },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update transaction', error: error.message });
  }
};

// DELETE /api/v1/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
};