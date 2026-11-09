import type { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

export function createMetrics() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  });
  const httpTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
  });
  const ordersTotal = new client.Counter({
    name: 'teapoint_orders_created_total',
    help: 'Orders created',
    registers: [registry],
  });

  const middleware = (req: Request, res: Response, next: NextFunction) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'unmatched';
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      end(labels);
      httpTotal.inc(labels);
    });
    next();
  };

  return { registry, middleware, ordersTotal };
}
