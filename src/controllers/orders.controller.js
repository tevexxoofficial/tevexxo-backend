const { createCrudController } = require('./crud.factory');
const Order = require('../models/Order');

module.exports = createCrudController({
  Model: Order,
  entity: 'ORDER',
  resource: 'orders',
  label: 'Order',
  requiredOnCreate: ['name', 'amount'],
});
