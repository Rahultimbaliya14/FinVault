const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');

// Confirms the account belongs to the requesting user BEFORE letting
// them attach a transaction to it. Without this, a user could pass
// someone else's accountId and post transactions into their account.
const verifyAccountOwnership = async (accountId, userId) => {
  const account = await BankAccount.findOne({ _id: accountId, userId });
  return account;
};

// POST /api/v1/transactions/transfer - move money between two of the
// user's OWN accounts. Creates two linked records: a debit on the
// source account and a credit on the destination account, sharing a
// transferGroupId so they display and delete together.
exports.createTransfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, date, description } = req.body;

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: 'Source and destination accounts must be different' });
    }

    const [fromAccount, toAccount] = await Promise.all([
      verifyAccountOwnership(fromAccountId, req.user.id),
      verifyAccountOwnership(toAccountId, req.user.id),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: 'One or both accounts were not found' });
    }

    const transferGroupId = new mongoose.Types.ObjectId();
    const transferDate = date ? new Date(date) : new Date();

    // Create the debit (source) first. If the credit fails to save,
    // roll the debit back manually rather than leaving one half orphaned.
    const outTransaction = await Transaction.create({
      userId: req.user.id,
      accountId: fromAccountId,
      amount,
      type: 'transfer_out',
      category: 'other',
      paymentMethod: 'other',
      date: transferDate,
      description: description ? `Transfer to ${toAccount.accountName}: ${description}` : `Transfer to ${toAccount.accountName}`,
      transferGroupId,
    });

    try {
      const inTransaction = await Transaction.create({
        userId: req.user.id,
        accountId: toAccountId,
        amount,
        type: 'transfer_in',
        category: 'other',
        paymentMethod: 'other',
        date: transferDate,
        description: description ? `Transfer from ${fromAccount.accountName}: ${description}` : `Transfer from ${fromAccount.accountName}`,
        transferGroupId,
      });

      res.status(201).json({ message: 'Transfer completed', outTransaction, inTransaction });
    } catch (innerError) {
      // Second half failed - undo the first half so accounts stay balanced
      await Transaction.findByIdAndDelete(outTransaction._id);
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete transfer', error: error.message });
  }
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
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // If this is one half of a transfer, delete both halves together -
    // leaving one side alone would silently unbalance both accounts.
    if (transaction.transferGroupId) {
      await Transaction.deleteMany({
        transferGroupId: transaction.transferGroupId,
        userId: req.user.id,
      });
      return res.status(200).json({ message: 'Transfer deleted (both linked entries removed)' });
    }

    await Transaction.findByIdAndDelete(transaction._id);
    res.status(200).json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
};