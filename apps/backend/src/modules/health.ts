import { Router } from 'express';
import type { Pool } from 'pg';
import type { Registry } from 'prom-client';

export function healthRouter(pool: Pool, registry: Registry): Router {
  const r = Router();

  // Liveness: process is up. Never touches dependencies.
  r.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness: can serve traffic (database reachable).
  r.get('/ready', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not-ready' });
    }
  });

  r.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });

  return r;
}
