const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Middleware: Protect routes - validates JWT and attaches user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ApiError('User no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new ApiError('Your account has been deactivated', 401));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new ApiError('Password recently changed. Please login again', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError('Invalid or expired token', 401));
  }
});

/**
 * Middleware: Restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
