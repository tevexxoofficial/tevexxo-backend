const { mongoose, buildEntitySchema } = require('./base');

// Admin > Courses page
const schema = buildEntitySchema(
  {
    price: { type: Number, default: 0 }, // numeric mirror of amount (₹)
    studentsCount: { type: Number, default: 0 },
  },
  'courses'
);

module.exports = mongoose.models.Course || mongoose.model('Course', schema);
