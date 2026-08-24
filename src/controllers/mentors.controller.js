const { createCrudController } = require('./crud.factory');
const Mentor = require('../models/Mentor');

module.exports = createCrudController({
  Model: Mentor,
  entity: 'MENTOR',
  resource: 'mentors',
  label: 'Mentor',
});
