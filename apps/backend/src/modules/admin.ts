import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { HttpError, wrap } from '../errors';
import { requireAdmin } from '../middleware/auth';
import { PRODUCT_SELECT } from './catalog';
import { ORDER_LIST_SQL } from './orders';

const productSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  emoji: z.string().max(8).default('🍵'),
  priceMinor: z.number().int().positive(),
  available: z.boolean().default(true),
});
const statusSchema = z.object({
  status: z.enum(['placed', 'preparing', 'ready', 'completed', 'cancelled']),
});

export function adminRouter(pool: Pool): Router {
  const r = Router();
  r.use(requireAdmin);

  r.get(
    '/orders',
    wrap(async (_req, res) => {
      const { rows } = await pool.query(ORDER_LIST_SQL(''));
      res.json(rows);
    }),
  );

  r.patch(
    '/orders/:id/status',
    wrap(async (req, res) => {
      const { status } = statusSchema.parse(req.body);
      const { rows } = await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status',
        [status, Number(req.params.id)],
      );
      if (!rows[0]) throw new HttpError(404, 'Order not found');
      res.json(rows[0]);
    }),
  );

  r.get(
    '/products',
    wrap(async (_req, res) => {
      const { rows } = await pool.query(`${PRODUCT_SELECT} ORDER BY c.sort_order, p.name`);
      res.json(rows);
    }),
  );

  r.post(
    '/products',
    wrap(async (req, res) => {
      const p = productSchema.parse(req.body);
      const { rows } = await pool.query(
        `INSERT INTO products (category_id, name, description, emoji, price_minor, available)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [p.categoryId, p.name, p.description, p.emoji, p.priceMinor, p.available],
      );
      res.status(201).json(rows[0]);
    }),
  );

  r.put(
    '/products/:id',
    wrap(async (req, res) => {
      const p = productSchema.parse(req.body);
      const { rows } = await pool.query(
        `UPDATE products SET category_id=$1, name=$2, description=$3, emoji=$4, price_minor=$5, available=$6
         WHERE id=$7 RETURNING id`,
        [p.categoryId, p.name, p.description, p.emoji, p.priceMinor, p.available, Number(req.params.id)],
      );
      if (!rows[0]) throw new HttpError(404, 'Product not found');
      res.json(rows[0]);
    }),
  );

  r.delete(
    '/products/:id',
    wrap(async (req, res) => {
      const result = await pool.query('DELETE FROM products WHERE id = $1', [Number(req.params.id)]);
      if (!result.rowCount) throw new HttpError(404, 'Product not found');
      res.status(204).end();
    }),
  );

  return r;
}
