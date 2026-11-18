const Batch = require('../models/Batch');
const TrainingProgram = require('../models/TrainingProgram');
const Trainee = require('../models/Trainee');
const Nomination = require('../models/Nomination');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');

/**
 * @desc    Get all batches for a program
 * @route   GET /api/batches/program/:programId
 * @access  Private
 */
const getBatchesByProgram = asyncHandler(async (req, res, next) => {
  const { programId } = req.params;

  const batches = await Batch.find({ program: programId })
    .populate('createdBy', 'name email')
    .sort({ startDate: 1 });

  // For each batch, get the enrolled participants
  const batchesWithEnrollments = await Promise.all(
    batches.map(async (batch) => {
      const enrollments = await Enrollment.find({ batch: batch._id })
        .populate('trainee', 'firstName lastName fullName email phone gender socialCategory organization designation traineeId')
        .select('trainee enrollmentDate completionStatus');
      
      const bObj = batch.toObject();
      bObj.enrollments = enrollments;
      bObj.assignedCount = enrollments.length;
      return bObj;
    })
  );

  res.status(200).json({
    success: true,
    total: batches.length,
    data: batchesWithEnrollments,
  });
});

/**
 * @desc    Create a new batch for a program
 * @route   POST /api/batches
 * @access  Private (admin, super_admin)
 */
const createBatch = asyncHandler(async (req, res, next) => {
  const {
    programId,
    batchCode,
    batchName,
    startDate,
    endDate,
    maxCapacity,
    venueOrMeetingLink,
    coordinatorInCharge,
  } = req.body;

  if (!programId || !batchCode || !batchName || !startDate || !endDate) {
    return next(new ApiError('Please provide all required batch details', 400));
  }

  const program = await TrainingProgram.findById(programId);
  if (!program) return next(new ApiError('Training Program not found', 404));

  const existingCode = await Batch.findOne({ program: programId, batchCode: batchCode.trim().toUpperCase() });
  if (existingCode) {
    return next(new ApiError(`A batch with code "${batchCode}" already exists for this program`, 400));
  }

  const batch = await Batch.create({
    program: programId,
    batchCode: batchCode.trim().toUpperCase(),
    batchName: batchName.trim(),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    maxCapacity: Number(maxCapacity) || 30,
    venueOrMeetingLink: venueOrMeetingLink?.trim(),
    coordinatorInCharge: coordinatorInCharge?.trim() || program.coordinatorName,
    createdBy: req.user._id,
  });

  // Enable hasBatches on program and update count
  await TrainingProgram.findByIdAndUpdate(programId, {
    hasBatches: true,
    $inc: { batchesCount: 1 },
  });

  await createAuditLog({
    user: req.user,
    action: 'BATCH_CREATE',
    resource: 'Batch',
    resourceId: batch._id.toString(),
    details: {
      programTitle: program.title,
      batchCode: batch.batchCode,
      batchName: batch.batchName,
      startDate: batch.startDate,
      endDate: batch.endDate,
    },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: `Batch "${batch.batchName}" created successfully.`,
    data: batch,
  });
});

/**
 * @desc    Update batch details
 * @route   PUT /api/batches/:id
 * @access  Private (admin, super_admin)
 */
const updateBatch = asyncHandler(async (req, res, next) => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!batch) return next(new ApiError('Batch not found', 404));

  await createAuditLog({
    user: req.user,
    action: 'BATCH_UPDATE',
    resource: 'Batch',
    resourceId: batch._id.toString(),
    details: { batchCode: batch.batchCode },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Batch updated successfully',
    data: batch,
  });
});

/**
 * @desc    Delete batch
 * @route   DELETE /api/batches/:id
 * @access  Private (admin, super_admin)
 */
const deleteBatch = asyncHandler(async (req, res, next) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return next(new ApiError('Batch not found', 404));

  const assignedCount = await Enrollment.countDocuments({ batch: batch._id });
  if (assignedCount > 0) {
    return next(
      new ApiError(`Cannot delete batch: ${assignedCount} participant(s) are currently assigned to it. Please reassign or remove them first.`, 400)
    );
  }

  await Batch.findByIdAndDelete(req.params.id);
  await TrainingProgram.findByIdAndUpdate(batch.program, {
    $inc: { batchesCount: -1 },
  });

  await createAuditLog({
    user: req.user,
    action: 'BATCH_DELETE',
    resource: 'Batch',
    resourceId: req.params.id,
    details: { batchCode: batch.batchCode },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Batch deleted successfully',
  });
});

