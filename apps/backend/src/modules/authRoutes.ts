import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { HttpError, wrap } from '../errors';
import { requireAuth, signToken } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export function authRouter(pool: Pool, jwtSecret: string): Router {
  const r = Router();

  r.post(
    '/register',
    wrap(async (req, res) => {
      const body = registerSchema.parse(req.body);
      const email = body.email.toLowerCase();
      const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
      if (exists.rowCount) throw new HttpError(409, 'Email already registered');
      const hash = await bcrypt.hash(body.password, 10);
      const { rows } = await pool.query(
        `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'customer')
         RETURNING id, email, name, role`,
        [email, body.name, hash],
      );
      const user = rows[0];
      res.status(201).json({ token: signToken(jwtSecret, user), user });
    }),
  );

  r.post(
    '/login',
    wrap(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const { rows } = await pool.query(
        'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
        [body.email.toLowerCase()],
      );
      const row = rows[0];
      if (!row || !(await bcrypt.compare(body.password, row.password_hash))) {
        throw new HttpError(401, 'Invalid email or password');
      }
      const user = { id: row.id, email: row.email, name: row.name, role: row.role };
      res.json({ token: signToken(jwtSecret, user), user });
    }),
  );

  r.get(
    '/me',
    requireAuth,
    wrap(async (req, res) => {
      const { rows } = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [
        req.user!.id,
      ]);
      if (!rows[0]) throw new HttpError(404, 'User not found');
      res.json(rows[0]);
    }),
  );

  return r;
}
