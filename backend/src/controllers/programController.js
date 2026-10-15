const TrainingProgram = require('../models/TrainingProgram');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');

/**
 * @desc    Get all training programs with filters & pagination
 * @route   GET /api/programs
 * @access  Private
 */
const getPrograms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, category, mode, state, search, startDate, endDate } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (mode) query.mode = mode;
  if (state) query.state = { $regex: state, $options: 'i' };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { programCode: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  const total = await TrainingProgram.countDocuments(query);
  const programs = await TrainingProgram.find(query)
    .populate('createdBy', 'name email')
    .sort({ startDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: programs,
  });
});

/**
 * @desc    Get single program with enrollment stats
 * @route   GET /api/programs/:id
 * @access  Private
 */
const getProgramById = asyncHandler(async (req, res, next) => {
  const program = await TrainingProgram.findById(req.params.id)
    .populate('createdBy', 'name email');
  if (!program) return next(new ApiError('Program not found', 404));

  res.status(200).json({ success: true, data: program });
});

/**
 * @desc    Create training program
 * @route   POST /api/programs
 * @access  Private (admin, super_admin)
 */
const createProgram = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const program = await TrainingProgram.create(req.body);

  await createAuditLog({
    user: req.user,
    action: 'CREATE',
    resource: 'TrainingProgram',
    resourceId: program._id.toString(),
    details: { title: program.title, programCode: program.programCode },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: program });
});

/**
 * @desc    Update training program
 * @route   PUT /api/programs/:id
 * @access  Private (admin, super_admin)
 */
const updateProgram = asyncHandler(async (req, res, next) => {
  const program = await TrainingProgram.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!program) return next(new ApiError('Program not found', 404));

  await createAuditLog({
    user: req.user,
    action: 'UPDATE',
    resource: 'TrainingProgram',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: program });
});

/**
 * @desc    Delete training program
 * @route   DELETE /api/programs/:id
 * @access  Private (super_admin)
 */
const deleteProgram = asyncHandler(async (req, res, next) => {
  const program = await TrainingProgram.findById(req.params.id);
  if (!program) return next(new ApiError('Program not found', 404));

  // Delete associated enrollments
  await Enrollment.deleteMany({ program: req.params.id });
  await TrainingProgram.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user,
    action: 'DELETE',
    resource: 'TrainingProgram',
    resourceId: req.params.id,
    details: { title: program.title },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Program deleted successfully' });
});

/**
 * @desc    Get program statistics summary
 * @route   GET /api/programs/stats/summary
 * @access  Private
 */
const getProgramStats = asyncHandler(async (req, res) => {
  const stats = await TrainingProgram.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEnrolled: { $sum: '$enrolledCount' },
        totalCompleted: { $sum: '$completedCount' },
      },
    },
  ]);

  const categoryStats = await TrainingProgram.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const stateStats = await TrainingProgram.aggregate([
    { $match: { state: { $ne: null } } },
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    data: { statusStats: stats, categoryStats, stateStats },
  });
});

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStats,
};
