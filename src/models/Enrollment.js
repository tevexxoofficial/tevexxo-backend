const { mongoose, buildEntitySchema } = require('./base');

// Admin > Enrollments page
const schema = buildEntitySchema(
  {
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  'enrollments'
);

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', schema);
