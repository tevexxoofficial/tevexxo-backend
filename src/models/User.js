const { mongoose, buildEntitySchema } = require('./base');

// Admin > Users page - platform accounts need unique emails
const schema = buildEntitySchema(
  {
    role: { type: String, enum: ['Learner', 'Instructor', 'Admin'], default: 'Learner' },
  },
  'users',
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: { unique: true, sparse: false },
    },
  }
);

schema.path('status').validate((v) => ['Active', 'Inactive'].includes(v), 'Invalid status');

module.exports = mongoose.models.User || mongoose.model('User', schema);
