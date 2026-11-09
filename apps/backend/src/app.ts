import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Pool } from 'pg';
import type { Config } from './config';
import { errorHandler } from './errors';
import { authMiddleware } from './middleware/auth';
import { createMetrics } from './metrics';
import { adminRouter } from './modules/admin';
import { authRouter } from './modules/authRoutes';
import { catalogRouter } from './modules/catalog';
import { healthRouter } from './modules/health';
import { ordersRouter } from './modules/orders';

export function createApp(pool: Pool, config: Config) {
  const app = express();
  const metrics = createMetrics();

  app.disable('x-powered-by');
  app.set('trust proxy', true); // behind the AWS ALB
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  app.use(express.json({ limit: '100kb' }));
  app.use(metrics.middleware);
  app.use(authMiddleware(config.jwtSecret));

  app.use(healthRouter(pool, metrics.registry));
  app.use('/api', catalogRouter(pool));
  app.use('/api/auth', authRouter(pool, config.jwtSecret));
  app.use('/api/orders', ordersRouter(pool, metrics.ordersTotal));
  app.use('/api/admin', adminRouter(pool));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);
  return app;
}
