const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // 'income' and 'refund' ADD to balance. Everything else SUBTRACTS.
    // Keeping this list here (not scattered across the codebase) makes
    // it a single source of truth when we add more types later.
    type: {
      type: String,
      enum: [
        'income',
        'expense',
        'upi_expense',
        'bank_transfer',
        'refund',
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'food',
        'shopping',
        'travel',
        'entertainment',
        'utilities',
        'medical',
        'fuel',
        'online_purchase',
        'salary',
        'other',
      ],
      default: 'other',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'debit_card', 'net_banking', 'other'],
      default: 'other',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Speeds up the two most common queries: "all transactions for this
// account" and "all transactions for this user in a date range"
transactionSchema.index({ userId: 1, accountId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);