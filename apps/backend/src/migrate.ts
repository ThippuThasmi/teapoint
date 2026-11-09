import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config';
import { createPool } from './db';

/**
 * Applies ./migrations/*.sql in filename order, each in its own transaction,
 * then optionally upserts the admin user from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Runs as a Helm pre-install/pre-upgrade Job inside the cluster.
 */
async function main() {
  const pool = createPool(loadConfig());
  const dir = path.join(__dirname, '..', 'migrations');
  try {
    await pool.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await pool.query(
        `INSERT INTO users (email, name, password_hash, role) VALUES ($1, 'Administrator', $2, 'admin')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
        [ADMIN_EMAIL.toLowerCase(), hash],
      );
      console.log('admin user ensured');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
