const { mongoose, buildEntitySchema } = require('./base');

// Admin > Mentors page
const schema = buildEntitySchema({}, 'mentors');

module.exports = mongoose.models.Mentor || mongoose.model('Mentor', schema);
