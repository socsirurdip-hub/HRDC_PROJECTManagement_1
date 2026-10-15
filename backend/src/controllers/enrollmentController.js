const Enrollment = require('../models/Enrollment');
const TrainingProgram = require('../models/TrainingProgram');
const Trainee = require('../models/Trainee');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');

/**
 * @desc    Enroll trainee in a program
 * @route   POST /api/enrollments
 * @access  Private
 */
const enrollTrainee = asyncHandler(async (req, res, next) => {
  const { program, trainee } = req.body;

  // Check if program exists and has capacity
  const programDoc = await TrainingProgram.findById(program);
  if (!programDoc) return next(new ApiError('Program not found', 404));

  if (programDoc.enrolledCount >= programDoc.maxParticipants) {
    return next(new ApiError('Program has reached maximum capacity', 400));
  }

  const traineeDoc = await Trainee.findById(trainee);
  if (!traineeDoc) return next(new ApiError('Trainee not found', 404));

  const enrollment = await Enrollment.create({
    ...req.body,
    registeredBy: req.user._id,
  });

  // Update program enrollment count
  await TrainingProgram.findByIdAndUpdate(program, { $inc: { enrolledCount: 1 } });

  await createAuditLog({
    user: req.user,
    action: 'CREATE',
    resource: 'Enrollment',
    resourceId: enrollment._id.toString(),
    details: { program: programDoc.title, trainee: traineeDoc.traineeId },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: enrollment });
});

/**
 * @desc    Get enrollments for a program
 * @route   GET /api/enrollments/program/:programId
 * @access  Private
 */
const getEnrollmentsByProgram = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, completionStatus } = req.query;
  const query = { program: req.params.programId };
  if (completionStatus) query.completionStatus = completionStatus;

  const total = await Enrollment.countDocuments(query);
  const enrollments = await Enrollment.find(query)
    .populate('trainee', 'firstName lastName email gender socialCategory traineeId isPWD domicileType')
    .populate('program', 'title programCode')
    .sort({ enrollmentDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: enrollments,
  });
});

/**
 * @desc    Get enrollments for a trainee
 * @route   GET /api/enrollments/trainee/:traineeId
 * @access  Private
 */
const getEnrollmentsByTrainee = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ trainee: req.params.traineeId })
    .populate('program', 'title programCode startDate endDate status category');

  res.status(200).json({ success: true, data: enrollments });
});

/**
 * @desc    Update enrollment (attendance, status, scores, feedback)
 * @route   PUT /api/enrollments/:id
 * @access  Private
 */
const updateEnrollment = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!enrollment) return next(new ApiError('Enrollment not found', 404));

  // Update program completed count if status changed to Completed
  if (req.body.completionStatus === 'Completed') {
    await TrainingProgram.findByIdAndUpdate(enrollment.program, {
      $inc: { completedCount: 1 },
    });
  }

  res.status(200).json({ success: true, data: enrollment });
});

/**
 * @desc    Submit feedback for an enrollment
 * @route   POST /api/enrollments/:id/feedback
 * @access  Private
 */
const submitFeedback = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return next(new ApiError('Enrollment not found', 404));

  enrollment.feedback = { ...req.body, submittedAt: new Date() };
  await enrollment.save();

  res.status(200).json({ success: true, message: 'Feedback submitted', data: enrollment.feedback });
});

/**
 * @desc    Get overall enrollment dashboard stats
 * @route   GET /api/enrollments/stats
 * @access  Private
 */
const getEnrollmentStats = asyncHandler(async (req, res) => {
  const [statusBreakdown, avgFeedback, monthlyEnrollments] = await Promise.all([
    Enrollment.aggregate([
      { $group: { _id: '$completionStatus', count: { $sum: 1 } } },
    ]),
    Enrollment.aggregate([
      { $match: { 'feedback.overallRating': { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$feedback.overallRating' },
          avgContent: { $avg: '$feedback.contentRating' },
          avgTrainer: { $avg: '$feedback.trainerRating' },
          totalFeedbacks: { $sum: 1 },
        },
      },
    ]),
    Enrollment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$enrollmentDate' },
            month: { $month: '$enrollmentDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: { statusBreakdown, avgFeedback: avgFeedback[0] || {}, monthlyEnrollments },
  });
});

module.exports = {
  enrollTrainee,
  getEnrollmentsByProgram,
  getEnrollmentsByTrainee,
  updateEnrollment,
  submitFeedback,
  getEnrollmentStats,
};
