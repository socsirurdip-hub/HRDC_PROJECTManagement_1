const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (super_admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, isActive, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: users,
  });
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (super_admin)
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new ApiError('User not found', 404));
  res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (super_admin)
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'email', 'role', 'department', 'phone', 'isActive'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) return next(new ApiError('User not found', 404));

  await createAuditLog({
    user: req.user,
    action: 'USER_UPDATED',
    resource: 'User',
    resourceId: req.params.id,
    details: updates,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (super_admin)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError('User not found', 404));

  if (user.role === 'super_admin') {
    return next(new ApiError('Cannot delete super admin account', 403));
  }

  await User.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user,
    action: 'USER_DELETED',
    resource: 'User',
    resourceId: req.params.id,
    details: { name: user.name, email: user.email },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/users/:id/toggle-status
 * @access  Private (super_admin)
 */
const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError('User not found', 404));

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    user: req.user,
    action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    resource: 'User',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { isActive: user.isActive },
  });
});

module.exports = { getUsers, getUserById, updateUser, deleteUser, toggleUserStatus };
