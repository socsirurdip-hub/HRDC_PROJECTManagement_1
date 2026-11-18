const Nomination = require('../models/Nomination');
const TrainingProgram = require('../models/TrainingProgram');
const Trainee = require('../models/Trainee');
const OtpVerification = require('../models/OtpVerification');
const Enrollment = require('../models/Enrollment');
const Batch = require('../models/Batch');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');
const { maskEmail, maskPhone } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * @desc    Get public program details for nomination invitation link
 * @route   GET /api/nominations/public-program/:idOrCode
 * @access  Public
 */
const getPublicProgramInvite = asyncHandler(async (req, res, next) => {
  const { idOrCode } = req.params;

  let query = {};
  if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
    query = { _id: idOrCode };
  } else {
    query = { programCode: idOrCode.toUpperCase() };
  }

  const program = await TrainingProgram.findOne(query).select(
    'programCode title description category mode venue state district startDate endDate durationDays coordinatorName coordinatorEmail targetAudience maxParticipants allowNominations nominationStartDate nominationEndDate status hasBatches'
  );

  if (!program) {
    return next(new ApiError('Training Program not found', 404));
  }

  const now = new Date();
  let nominationStatus = 'OPEN';
  if (!program.allowNominations) {
    nominationStatus = 'NOT_ACCEPTED';
  } else if (program.nominationStartDate && now < new Date(program.nominationStartDate)) {
    nominationStatus = 'NOT_STARTED_YET';
  } else if (program.nominationEndDate && now > new Date(program.nominationEndDate)) {
    nominationStatus = 'CLOSED';
  } else if (program.status === 'Completed' || program.status === 'Cancelled') {
    nominationStatus = 'PROGRAM_CLOSED';
  }

  res.status(200).json({
    success: true,
    data: {
      program,
      nominationStatus,
    },
  });
});

/**
 * @desc    Generate & send OTP to verify trainee for nomination
 * @route   POST /api/nominations/send-otp
 * @access  Public
 */
