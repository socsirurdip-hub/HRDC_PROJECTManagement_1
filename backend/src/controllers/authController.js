const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Private (super_admin only)
 */
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ApiError('User with this email already exists', 400));
  }

  const user = await User.create({ name, email, password, role, department, phone });

  await createAuditLog({
    user: req.user,
    action: 'USER_CREATED',
    resource: 'User',
    resourceId: user._id.toString(),
    details: { name, email, role },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    await createAuditLog({
      action: 'LOGIN_FAILED',
      resource: 'Auth',
      details: { email },
      ipAddress: req.ip,
      status: 'FAILED',
    });
    return next(new ApiError('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new ApiError('Your account has been deactivated. Contact administrator.', 401));
  }

  if (user.isLocked) {
    return next(new ApiError('Account is temporarily locked. Try again later.', 423));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
    }
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      user,
      action: 'LOGIN_FAILED',
      resource: 'Auth',
      ipAddress: req.ip,
      status: 'FAILED',
    });
    return next(new ApiError('Invalid credentials', 401));
  }

  // Reset login attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = user.generateJWT();

  await createAuditLog({
    user,
    action: 'LOGIN',
    resource: 'Auth',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      lastLogin: user.lastLogin,
    },
  });
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Logout user (client-side token removal, logs event)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  await createAuditLog({
    user: req.user,
    action: 'LOGOUT',
    resource: 'Auth',
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = { registerUser, loginUser, getMe, logoutUser };
