const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document auto-deletes when expiresAt is reached
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

otpVerificationSchema.index({ email: 1, programId: 1 });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
