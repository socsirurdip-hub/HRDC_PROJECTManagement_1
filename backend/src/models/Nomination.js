const mongoose = require('mongoose');

const nominationSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      required: [true, 'Program is required'],
      index: true,
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainee',
      required: [true, 'Trainee is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['INVITED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'WAITLISTED'],
      default: 'SUBMITTED',
      index: true,
    },
    invitationDetails: {
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      invitedAt: { type: Date, default: Date.now },
      channel: {
        type: String,
        enum: ['DIRECT_SELECT', 'CRITERIA_BROADCAST', 'OPEN_LINK'],
        default: 'DIRECT_SELECT',
      },
      targetCriteria: {
        organization: String,
        designation: String,
        state: String,
      },
    },
    willingnessDetails: {
      statementOfPurpose: {
        type: String,
        maxlength: [1000, 'Statement cannot exceed 1000 characters'],
        trim: true,
      },
      reportingOfficerName: {
        type: String,
        trim: true,
      },
      reportingOfficerDesignation: {
        type: String,
        trim: true,
      },
      reportingOfficerEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      accommodationRequired: {
        type: Boolean,
        default: false,
      },
      specialAssistance: {
        type: String,
        trim: true,
      },
    },
    assignedBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    mappedEnrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate nominations for the same program by the same trainee
nominationSchema.index({ program: 1, trainee: 1 }, { unique: true });
nominationSchema.index({ program: 1, status: 1 });

module.exports = mongoose.model('Nomination', nominationSchema);
