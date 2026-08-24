const express = require('express');
const { protect } = require('../middleware/auth');

/** Builds GET / GET/:id POST / PUT /:id DELETE /:id routes for an entity controller */
function crudRouter(controller) {
  const router = express.Router();
  router.use(protect);
  router.get('/', controller.list);
  router.get('/:id', controller.getOne);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

module.exports = { crudRouter };
