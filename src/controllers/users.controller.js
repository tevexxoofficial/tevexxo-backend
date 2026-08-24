const { createCrudController } = require('./crud.factory');
const User = require('../models/User');

module.exports = createCrudController({
  Model: User,
  entity: 'USER',
  resource: 'users',
  label: 'User',
  requiredOnCreate: ['name', 'email'],
});
