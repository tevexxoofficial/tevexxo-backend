const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();

  app.set('trust proxy', true);

  // CORS
  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          env.clientOrigins.includes('*') ||
          env.clientOrigins.includes(origin)
        ) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (env.nodeEnv !== 'test') {
    app.use(
      morgan(
        env.nodeEnv === 'production' ? 'combined' : 'dev'
      )
    );
  }

  // Root route
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Tevexxo Admin API is running',
    });
  });

  // Health check
  app.get('/api/admin/health', (_req, res) =>
    res.json({
      success: true,
      message: 'Tevexxo Admin API is running',
      time: new Date().toISOString(),
    })
  );

  // Public read-only API for the Main Tevexxo Landing Website
  app.use(
    '/api/public',
    require('./routes/public.routes')
  );

  // Admin routes
  app.use(
    '/api/admin/auth',
    require('./routes/auth.routes')
  );

  app.use(
    '/api/admin/dashboard',
    require('./routes/dashboard.routes')
  );

  app.use(
    '/api/admin/activity',
    require('./routes/activity.routes')
  );

  app.use(
    '/api/admin/audit-logs',
    require('./routes/auditLogs.routes')
  );

  app.use(
    '/api/admin/notifications',
    require('./routes/notifications.routes')
  );

  app.use(
    '/api/admin/settings',
    require('./routes/settings.routes')
  );

  app.use(
    '/api/admin/reports',
    require('./routes/reports.routes')
  );

  app.use(
    '/api/admin',
    require('./routes/entities.routes')
  );

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;