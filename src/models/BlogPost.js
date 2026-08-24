const { mongoose, buildEntitySchema } = require('./base');

// Admin > Blog & Content page
const schema = buildEntitySchema({}, 'blog');

module.exports = mongoose.models.BlogPost || mongoose.model('BlogPost', schema);
