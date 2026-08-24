const { mongoose, buildEntitySchema } = require('./base');

// Admin > Testimonials page
const schema = buildEntitySchema(
  {
    rating: { type: Number, min: 1, max: 5, default: 5 },
  },
  'testimonials'
);

module.exports = mongoose.models.Testimonial || mongoose.model('Testimonial', schema);
