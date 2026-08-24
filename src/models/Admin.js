const { mongoose } = require('./base');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: 'Super Admin' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['Super Admin', 'Admin'], default: 'Super Admin' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false, collection: 'admins' }
);

adminSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
