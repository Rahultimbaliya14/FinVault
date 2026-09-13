const mongoose = require('mongoose');

const billingCycleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditCard',
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    // Sum of all purchases in this cycle - kept updated as
    // transactions are added, so we don't recompute it on every read
    statementAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'billed', 'paid', 'overdue'],
      default: 'open',
    },
  },
  { timestamps: true }
);

// One cycle per card per period - prevents duplicate cycles being created
billingCycleSchema.index({ cardId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

module.exports = mongoose.model('BillingCycle', billingCycleSchema);