const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Creates an audit log entry for a user action
 */
const createAuditLog = async ({
  user,
  action,
  resource,
  resourceId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
  status = 'SUCCESS',
}) => {
  try {
    await AuditLog.create({
      user: user?._id || null,
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status,
    });
  } catch (error) {
    logger.error(`Audit log creation failed: ${error.message}`);
  }
};

/**
 * Middleware factory: Creates audit log for route actions
 */
const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    res.on('finish', () => {
      const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILED';
      createAuditLog({
        user: req.user,
        action,
        resource,
        resourceId: req.params?.id || null,
        details: { method: req.method, path: req.path },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
        status,
      });
    });
    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
