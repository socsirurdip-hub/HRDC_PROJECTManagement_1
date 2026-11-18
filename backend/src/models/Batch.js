const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      required: [true, 'Program is required'],
      index: true,
    },
    batchCode: {
      type: String,
      required: [true, 'Batch code is required'],
      trim: true,
      uppercase: true,
    },
    batchName: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Batch start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Batch end date is required'],
    },
    durationDays: {
      type: Number,
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Batch max capacity is required'],
      default: 30,
    },
    assignedCount: {
      type: Number,
      default: 0,
    },
    venueOrMeetingLink: {
      type: String,
      trim: true,
    },
    coordinatorInCharge: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate duration
batchSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diff = this.endDate - this.startDate;
    this.durationDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

batchSchema.index({ program: 1, batchCode: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
