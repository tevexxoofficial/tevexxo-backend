const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

function signToken(admin) {
  return jwt.sign({ sub: admin._id.toString(), email: admin.email, role: admin.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/** Verifies the JWT from Authorization: Bearer <token> and attaches req.admin */
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Authentication required. Missing bearer token.');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.');
  }

  const admin = await Admin.findById(decoded.sub);
  if (!admin) throw ApiError.unauthorized('Admin account no longer exists.');

  req.admin = { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role };
  next();
});

module.exports = { protect, signToken };
