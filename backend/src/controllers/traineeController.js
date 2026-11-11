const Trainee = require('../models/Trainee');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');
const { maskPhone, maskEmail } = require('../utils/crypto');

/**
 * Sanitizes trainee data based on user role under DPDPA 2023
 * (Masks phone and email for non-superadmin roles)
 */
const sanitizeTraineeData = (traineeDoc, role) => {
  const trainee = traineeDoc.toObject ? traineeDoc.toObject() : { ...traineeDoc };
  if (role !== 'super_admin' && role !== 'admin') {
    trainee.phone = maskPhone(trainee.phone);
    trainee.alternatePhone = maskPhone(trainee.alternatePhone);
    trainee.email = maskEmail(trainee.email);
  }
  return trainee;
};

/**
 * @desc    Get all trainees with filters & pagination
 * @route   GET /api/trainees
 * @access  Private
 */
const getTrainees = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10, gender, socialCategory, employmentStatus,
    domicileType, state, isPWD, search,
  } = req.query;

  const query = {};
  if (gender) query.gender = gender;
  if (socialCategory) query.socialCategory = socialCategory;
  if (employmentStatus) query.employmentStatus = employmentStatus;
  if (domicileType) query.domicileType = domicileType;
  if (state) query['address.state'] = { $regex: state, $options: 'i' };
  if (isPWD !== undefined) query.isPWD = isPWD === 'true';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { traineeId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Trainee.countDocuments(query);
  const trainees = await Trainee.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  // Apply DPDPA masking based on requesting user role
  const sanitizedTrainees = trainees.map((t) => sanitizeTraineeData(t, req.user?.role));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: sanitizedTrainees,
  });
});

/**
 * @desc    Get single trainee with enrollments
 * @route   GET /api/trainees/:id
 * @access  Private
 */
const getTraineeById = asyncHandler(async (req, res, next) => {
  const trainee = await Trainee.findById(req.params.id);
  if (!trainee) return next(new ApiError('Trainee not found', 404));

  const enrollments = await Enrollment.find({ trainee: req.params.id })
    .populate('program', 'title programCode startDate endDate status');

  const sanitized = sanitizeTraineeData(trainee, req.user?.role);

  // DPDPA access audit trail: log every detailed PII profile view
  await createAuditLog({
    user: req.user,
    action: 'VIEW_PII',
    resource: 'Trainee',
    resourceId: req.params.id,
    details: { traineeId: trainee.traineeId },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    data: { ...sanitized, enrollments },
  });
});

/**
 * @desc    Create trainee (with duplicate detection)
 * @route   POST /api/trainees
 * @access  Private
 */
const createTrainee = asyncHandler(async (req, res, next) => {
  // Duplicate detection by email or phone
  const existing = await Trainee.findOne({
    $or: [{ email: req.body.email }, { phone: req.body.phone }],
  });

  if (existing) {
    return next(
      new ApiError(
        `Duplicate detected: A trainee with this email or phone already exists (ID: ${existing.traineeId})`,
        400
      )
    );
  }

  const trainee = await Trainee.create(req.body);

  await createAuditLog({
    user: req.user,
    action: 'CREATE',
    resource: 'Trainee',
    resourceId: trainee._id.toString(),
    details: { traineeId: trainee.traineeId, email: trainee.email },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: trainee });
});

/**
 * @desc    Update trainee
 * @route   PUT /api/trainees/:id
 * @access  Private
 */
const updateTrainee = asyncHandler(async (req, res, next) => {
  const trainee = await Trainee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!trainee) return next(new ApiError('Trainee not found', 404));

  await createAuditLog({
    user: req.user,
    action: 'UPDATE',
    resource: 'Trainee',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: trainee });
});

/**
 * @desc    Delete trainee
 * @route   DELETE /api/trainees/:id
 * @access  Private (admin, super_admin)
 */
const deleteTrainee = asyncHandler(async (req, res, next) => {
  const trainee = await Trainee.findById(req.params.id);
  if (!trainee) return next(new ApiError('Trainee not found', 404));

  await Enrollment.deleteMany({ trainee: req.params.id });
  await Trainee.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user,
    action: 'DELETE',
    resource: 'Trainee',
    resourceId: req.params.id,
    details: { traineeId: trainee.traineeId },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Trainee deleted successfully' });
});

/**
 * @desc    Get trainee demographic stats
 * @route   GET /api/trainees/stats/demographics
 * @access  Private
 */
const getTraineeDemographics = asyncHandler(async (req, res) => {
  const [genderStats, categoryStats, domicileStats, qualificationStats, employmentStats, stateStats] =
    await Promise.all([
      Trainee.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
      Trainee.aggregate([{ $group: { _id: '$socialCategory', count: { $sum: 1 } } }]),
      Trainee.aggregate([{ $group: { _id: '$domicileType', count: { $sum: 1 } } }]),
      Trainee.aggregate([{ $group: { _id: '$highestQualification', count: { $sum: 1 } } }]),
      Trainee.aggregate([{ $group: { _id: '$employmentStatus', count: { $sum: 1 } } }]),
      Trainee.aggregate([
        { $group: { _id: '$address.state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
    ]);

  const totalPWD = await Trainee.countDocuments({ isPWD: true });
  const totalTrainees = await Trainee.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalTrainees,
      totalPWD,
      genderStats,
      categoryStats,
      domicileStats,
      qualificationStats,
      employmentStats,
      stateStats,
    },
  });
});

module.exports = {
  getTrainees,
  getTraineeById,
  createTrainee,
  updateTrainee,
  deleteTrainee,
  getTraineeDemographics,
};
