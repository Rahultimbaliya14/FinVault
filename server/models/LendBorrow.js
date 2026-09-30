const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true },
    // Optional - if the user links this repayment to a real bank
    // account, a matching Transaction is created (money actually
    // added/deducted), and its id is stored here for reference.
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { _id: true }
);

const lendBorrowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    // 'lend' = money I gave out, I will RECEIVE it back
    // 'borrow' = money I took, I will PAY it back
    type: {
      type: String,
      enum: ['lend', 'borrow'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedRepaymentDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'settled'],
      default: 'pending',
    },
    repayments: [repaymentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('LendBorrow', lendBorrowSchema);