const { createCrudController } = require('./crud.factory');
const BlogPost = require('../models/BlogPost');

module.exports = createCrudController({
  Model: BlogPost,
  entity: 'BLOG',
  resource: 'blog',
  label: 'Blog post',
});
