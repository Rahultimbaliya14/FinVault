const BankAccount = require('../models/BankAccount');
const { getAvailableBalance } = require('../services/balanceService');

// POST /api/v1/accounts
exports.createAccount = async (req, res) => {
  try {
    const { bankName, accountName, accountType, initialBalance } = req.body;

    if (!bankName || !accountName) {
      return res.status(400).json({ message: 'Bank name and account name are required' });
    }

    const account = await BankAccount.create({
      userId: req.user.id,
      bankName,
      accountName,
      accountType,
      initialBalance: initialBalance || 0,
    });

    res.status(201).json({ message: 'Account created', account });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create account', error: error.message });
  }
};

// GET /api/v1/accounts
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ userId: req.user.id });

    // currentBalance = actual money based on real transactions.
    // blockedAmount = held for pending IPO applications (not yet spent).
    // availableBalance = what's actually free to spend right now.
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const balances = await getAvailableBalance(account);
        return { ...account.toObject(), ...balances };
      })
    );

    res.status(200).json({ accounts: accountsWithBalance });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch accounts', error: error.message });
  }
};

// GET /api/v1/accounts/:id
exports.getAccountById = async (req, res) => {
  try {
    const account = await BankAccount.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const balances = await getAvailableBalance(account);

    res.status(200).json({ account: { ...account.toObject(), ...balances } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch account', error: error.message });
  }
};

// PUT /api/v1/accounts/:id
exports.updateAccount = async (req, res) => {
  try {
    const { bankName, accountName, accountType, status } = req.body;

    const account = await BankAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { bankName, accountName, accountType, status },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({ message: 'Account updated', account });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update account', error: error.message });
  }
};

// DELETE /api/v1/accounts/:id
exports.deleteAccount = async (req, res) => {
  try {
    const account = await BankAccount.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
};