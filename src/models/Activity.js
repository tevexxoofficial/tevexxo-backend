const { mongoose } = require('./base');

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true }, // e.g. USER_CREATED, COURSE_UPDATED...
    actor: { type: String, default: 'System' }, // admin or user name
    description: { type: String, required: true },
    entity: { type: String, default: '' },
    entityId: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false, collection: 'activities' }
);

activitySchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
