const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
    },
    userRole: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'CREATE',
        'UPDATE',
        'DELETE',
        'VIEW',
        'EXPORT',
        'PASSWORD_CHANGE',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_ACTIVATED',
        'USER_DEACTIVATED',
      ],
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1 });

// CERT-In & MeitY Immutability Guarantee: Prevent any modification or deletion of audit logs
const preventMutation = function (next) {
  const err = new Error('CERT-In Compliance Violation: Audit logs are strictly immutable and cannot be updated or deleted.');
  err.statusCode = 403;
  next(err);
};

auditLogSchema.pre('updateOne', preventMutation);
auditLogSchema.pre('updateMany', preventMutation);
auditLogSchema.pre('findOneAndUpdate', preventMutation);
auditLogSchema.pre('deleteOne', preventMutation);
auditLogSchema.pre('deleteMany', preventMutation);
auditLogSchema.pre('findOneAndDelete', preventMutation);
auditLogSchema.pre('findOneAndRemove', preventMutation);

module.exports = mongoose.model('AuditLog', auditLogSchema);
