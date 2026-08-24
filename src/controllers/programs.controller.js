const { createCrudController } = require('./crud.factory');
const Program = require('../models/Program');

module.exports = createCrudController({
  Model: Program,
  entity: 'PROGRAM',
  resource: 'programs',
  label: 'Program',
});
