const mongoose = require('mongoose');

const trainingProgramSchema = new mongoose.Schema(
  {
    programCode: {
      type: String,
      required: [true, 'Program code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Program title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Technical Training',
        'Leadership Development',
        'Soft Skills',
        'Compliance',
        'Safety',
        'Research Methodology',
        'IT & Digital Skills',
        'Management Development',
        'Other',
      ],
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Offline',
    },
    venue: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    durationDays: {
      type: Number,
    },
    coordinatorName: {
      type: String,
      trim: true,
    },
    coordinatorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    targetAudience: {
      type: String,
      trim: true,
    },
    maxParticipants: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'],
      default: 'Scheduled',
    },
    outcomes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-calculate duration
trainingProgramSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diff = this.endDate - this.startDate;
    this.durationDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

// Virtual: completion rate
trainingProgramSchema.virtual('completionRate').get(function () {
  if (!this.enrolledCount || this.enrolledCount === 0) return 0;
  return Math.round((this.completedCount / this.enrolledCount) * 100);
});

trainingProgramSchema.index({ status: 1 });
trainingProgramSchema.index({ startDate: 1 });
trainingProgramSchema.index({ state: 1 });

module.exports = mongoose.model('TrainingProgram', trainingProgramSchema);
