const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    loanName: {
      type: String,
      required: true,
      trim: true,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    emiAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    numberOfInstallments: {
      type: Number,
      required: true,
    },
    // Day of the month the EMI is due, e.g. 7 = "7th of every month"
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'defaulted'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EMI', emiSchema);