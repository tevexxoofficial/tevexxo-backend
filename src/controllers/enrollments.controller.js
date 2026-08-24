const { createCrudController } = require('./crud.factory');
const Enrollment = require('../models/Enrollment');

module.exports = createCrudController({
  Model: Enrollment,
  entity: 'ENROLLMENT',
  resource: 'enrollments',
  label: 'Enrollment',
  requiredOnCreate: ['name'],
});
