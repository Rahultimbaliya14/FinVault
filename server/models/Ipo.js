const mongoose = require('mongoose');

const ipoSchema = new mongoose.Schema(
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
    ipoName: {
      type: String,
      required: true,
      trim: true,
    },
    amountApplied: {
      type: Number,
      required: true,
      min: 0,
    },
    applicationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    allotmentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['blocked', 'allotted', 'not_allotted'],
      default: 'blocked',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IPO', ipoSchema);