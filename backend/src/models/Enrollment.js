const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      required: [true, 'Program is required'],
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainee',
      required: [true, 'Trainee is required'],
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completionStatus: {
      type: String,
      enum: ['Enrolled', 'Attending', 'Completed', 'Dropped', 'Absent'],
      default: 'Enrolled',
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateNumber: {
      type: String,
      trim: true,
    },
    preTestScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    postTestScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      overallRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      contentRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      trainerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      venueRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: {
        type: String,
        maxlength: [500, 'Comments cannot exceed 500 characters'],
      },
      wouldRecommend: {
        type: Boolean,
      },
      submittedAt: Date,
    },
    impactAssessment: {
      skillImprovement: {
        type: Number,
        min: 1,
        max: 5,
      },
      jobApplicability: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: String,
      assessedAt: Date,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    nomination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nomination',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate enrollments
enrollmentSchema.index({ program: 1, trainee: 1 }, { unique: true });
enrollmentSchema.index({ program: 1 });
enrollmentSchema.index({ trainee: 1 });
enrollmentSchema.index({ completionStatus: 1 });

// Virtual: score improvement
enrollmentSchema.virtual('scoreImprovement').get(function () {
  if (this.preTestScore !== undefined && this.postTestScore !== undefined) {
    return this.postTestScore - this.preTestScore;
  }
  return null;
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
