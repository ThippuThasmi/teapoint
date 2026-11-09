import { Router } from 'express';
import type { Counter } from 'prom-client';
import type { Pool } from 'pg';
import { z } from 'zod';
import { HttpError, wrap } from '../errors';
import { requireAuth } from '../middleware/auth';

export const orderSchema = z.object({
  customerName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  notes: z.string().max(500).optional(),
  items: z
    .array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
});
export type OrderInput = z.infer<typeof orderSchema>;

export interface PricedProduct {
  id: number;
  name: string;
  price_minor: number;
}

/** Prices come from the database, never from the client. */
export function computeOrder(products: PricedProduct[], items: OrderInput['items']) {
  const byId = new Map(products.map((p) => [p.id, p]));
  let total = 0;
  const lines = items.map((item) => {
    const p = byId.get(item.productId);
    if (!p) throw new HttpError(400, `Product ${item.productId} is unavailable`);
    total += p.price_minor * item.quantity;
    return { productId: p.id, name: p.name, unitPriceMinor: p.price_minor, quantity: item.quantity };
  });
  return { lines, totalMinor: total };
}

export function ordersRouter(pool: Pool, ordersTotal: Counter): Router {
  const r = Router();

  r.post(
    '/',
    wrap(async (req, res) => {
      const body = orderSchema.parse(req.body);
      const ids = [...new Set(body.items.map((i) => i.productId))];
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const prod = await client.query(
          'SELECT id, name, price_minor FROM products WHERE id = ANY($1::int[]) AND available = TRUE',
          [ids],
        );
        const { lines, totalMinor } = computeOrder(prod.rows, body.items);
        const order = await client.query(
          `INSERT INTO orders (user_id, customer_name, phone, notes, total_minor)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, status, total_minor AS "totalMinor", created_at AS "createdAt"`,
          [req.user?.id ?? null, body.customerName, body.phone, body.notes ?? null, totalMinor],
        );
        for (const l of lines) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, name, unit_price_minor, quantity)
             VALUES ($1, $2, $3, $4, $5)`,
            [order.rows[0].id, l.productId, l.name, l.unitPriceMinor, l.quantity],
          );
        }
        await client.query('COMMIT');
        ordersTotal.inc();
        res.status(201).json({ ...order.rows[0], items: lines });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }),
  );

  r.get(
    '/mine',
    requireAuth,
    wrap(async (req, res) => {
      const { rows } = await pool.query(ORDER_LIST_SQL('WHERE o.user_id = $1'), [req.user!.id]);
      res.json(rows);
    }),
  );

  return r;
}

export const ORDER_LIST_SQL = (where: string) => `
  SELECT o.id, o.customer_name AS "customerName", o.phone, o.notes, o.status,
         o.total_minor AS "totalMinor", o.created_at AS "createdAt",
         COALESCE(json_agg(json_build_object(
           'name', i.name, 'quantity', i.quantity, 'unitPriceMinor', i.unit_price_minor
         ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
  FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
  ${where}
  GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`;
