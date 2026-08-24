const { mongoose, buildEntitySchema } = require('./base');

// Admin > Orders & Payments page
const schema = buildEntitySchema({}, 'orders');

module.exports = mongoose.models.Order || mongoose.model('Order', schema);
