const { createCrudController } = require('./crud.factory');
const Course = require('../models/Course');

module.exports = createCrudController({
  Model: Course,
  entity: 'COURSE',
  resource: 'courses',
  label: 'Course',
  requiredOnCreate: ['name'],
});
