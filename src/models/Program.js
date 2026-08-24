const { mongoose, buildEntitySchema } = require('./base');

// Admin > Programs page
const schema = buildEntitySchema(
  {
    enrolled: { type: Number, default: 0 },
  },
  'programs'
);

module.exports = mongoose.models.Program || mongoose.model('Program', schema);
