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
    // 'transfer_in'/'transfer_out' are used exclusively by the internal
    // account-to-account transfer feature.
    // 'loan_given'/'loan_received' are used exclusively by the Lending &
    // Borrowing feature, covering BOTH directions of money movement:
    //   loan_given    = money leaving your account (lending money out,
    //                   OR paying back money you borrowed)
    //   loan_received = money entering your account (receiving borrowed
    //                   money, OR getting repaid on money you lent)
    // Neither is ever picked directly by the user in the regular
    // add-transaction form - both are created only by their respective features.
    type: {
      type: String,
      enum: [
        'income',
        'expense',
        'upi_expense',
        'bank_transfer',
        'refund',
        'transfer_out',
        'transfer_in',
        'loan_given',
        'loan_received',
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
      enum: ['cash', 'upi', 'debit_card', 'net_banking', 'neft', 'rtgs', 'imps', 'cheque', 'other'],
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
    transferGroupId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, accountId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);