const { mongoose, buildEntitySchema } = require('./base');

// Admin > Inquiries page (contact messages)
const schema = buildEntitySchema(
  {
    message: { type: String, trim: true, default: '' },
    priority: { type: String, enum: ['High', 'Normal', 'Low'], default: 'Normal' },
  },
  'inquiries'
);

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', schema);
