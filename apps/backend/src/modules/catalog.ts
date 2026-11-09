import { Router } from 'express';
import type { Pool } from 'pg';
import { HttpError, wrap } from '../errors';

export const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.description, p.emoji, p.price_minor AS "priceMinor",
         p.available, p.category_id AS "categoryId",
         c.slug AS "categorySlug", c.name AS "categoryName"
  FROM products p JOIN categories c ON c.id = p.category_id`;

export function catalogRouter(pool: Pool): Router {
  const r = Router();

  r.get(
    '/categories',
    wrap(async (_req, res) => {
      const { rows } = await pool.query(
        'SELECT id, slug, name, description, emoji FROM categories ORDER BY sort_order, id',
      );
      res.json(rows);
    }),
  );

  r.get(
    '/products',
    wrap(async (req, res) => {
      const category = typeof req.query.category === 'string' ? req.query.category : null;
      const { rows } = await pool.query(
        `${PRODUCT_SELECT}
         WHERE p.available = TRUE AND ($1::text IS NULL OR c.slug = $1)
         ORDER BY c.sort_order, p.name`,
        [category],
      );
      res.json(rows);
    }),
  );

  r.get(
    '/products/:id',
    wrap(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid product id');
      const { rows } = await pool.query(`${PRODUCT_SELECT} WHERE p.id = $1 AND p.available = TRUE`, [id]);
      if (rows.length === 0) throw new HttpError(404, 'Product not found');
      res.json(rows[0]);
    }),
  );

  return r;
}
