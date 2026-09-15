const mongoose = require('mongoose');

// Refresh tokens are tracked in the DB (not just trusted as a signed JWT)
// so they can be individually revoked on logout, and so a stolen/rotated
// token can be invalidated - a pure stateless JWT can't be revoked early.
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// MongoDB automatically deletes the document once expiresAt has passed -
// keeps the collection from growing forever with dead tokens.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);