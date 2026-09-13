const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    // Every document is scoped to the user who owns it.
    // This is the core of tenant isolation - every query
    // in the controller MUST filter by this field.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['savings', 'current', 'salary', 'other'],
      default: 'savings',
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankAccount', bankAccountSchema);