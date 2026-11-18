const mongoose = require('mongoose');

const traineeSchema = new mongoose.Schema(
  {
    traineeId: {
      type: String,
      unique: true,
      trim: true,
    },
    // Personal Details
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Transgender', 'Other', 'Prefer not to say'],
      required: [true, 'Gender is required'],
    },
    // Demographic Profile
    socialCategory: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS'],
      required: [true, 'Social category is required'],
    },
    isMinority: {
      type: Boolean,
      default: false,
    },
    isPWD: {
      type: Boolean,
      default: false,
    },
    pwdType: {
      type: String,
      trim: true,
    },
    domicileType: {
      type: String,
      enum: ['Rural', 'Urban', 'Semi-Urban'],
      required: [true, 'Domicile type is required'],
    },
    // Contact Information
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      district: String,
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      pincode: String,
    },
    // Educational Qualification
    highestQualification: {
      type: String,
      enum: [
        'Below 10th',
        '10th / SSC',
        '12th / HSC',
        'Diploma',
        'Graduate',
        'Post Graduate',
        'PhD',
        'Other',
      ],
      required: [true, 'Qualification is required'],
    },
    specialization: {
      type: String,
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
    },
    // Employment Details
    employmentStatus: {
      type: String,
      enum: [
        'Government Employee',
        'PSU Employee',
        'Private Sector',
        'Self-Employed',
        'Unemployed',
        'Student',
        'Retired',
        'Other',
      ],
      required: [true, 'Employment status is required'],
    },
    organization: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    // Registration & Approval Status
    registrationType: {
      type: String,
      enum: ['SELF', 'ADMIN_ENTRY'],
      default: 'ADMIN_ENTRY',
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
    domainWarning: {
      type: Boolean,
      default: false,
    },
    domainWarningDetails: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full name
traineeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Auto-generate trainee ID or application ID
traineeSchema.pre('save', async function (next) {
  if (!this.traineeId) {
    const count = await mongoose.model('Trainee').countDocuments();
    if (this.approvalStatus === 'PENDING') {
      this.traineeId = `HRDC-APP-${String(count + 1).padStart(6, '0')}`;
    } else {
      this.traineeId = `HRDC-${String(count + 1).padStart(6, '0')}`;
    }
  }
  next();
});

traineeSchema.index({ email: 1 });
traineeSchema.index({ phone: 1 });
traineeSchema.index({ 'address.state': 1 });
traineeSchema.index({ socialCategory: 1 });
traineeSchema.index({ gender: 1 });

module.exports = mongoose.model('Trainee', traineeSchema);
