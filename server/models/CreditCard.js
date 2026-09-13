const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardName: {
      type: String,
      required: true,
      trim: true,
    },
    creditLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    // Day of the month the statement is generated, e.g. 15 = "15th"
    billingDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    // Day of the month payment is due, ALWAYS in the month after billingDate
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CreditCard', creditCardSchema);