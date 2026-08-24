const { mongoose } = require('./base');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'global' },
    siteName: { type: String, default: 'Tevexxo' },
    siteEmail: { type: String, default: 'support@tevexxo.com' },
    siteDescription: { type: String, default: 'Empowering future tech leaders with industry-focused learning.' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR (₹)' },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      newUserRegistration: { type: Boolean, default: true },
      newEnrollment: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: false },
      newInquiry: { type: Boolean, default: true },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, collection: 'settings' }
);

settingsSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret.key;
    return ret;
  },
});

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingsSchema);
