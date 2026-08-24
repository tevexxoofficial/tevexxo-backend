const { mongoose, buildEntitySchema } = require('./base');

// Admin > Projects page
const schema = buildEntitySchema(
  {
    submissions: { type: Number, default: 0 },
  },
  'projects'
);

module.exports = mongoose.models.Project || mongoose.model('Project', schema);
