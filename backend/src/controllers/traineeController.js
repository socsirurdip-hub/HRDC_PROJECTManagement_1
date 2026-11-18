const Trainee = require('../models/Trainee');
const Enrollment = require('../models/Enrollment');
const Nomination = require('../models/Nomination');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');
const { maskPhone, maskEmail } = require('../utils/crypto');
const { isTrustedGovEmail } = require('../utils/domainValidator');

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
    domicileType, state, isPWD, search, approvalStatus = 'APPROVED',
    organization, designation,
  } = req.query;

  const query = {};
  if (approvalStatus && approvalStatus !== 'ALL') {
    query.approvalStatus = approvalStatus;
  }
  if (gender) query.gender = gender;
  if (socialCategory) query.socialCategory = socialCategory;
  if (employmentStatus) query.employmentStatus = employmentStatus;
  if (domicileType) query.domicileType = domicileType;
  if (organization) {
    const orgList = Array.isArray(organization)
      ? organization
      : organization.split(',').map((s) => s.trim()).filter(Boolean);
    if (orgList.length === 1) {
      query.organization = { $regex: orgList[0], $options: 'i' };
    } else if (orgList.length > 1) {
      query.organization = { $in: orgList.map((o) => new RegExp(`^${o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
    }
  }
  if (designation) {
    const desigList = Array.isArray(designation)
      ? designation
      : designation.split(',').map((s) => s.trim()).filter(Boolean);
    if (desigList.length === 1) {
      query.designation = { $regex: desigList[0], $options: 'i' };
    } else if (desigList.length > 1) {
      query.designation = { $in: desigList.map((d) => new RegExp(`^${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
    }
  }
  if (state) {
    const stateList = Array.isArray(state)
      ? state
      : state.split(',').map((s) => s.trim()).filter(Boolean);
    if (stateList.length === 1) {
      query['address.state'] = { $regex: stateList[0], $options: 'i' };
    } else if (stateList.length > 1) {
      query['address.state'] = { $in: stateList.map((s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
    }
  }
  if (isPWD !== undefined) query.isPWD = isPWD === 'true';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { traineeId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { organization: { $regex: search, $options: 'i' } },
    ];
  }

  const [total, approvedCount, pendingCount, rejectedCount] = await Promise.all([
    Trainee.countDocuments(query),
    Trainee.countDocuments({ approvalStatus: 'APPROVED' }),
    Trainee.countDocuments({ approvalStatus: 'PENDING' }),
    Trainee.countDocuments({ approvalStatus: 'REJECTED' }),
  ]);

  const trainees = await Trainee.find(query)
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const traineeIds = trainees.map((t) => t._id);
  const nominations = await Nomination.find({
    trainee: { $in: traineeIds },
  }).populate('program', 'programCode title');

  const nominationsByTrainee = {};
  nominations.forEach((n) => {
    const tId = n.trainee.toString();
    if (!nominationsByTrainee[tId]) nominationsByTrainee[tId] = [];
    nominationsByTrainee[tId].push({
      _id: n._id,
      programId: n.program?._id,
      programCode: n.program?.programCode,
      programTitle: n.program?.title,
      status: n.status,
    });
  });

  // Apply DPDPA masking based on requesting user role
  const sanitizedTrainees = trainees.map((t) => {
    const sanitized = sanitizeTraineeData(t, req.user?.role);
    sanitized.activeNominations = nominationsByTrainee[t._id.toString()] || [];
    return sanitized;
  });

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    counts: {
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
    },
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

/**
 * @desc    Self-register a trainee in master list (Public)
 * @route   POST /api/trainees/register
 * @access  Public
 */
const registerTrainee = asyncHandler(async (req, res, next) => {
  const { email, phone } = req.body;

  if (!email || !phone) {
    return next(new ApiError('Email and mobile number are required', 400));
  }

  // Duplicate detection by email or phone across master list
  const existing = await Trainee.findOne({
    $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
  });

  if (existing) {
    return next(
      new ApiError(
        `A registration with this email or mobile already exists (Status: ${existing.approvalStatus}, ID: ${existing.traineeId})`,
        400
      )
    );
  }

  // Check if email domain is trusted government domain
  const isTrusted = isTrustedGovEmail(email);
  const domainWarning = !isTrusted;
  const domainWarningDetails = !isTrusted
    ? 'Non-Government Email Domain: Manual verification required by Super Admin'
    : null;

  const traineeData = {
    ...req.body,
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    registrationType: 'SELF',
    approvalStatus: 'PENDING',
    domainWarning,
    domainWarningDetails,
  };

  const trainee = await Trainee.create(traineeData);

  await createAuditLog({
    user: null,
    action: 'TRAINEE_SELF_REGISTER',
    resource: 'Trainee',
    resourceId: trainee._id.toString(),
    details: {
      email: trainee.email,
      phone: trainee.phone,
      traineeId: trainee.traineeId,
      domainWarning,
    },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Trainee registration submitted successfully and is pending Super Admin approval.',
    data: {
      _id: trainee._id,
      traineeId: trainee.traineeId,
      firstName: trainee.firstName,
      lastName: trainee.lastName,
      email: trainee.email,
      approvalStatus: trainee.approvalStatus,
      domainWarning,
    },
  });
});

/**
 * @desc    Lookup trainee registration status (Public)
 * @route   GET /api/trainees/lookup
 * @access  Public
 */
const lookupTrainee = asyncHandler(async (req, res, next) => {
  const { identifier } = req.query; // email or phone
  if (!identifier) {
    return next(new ApiError('Email or mobile number is required', 400));
  }

  const cleanId = identifier.trim().toLowerCase();
  const trainee = await Trainee.findOne({
    $or: [{ email: cleanId }, { phone: identifier.trim() }, { traineeId: identifier.trim() }],
  });

  if (!trainee) {
    return res.status(200).json({
      success: true,
      data: { registered: false },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      registered: true,
      _id: trainee._id,
      traineeId: trainee.traineeId,
      firstName: trainee.firstName,
      lastName: trainee.lastName,
      fullName: trainee.fullName,
      email: trainee.email,
      phone: trainee.phone,
      organization: trainee.organization,
      designation: trainee.designation,
      gender: trainee.gender,
      socialCategory: trainee.socialCategory,
      approvalStatus: trainee.approvalStatus,
      rejectionReason: trainee.rejectionReason,
      domainWarning: trainee.domainWarning,
    },
  });
});

/**
 * @desc    Super Admin approves trainee registration
 * @route   PUT /api/trainees/:id/approve
 * @access  Private (super_admin)
 */
const approveTrainee = asyncHandler(async (req, res, next) => {
  const trainee = await Trainee.findById(req.params.id);
  if (!trainee) return next(new ApiError('Trainee not found', 404));

  if (trainee.approvalStatus === 'APPROVED') {
    return next(new ApiError('Trainee is already approved', 400));
  }

  // Assign permanent Trainee ID if it was temporary application ID
  if (!trainee.traineeId || trainee.traineeId.startsWith('HRDC-APP-')) {
    const approvedCount = await Trainee.countDocuments({ approvalStatus: 'APPROVED' });
    trainee.traineeId = `HRDC-${String(approvedCount + 1).padStart(6, '0')}`;
  }

  trainee.approvalStatus = 'APPROVED';
  trainee.approvedBy = req.user._id;
  trainee.approvedAt = new Date();
  trainee.rejectionReason = undefined;

  await trainee.save();

  await createAuditLog({
    user: req.user,
    action: 'TRAINEE_APPROVE',
    resource: 'Trainee',
    resourceId: trainee._id.toString(),
    details: {
      traineeId: trainee.traineeId,
      email: trainee.email,
      approvedBy: req.user.name,
      domainWarning: trainee.domainWarning,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Trainee ${trainee.fullName} (${trainee.traineeId}) approved successfully.`,
    data: trainee,
  });
});

/**
 * @desc    Super Admin rejects trainee registration
 * @route   PUT /api/trainees/:id/reject
 * @access  Private (super_admin)
 */
const rejectTrainee = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const trainee = await Trainee.findById(req.params.id);
  if (!trainee) return next(new ApiError('Trainee not found', 404));

  trainee.approvalStatus = 'REJECTED';
  trainee.rejectionReason = reason || 'Verification criteria not met';
  trainee.approvedBy = req.user._id;
  trainee.approvedAt = new Date();

  await trainee.save();

  await createAuditLog({
    user: req.user,
    action: 'TRAINEE_REJECT',
    resource: 'Trainee',
    resourceId: trainee._id.toString(),
    details: {
      traineeId: trainee.traineeId,
      email: trainee.email,
      reason: trainee.rejectionReason,
      rejectedBy: req.user.name,
    },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Trainee registration rejected.',
    data: trainee,
  });
});

/**
 * @desc    Get distinct filter options from approved trainees (for coordinator invitation filters)
 * @route   GET /api/trainees/filter-options
 * @access  Private (admin, super_admin)
 */
const getTraineeFilterOptions = asyncHandler(async (req, res) => {
  const [organizations, designations, states] = await Promise.all([
    Trainee.distinct('organization', { approvalStatus: 'APPROVED', organization: { $ne: null, $ne: '' } }),
    Trainee.distinct('designation', { approvalStatus: 'APPROVED', designation: { $ne: null, $ne: '' } }),
    Trainee.distinct('address.state', { approvalStatus: 'APPROVED', 'address.state': { $ne: null, $ne: '' } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      organizations: organizations.filter(Boolean).sort(),
      designations: designations.filter(Boolean).sort(),
      states: states.filter(Boolean).sort(),
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
  registerTrainee,
  lookupTrainee,
  approveTrainee,
  rejectTrainee,
  getTraineeFilterOptions,
};
