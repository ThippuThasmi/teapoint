import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { signToken } from '../src/middleware/auth';
import { computeOrder, orderSchema } from '../src/modules/orders';

const config = loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'x'.repeat(40) } as NodeJS.ProcessEnv);

function fakePool(handler: (sql: string, params?: unknown[]) => { rows: unknown[]; rowCount?: number }) {
  return {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      const r = handler(sql, params);
      return { rowCount: r.rows.length, ...r };
    }),
    connect: vi.fn(),
  } as never;
}

describe('health endpoints', () => {
  it('liveness returns ok without touching the database', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const res = await request(createApp(pool, config)).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('readiness returns 503 when the database is down', async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error('down')) } as never;
    const res = await request(createApp(pool, config)).get('/ready');
    expect(res.status).toBe(503);
  });

  it('exposes prometheus metrics', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const res = await request(createApp(pool, config)).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
  });
});

describe('catalog', () => {
  it('lists products', async () => {
    const pool = fakePool(() => ({ rows: [{ id: 1, name: 'Masala Chai', priceMinor: 2000 }] }));
    const res = await request(createApp(pool, config)).get('/api/products?category=tea-coffee');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Masala Chai');
  });

  it('returns 404 for an unknown product', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const res = await request(createApp(pool, config)).get('/api/products/999');
    expect(res.status).toBe(404);
  });

  it('rejects a non-numeric product id', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const res = await request(createApp(pool, config)).get('/api/products/abc');
    expect(res.status).toBe(400);
  });
});

describe('auth and admin', () => {
  it('logs in with valid credentials', async () => {
    const hash = await bcrypt.hash('secret-pass', 4);
    const pool = fakePool(() => ({
      rows: [{ id: 1, email: 'a@b.co', name: 'A', role: 'customer', password_hash: hash }],
    }));
    const res = await request(createApp(pool, config))
      .post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'secret-pass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const hash = await bcrypt.hash('secret-pass', 4);
    const pool = fakePool(() => ({
      rows: [{ id: 1, email: 'a@b.co', name: 'A', role: 'customer', password_hash: hash }],
    }));
    const res = await request(createApp(pool, config))
      .post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('blocks admin routes for anonymous and customer users', async () => {
    const app = createApp(fakePool(() => ({ rows: [] })), config);
    expect((await request(app).get('/api/admin/orders')).status).toBe(401);
    const token = signToken(config.jwtSecret, { id: 2, role: 'customer' });
    const res = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows admins to list orders', async () => {
    const app = createApp(fakePool(() => ({ rows: [{ id: 1 }] })), config);
    const token = signToken(config.jwtSecret, { id: 1, role: 'admin' });
    const res = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('order pricing', () => {
  it('computes totals from database prices', () => {
    const r = computeOrder(
      [
        { id: 1, name: 'Chai', price_minor: 2000 },
        { id: 2, name: 'Samosa', price_minor: 3000 },
      ],
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    );
    expect(r.totalMinor).toBe(7000);
    expect(r.lines).toHaveLength(2);
  });

  it('rejects unavailable products', () => {
    expect(() => computeOrder([], [{ productId: 9, quantity: 1 }])).toThrow(/unavailable/);
  });

  it('validates order payloads', () => {
    expect(orderSchema.safeParse({ customerName: 'A', phone: '123', items: [] }).success).toBe(false);
    expect(
      orderSchema.safeParse({ customerName: 'A', phone: '9876543210', items: [{ productId: 1, quantity: 2 }] })
        .success,
    ).toBe(true);
  });
});
