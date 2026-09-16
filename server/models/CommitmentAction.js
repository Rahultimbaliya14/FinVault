const mongoose = require('mongoose');

// SIPs and EMIs are recurring rules (e.g. "10th of every month"), not
// individual events - there's no document representing "September's
// SIP" on its own. This model records the user's decision (paid or
// skipped) for ONE specific occurrence, so the dues list knows not to
// keep showing something that's already been handled.
const commitmentActionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refType: {
      type: String,
      enum: ['sip', 'emi'],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Which occurrence this action applies to - month is 1-indexed
    // (1 = January) to match how the rest of the app's API talks about months.
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'skipped'],
      required: true,
    },
    // Only set when status is 'paid' - links to the transaction that
    // was created to actually deduct the money.
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  { timestamps: true }
);

// One decision per commitment per period - prevents double-marking
// the same month's SIP as both paid and skipped, or paid twice.
commitmentActionSchema.index({ refType: 1, refId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('CommitmentAction', commitmentActionSchema);