const sendNominationOtp = asyncHandler(async (req, res, next) => {
  const { identifier, programId } = req.body;

  if (!identifier || !programId) {
    return next(new ApiError('Registered Email/Mobile and Program ID are required', 400));
  }

  const program = await TrainingProgram.findById(programId);
  if (!program) return next(new ApiError('Training Program not found', 404));

  if (!program.allowNominations) {
    return next(new ApiError('Nominations are currently not open for this program', 400));
  }

  const now = new Date();
  if (program.nominationEndDate && now > new Date(program.nominationEndDate)) {
    return next(new ApiError('The nomination deadline for this program has expired', 400));
  }

  const cleanId = identifier.trim().toLowerCase();
  const trainee = await Trainee.findOne({
    $or: [{ email: cleanId }, { phone: identifier.trim() }, { traineeId: identifier.trim() }],
  });

  if (!trainee) {
    return next(
      new ApiError(
        'No registration found in the HRDC Master Trainee Directory with this email/mobile. Please complete your one-time master registration first.',
        404
      )
    );
  }

  if (trainee.approvalStatus === 'PENDING') {
    return next(
      new ApiError(
        'Your Master Trainee registration is currently under Super Admin review. You can submit nominations once your profile is approved.',
        403
      )
    );
  }

  if (trainee.approvalStatus === 'REJECTED') {
    return next(
      new ApiError(
        `Your Master Trainee registration was not approved. Reason: ${trainee.rejectionReason || 'Verification criteria not met'}. Please contact HRDC administration.`,
        403
      )
    );
  }

  // Check if trainee has already nominated for this program
  const existingNomination = await Nomination.findOne({
    program: programId,
    trainee: trainee._id,
  });

  if (existingNomination && existingNomination.status !== 'INVITED') {
    return next(
      new ApiError(
        `You have already submitted a nomination for this program (Status: ${existingNomination.status}). Duplicate submissions are not allowed.`,
        400
      )
    );
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Remove existing pending OTPs for this email & program
  await OtpVerification.deleteMany({ email: trainee.email, programId });

  await OtpVerification.create({
    email: trainee.email,
    otp,
    programId,
    expiresAt,
  });

  logger.info(`[CSIR-HRDC OTP] Generated Passcode ${otp} for Trainee ${trainee.email} on Program ${program.programCode}`);

  res.status(200).json({
    success: true,
    message: `A 6-digit one-time passcode has been generated for ${maskEmail(trainee.email)}.`,
    maskedEmail: maskEmail(trainee.email),
    maskedPhone: maskPhone(trainee.phone),
    // In dev environment, return OTP for seamless automated testing
    devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
  });
});

/**
 * @desc    Verify OTP and return verified trainee profile for prefill
 * @route   POST /api/nominations/verify-otp
 * @access  Public
 */
const verifyNominationOtp = asyncHandler(async (req, res, next) => {
  const { identifier, otp, programId } = req.body;

  if (!identifier || !otp || !programId) {
    return next(new ApiError('Email/Mobile, Passcode, and Program ID are required', 400));
  }

  const cleanId = identifier.trim().toLowerCase();
  const trainee = await Trainee.findOne({
    $or: [{ email: cleanId }, { phone: identifier.trim() }, { traineeId: identifier.trim() }],
  });

  if (!trainee) {
    return next(new ApiError('Trainee not found', 404));
  }

  const record = await OtpVerification.findOne({
    email: trainee.email,
    programId,
    otp: otp.trim(),
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    return next(new ApiError('Invalid or expired one-time passcode. Please request a new one.', 400));
  }

  record.verified = true;
  await record.save();

  res.status(200).json({
    success: true,
    message: 'Passcode verified successfully.',
    data: {
      trainee: {
        _id: trainee._id,
        traineeId: trainee.traineeId,
        firstName: trainee.firstName,
        lastName: trainee.lastName,
        fullName: trainee.fullName,
        email: trainee.email,
        phone: trainee.phone,
        gender: trainee.gender,
        socialCategory: trainee.socialCategory,
        organization: trainee.organization,
        designation: trainee.designation,
        employeeId: trainee.employeeId,
        domicileType: trainee.domicileType,
        highestQualification: trainee.highestQualification,
        specialization: trainee.specialization,
        state: trainee.address?.state,
      },
    },
  });
});

/**
 * @desc    Submit willingness and complete nomination
 * @route   POST /api/nominations/submit
 * @access  Public
 */
const submitNomination = asyncHandler(async (req, res, next) => {
  const { programId, traineeId, willingnessDetails, otp } = req.body;

  if (!programId || !traineeId || !willingnessDetails) {
    return next(new ApiError('Missing required nomination fields', 400));
  }

  const program = await TrainingProgram.findById(programId);
  if (!program) return next(new ApiError('Training Program not found', 404));

  const trainee = await Trainee.findById(traineeId);
  if (!trainee) return next(new ApiError('Trainee record not found', 404));

  if (trainee.approvalStatus !== 'APPROVED') {
    return next(new ApiError('Only Super Admin approved trainees can submit nominations', 403));
  }

  if (!willingnessDetails.reportingOfficerName || !willingnessDetails.reportingOfficerDesignation || !willingnessDetails.reportingOfficerEmail) {
    return next(new ApiError('Controlling/reporting officer details (name, designation, email) are required', 400));
  }

  // Verify OTP verification status
  if (otp) {
    const verifiedRecord = await OtpVerification.findOne({
      email: trainee.email,
      programId,
      otp: otp.trim(),
    });
    if (!verifiedRecord) {
      return next(new ApiError('Passcode verification failed. Please verify your OTP again.', 400));
    }
  }

  // Duplicate / invite check
  const existing = await Nomination.findOne({ program: programId, trainee: traineeId });
  if (existing) {
    if (existing.status === 'INVITED') {
      // Fulfill pending invitation
      existing.status = 'SUBMITTED';
      existing.willingnessDetails = willingnessDetails;
      existing.submittedAt = new Date();
      await existing.save();

      await OtpVerification.deleteMany({ email: trainee.email, programId });

      await createAuditLog({
        user: null,
        action: 'NOMINATION_SUBMIT',
        resource: 'Nomination',
        resourceId: existing._id.toString(),
        details: {
          programCode: program.programCode,
          traineeId: trainee.traineeId,
          traineeEmail: trainee.email,
          reportingOfficer: willingnessDetails.reportingOfficerName,
          invitationFulfilled: true,
        },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Your invitation acceptance and willingness to participate have been submitted successfully.',
        data: existing,
      });
    }

    return next(new ApiError('A nomination has already been submitted for this program', 400));
  }

  const nomination = await Nomination.create({
    program: programId,
    trainee: traineeId,
    willingnessDetails,
    status: 'SUBMITTED',
  });

  // Increment program nominations count
  await TrainingProgram.findByIdAndUpdate(programId, { $inc: { nominationsCount: 1 } });

  // Clean up OTP record
  await OtpVerification.deleteMany({ email: trainee.email, programId });

  await createAuditLog({
    user: null,
    action: 'NOMINATION_SUBMIT',
    resource: 'Nomination',
    resourceId: nomination._id.toString(),
    details: {
      programCode: program.programCode,
      traineeId: trainee.traineeId,
      traineeEmail: trainee.email,
      reportingOfficer: willingnessDetails.reportingOfficerName,
    },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Your nomination and willingness to participate have been successfully submitted.',
    data: nomination,
  });
});

/**
 * @desc    Get all nominations for a specific program
 * @route   GET /api/nominations/program/:programId
 * @access  Private (admin, super_admin)
 */
const getNominationsByProgram = asyncHandler(async (req, res, next) => {
  const { programId } = req.params;
  const { status, search, page = 1, limit = 20 } = req.query;

  const query = { program: programId };
  if (status && status !== 'ALL') {
    query.status = status;
  }

  const [total, invitedCount, submittedCount, approvedCount, rejectedCount, waitlistedCount] = await Promise.all([
    Nomination.countDocuments(query),
    Nomination.countDocuments({ program: programId, status: 'INVITED' }),
    Nomination.countDocuments({ program: programId, status: 'SUBMITTED' }),
    Nomination.countDocuments({ program: programId, status: 'APPROVED' }),
    Nomination.countDocuments({ program: programId, status: 'REJECTED' }),
    Nomination.countDocuments({ program: programId, status: 'WAITLISTED' }),
  ]);

  const nominations = await Nomination.find(query)
    .populate('trainee', 'firstName lastName fullName email phone gender socialCategory organization designation traineeId employeeId isPWD domicileType address')
    .populate('assignedBatch', 'batchCode batchName startDate endDate maxCapacity assignedCount')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    counts: {
      all: total,
      invited: invitedCount,
      submitted: submittedCount,
      approved: approvedCount,
      rejected: rejectedCount,
      waitlisted: waitlistedCount,
    },
    data: nominations,
  });
});

