const { createCrudController } = require('./crud.factory');
const Testimonial = require('../models/Testimonial');

module.exports = createCrudController({
  Model: Testimonial,
  entity: 'TESTIMONIAL',
  resource: 'testimonials',
  label: 'Testimonial',
});