/**
 * @desc    Assign participant(s) to a batch
 * @route   POST /api/batches/:id/assign
 * @access  Private (admin, super_admin)
 */
const assignParticipantToBatch = asyncHandler(async (req, res, next) => {
  const { traineeId, nominationId } = req.body;
  const batch = await Batch.findById(req.params.id);
  if (!batch) return next(new ApiError('Batch not found', 404));

  const program = await TrainingProgram.findById(batch.program);
  if (!program) return next(new ApiError('Program not found', 404));

  const currentCount = await Enrollment.countDocuments({ batch: batch._id });
  if (currentCount >= batch.maxCapacity) {
    return next(new ApiError(`Batch capacity exceeded. Maximum capacity is ${batch.maxCapacity}.`, 400));
  }

  const trainee = await Trainee.findById(traineeId);
  if (!trainee) return next(new ApiError('Trainee not found', 404));

  // Check if enrollment already exists for this program
  let enrollment = await Enrollment.findOne({ program: batch.program, trainee: traineeId });
  if (enrollment) {
    // Reassign batch
    enrollment.batch = batch._id;
    if (nominationId) enrollment.nomination = nominationId;
    await enrollment.save();
  } else {
    // Create new enrollment
    enrollment = await Enrollment.create({
      program: batch.program,
      trainee: traineeId,
      batch: batch._id,
      nomination: nominationId || undefined,
      registeredBy: req.user._id,
    });
    await TrainingProgram.findByIdAndUpdate(batch.program, { $inc: { enrolledCount: 1 } });
  }

  // Update nomination if provided
  if (nominationId) {
    await Nomination.findByIdAndUpdate(nominationId, {
      assignedBatch: batch._id,
      status: 'APPROVED',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });
  }

  // Recalculate batch assigned count
  const newCount = await Enrollment.countDocuments({ batch: batch._id });
  batch.assignedCount = newCount;
  await batch.save();

  await createAuditLog({
    user: req.user,
    action: 'BATCH_ASSIGN_PARTICIPANT',
    resource: 'Batch',
    resourceId: batch._id.toString(),
    details: {
      batchCode: batch.batchCode,
      traineeId: trainee.traineeId,
      traineeName: trainee.fullName,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `${trainee.fullName} successfully assigned to ${batch.batchName}.`,
    data: { batch, enrollment },
  });
});

/**
 * @desc    Remove participant from batch
 * @route   POST /api/batches/:id/remove-participant
 * @access  Private (admin, super_admin)
 */
const removeParticipantFromBatch = asyncHandler(async (req, res, next) => {
  const { enrollmentId } = req.body;
  const batch = await Batch.findById(req.params.id);
  if (!batch) return next(new ApiError('Batch not found', 404));

  const enrollment = await Enrollment.findById(enrollmentId).populate('trainee');
  if (!enrollment) return next(new ApiError('Enrollment record not found', 404));

  // Remove batch association from enrollment
  enrollment.batch = undefined;
  await enrollment.save();

  if (enrollment.nomination) {
    await Nomination.findByIdAndUpdate(enrollment.nomination, {
      assignedBatch: undefined,
    });
  }

  const newCount = await Enrollment.countDocuments({ batch: batch._id });
  batch.assignedCount = newCount;
  await batch.save();

  await createAuditLog({
    user: req.user,
    action: 'BATCH_REMOVE_PARTICIPANT',
    resource: 'Batch',
    resourceId: batch._id.toString(),
    details: {
      batchCode: batch.batchCode,
      traineeId: enrollment.trainee?.traineeId,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Participant removed from batch successfully.',
    data: batch,
  });
});

module.exports = {
  getBatchesByProgram,
  createBatch,
  updateBatch,
  deleteBatch,
  assignParticipantToBatch,
  removeParticipantFromBatch,
};
