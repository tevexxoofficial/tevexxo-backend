const { mongoose } = require('./base');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    adminName: { type: String, default: '' },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SETTINGS_UPDATE', 'STATUS_CHANGE', 'PASSWORD_CHANGE', 'PROFILE_UPDATE'], required: true, index: true },
    entity: { type: String, required: true, uppercase: true, index: true },
    entityId: { type: String, default: null, index: true },
    description: { type: String, default: '' },
    oldData: { type: mongoose.Schema.Types.Mixed, default: null },
    newData: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false, collection: 'audit_logs' }
);

auditLogSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
