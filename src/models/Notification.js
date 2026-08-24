const { mongoose } = require('./base');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['user', 'course', 'program', 'project', 'enrollment', 'order', 'inquiry', 'blog', 'testimonial', 'mentor', 'system'],
      default: 'system',
    },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false, collection: 'notifications' }
);

notificationSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
