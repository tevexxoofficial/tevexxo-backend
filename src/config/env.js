const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function required(name, fallback) {
  const value = process.env[name] || fallback;
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: (process.env.MONGODB_URI || '').trim(),
  jwtSecret: process.env.JWT_SECRET || 'tevexxo_dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  seedAdmin: {
    name: required('ADMIN_NAME', 'Super Admin'),
    email: (process.env.ADMIN_EMAIL || 'admin@tevexxo.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

if (!env.mongodbUri && env.nodeEnv !== 'test') {
  console.warn('[env] WARNING: MONGODB_URI is missing. Set it in backend/.env (see .env.example).');
}
if (env.jwtSecret === 'tevexxo_dev_secret_change_me' && env.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