/**
 * @desc    Review nomination (Approve / Reject / Waitlist)
 * @route   PUT /api/nominations/:id/review
 * @access  Private (admin, super_admin)
 */
const reviewNomination = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason, assignedBatch } = req.body;

  if (!['APPROVED', 'REJECTED', 'WAITLISTED'].includes(status)) {
    return next(new ApiError('Invalid status value. Must be APPROVED, REJECTED, or WAITLISTED.', 400));
  }

  const nomination = await Nomination.findById(req.params.id)
    .populate('program')
    .populate('trainee');

  if (!nomination) {
    return next(new ApiError('Nomination not found', 404));
  }

  nomination.status = status;
  nomination.reviewedBy = req.user._id;
  nomination.reviewedAt = new Date();
  if (rejectionReason) nomination.rejectionReason = rejectionReason;
  if (assignedBatch) nomination.assignedBatch = assignedBatch;

  await nomination.save();

  // If approved and the program doesn't use batches, create direct Enrollment if not already enrolled
  if (status === 'APPROVED' && !nomination.program.hasBatches) {
    const existingEnrollment = await Enrollment.findOne({
      program: nomination.program._id,
      trainee: nomination.trainee._id,
    });

    if (!existingEnrollment) {
      await Enrollment.create({
        program: nomination.program._id,
        trainee: nomination.trainee._id,
        nomination: nomination._id,
        registeredBy: req.user._id,
      });
      await TrainingProgram.findByIdAndUpdate(nomination.program._id, { $inc: { enrolledCount: 1 } });
    }
  }

  await createAuditLog({
    user: req.user,
    action: `NOMINATION_${status}`,
    resource: 'Nomination',
    resourceId: nomination._id.toString(),
    details: {
      program: nomination.program.title,
      traineeId: nomination.trainee.traineeId,
      status,
      reviewer: req.user.name,
      rejectionReason,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Nomination marked as ${status}.`,
    data: nomination,
  });
});

/**
 * @desc    Bulk review nominations
 * @route   POST /api/nominations/bulk-review
 * @access  Private (admin, super_admin)
 */
const bulkReviewNominations = asyncHandler(async (req, res, next) => {
  const { nominationIds, status, rejectionReason } = req.body;

  if (!Array.isArray(nominationIds) || nominationIds.length === 0) {
    return next(new ApiError('Please provide an array of nomination IDs', 400));
  }

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return next(new ApiError('Status must be APPROVED or REJECTED for bulk review', 400));
  }

  const result = await Nomination.updateMany(
    { _id: { $in: nominationIds } },
    {
      $set: {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      },
    }
  );

  await createAuditLog({
    user: req.user,
    action: `NOMINATION_BULK_${status}`,
    resource: 'Nomination',
    details: {
      count: result.modifiedCount,
      status,
      reviewer: req.user.name,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Successfully updated ${result.modifiedCount} nominations to ${status}.`,
    modifiedCount: result.modifiedCount,
  });
});

