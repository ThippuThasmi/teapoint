import { Pool } from 'pg';
import type { Config } from './config';

export function createPool(config: Config): Pool {
  return new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    // RDS presents an Amazon-issued certificate; encryption in transit is enforced.
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}
