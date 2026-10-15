const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get audit logs with filters
 * @route   GET /api/audit
 * @access  Private (super_admin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, action, resource, userId, startDate, endDate } = req.query;

  const query = {};
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (userId) query.user = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: logs,
  });
});

module.exports = { getAuditLogs };
