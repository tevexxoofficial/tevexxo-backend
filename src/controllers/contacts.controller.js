const { createCrudController } = require('./crud.factory');
const Inquiry = require('../models/Inquiry');

// Inquiries = contact messages from the public site
module.exports = createCrudController({
  Model: Inquiry,
  entity: 'CONTACT',
  resource: 'inquiries',
  label: 'Inquiry',
  requiredOnCreate: ['name'],
});