/**
 * @desc    Invite approved candidates to a program (targeted selection by lab/designation)
 * @route   POST /api/nominations/invite-batch
 * @access  Private (admin, super_admin)
 */
const inviteCandidates = asyncHandler(async (req, res, next) => {
  const { programId, traineeIds, criteria } = req.body;

  if (!programId || !Array.isArray(traineeIds) || traineeIds.length === 0) {
    return next(new ApiError('Program ID and at least one trainee ID are required', 400));
  }

  const program = await TrainingProgram.findById(programId);
  if (!program) return next(new ApiError('Training Program not found', 404));

  // Find all approved trainees from the given IDs
  const approvedTrainees = await Trainee.find({
    _id: { $in: traineeIds },
    approvalStatus: 'APPROVED',
  }).select('_id email traineeId firstName lastName fullName organization designation');

  if (approvedTrainees.length === 0) {
    return next(new ApiError('No eligible approved trainees found among selected IDs', 400));
  }

  // Find existing nominations for these trainees in this program
  const existingNominations = await Nomination.find({
    program: programId,
    trainee: { $in: approvedTrainees.map((t) => t._id) },
  }).select('trainee status');

  const existingTraineeIdSet = new Set(existingNominations.map((n) => n.trainee.toString()));

  const newInvitations = approvedTrainees
    .filter((t) => !existingTraineeIdSet.has(t._id.toString()))
    .map((t) => ({
      program: programId,
      trainee: t._id,
      status: 'INVITED',
      invitationDetails: {
        invitedBy: req.user._id,
        invitedAt: new Date(),
        channel: 'DIRECT_SELECT',
        targetCriteria: criteria || {},
      },
      submittedAt: new Date(),
    }));

  let createdDocs = [];
  if (newInvitations.length > 0) {
    createdDocs = await Nomination.insertMany(newInvitations);
    await TrainingProgram.findByIdAndUpdate(programId, {
      $inc: { nominationsCount: createdDocs.length },
    });
  }

  await createAuditLog({
    user: req.user,
    action: 'NOMINATIONS_INVITED_BULK',
    resource: 'Nomination',
    resourceId: programId,
    details: {
      programCode: program.programCode,
      programTitle: program.title,
      totalSelected: traineeIds.length,
      invitedCount: createdDocs.length,
      alreadyNominatedCount: existingNominations.length,
      criteria,
      invitedBy: req.user.name,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Dispatched invitations to ${createdDocs.length} approved candidate(s).${
      existingNominations.length > 0 ? ` (${existingNominations.length} candidate(s) were already invited/nominated).` : ''
    }`,
    data: {
      invitedCount: createdDocs.length,
      skippedCount: existingNominations.length,
      nominations: createdDocs,
    },
  });
});

/**
 * @desc    Map a nomination to a specific batch and enroll trainee
 * @route   POST /api/nominations/:id/map-to-batch
 * @access  Private (admin, super_admin)
 */
const mapNominationToBatch = asyncHandler(async (req, res, next) => {
  const { batchId, status = 'APPROVED' } = req.body;

  if (!batchId) {
    return next(new ApiError('Target Batch ID is required', 400));
  }

  const nomination = await Nomination.findById(req.params.id)
    .populate('program')
    .populate('trainee');

  if (!nomination) {
    return next(new ApiError('Nomination not found', 404));
  }

  const batch = await Batch.findById(batchId);
  if (!batch) {
    return next(new ApiError('Specified batch does not exist', 404));
  }

  if (batch.program.toString() !== nomination.program._id.toString()) {
    return next(new ApiError('Batch does not belong to this training program', 400));
  }

  const oldBatchId = nomination.assignedBatch ? nomination.assignedBatch.toString() : null;

  // Capacity check
  if (batch.maxCapacity && batch.assignedCount >= batch.maxCapacity && oldBatchId !== batchId) {
    return next(
      new ApiError(
        `Batch ${batch.batchName || batch.batchCode} has reached its maximum capacity of ${batch.maxCapacity} seats`,
        400
      )
    );
  }

  // Update old batch count if changing batches
  if (oldBatchId && oldBatchId !== batchId) {
    await Batch.findByIdAndUpdate(oldBatchId, { $inc: { assignedCount: -1 } });
  }

  // Update nomination
  nomination.assignedBatch = batch._id;
  nomination.status = status;
  nomination.reviewedBy = req.user._id;
  nomination.reviewedAt = new Date();

  // Find or create enrollment
  let enrollment = await Enrollment.findOne({
    program: nomination.program._id,
    trainee: nomination.trainee._id,
  });

  if (enrollment) {
    enrollment.batch = batch._id;
    enrollment.nomination = nomination._id;
    await enrollment.save();
  } else {
    enrollment = await Enrollment.create({
      program: nomination.program._id,
      trainee: nomination.trainee._id,
      batch: batch._id,
      nomination: nomination._id,
      registeredBy: req.user._id,
    });
    await TrainingProgram.findByIdAndUpdate(nomination.program._id, { $inc: { enrolledCount: 1 } });
  }

  nomination.mappedEnrollment = enrollment._id;
  await nomination.save();

  // Increment new batch count if new assignment
  if (oldBatchId !== batchId) {
    await Batch.findByIdAndUpdate(batch._id, { $inc: { assignedCount: 1 } });
  }

  await createAuditLog({
    user: req.user,
    action: 'PARTICIPANT_MAPPED_TO_BATCH',
    resource: 'Nomination',
    resourceId: nomination._id.toString(),
    details: {
      program: nomination.program.title,
      traineeId: nomination.trainee.traineeId,
      traineeName: nomination.trainee.fullName,
      batchCode: batch.batchCode,
      batchName: batch.batchName,
      reviewedBy: req.user.name,
    },
    ipAddress: req.ip,
  });

  const updatedNomination = await Nomination.findById(nomination._id)
    .populate('trainee', 'firstName lastName fullName email phone organization designation traineeId employeeId')
    .populate('assignedBatch', 'batchCode batchName startDate endDate maxCapacity assignedCount')
    .populate('reviewedBy', 'name email');

  res.status(200).json({
    success: true,
    message: `Participant ${nomination.trainee.fullName} successfully mapped to ${batch.batchName || batch.batchCode}.`,
    data: updatedNomination,
  });
});

module.exports = {
  getPublicProgramInvite,
  sendNominationOtp,
  verifyNominationOtp,
  submitNomination,
  getNominationsByProgram,
  reviewNomination,
  bulkReviewNominations,
  inviteCandidates,
  mapNominationToBatch,
};
