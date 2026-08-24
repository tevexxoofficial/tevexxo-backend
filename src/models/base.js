const mongoose = require('mongoose');

const baseOptions = { timestamps: true, versionKey: false };

/**
 * Shared shape used by the Admin UI tables/forms:
 * name, email, category, status, detail, amount, date, role
 * Each entity adds the extra fields its screen displays.
 */
function buildEntitySchema(fields = {}, collection, overrides = {}) {
  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 200 },
      email: { type: String, trim: true, lowercase: true, default: '' },
      category: { type: String, trim: true, default: '' },
      status: { type: String, trim: true, default: 'Active', index: true },
      detail: { type: String, trim: true, default: '' },
      amount: { type: String, trim: true, default: '' },
      date: { type: String, trim: true, default: '' },
      ...fields,
      ...overrides,
    },
    { ...baseOptions, collection }
  );

  schema.set('toJSON', {
    transform(doc, ret) {
      ret.id = ret._id.toString();
      return ret;
    },
  });
  return schema;
}

module.exports = { mongoose, baseOptions, buildEntitySchema };
