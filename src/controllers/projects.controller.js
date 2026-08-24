const { createCrudController } = require('./crud.factory');
const Project = require('../models/Project');

module.exports = createCrudController({
  Model: Project,
  entity: 'PROJECT',
  resource: 'projects',
  label: 'Project',
});
