export interface Config {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  jwtSecret: string;
  db: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const jwtSecret = env.JWT_SECRET ?? '';
  if (nodeEnv === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set (>= 32 chars) in production');
  }
  return {
    port: Number(env.PORT ?? 3000),
    nodeEnv,
    corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    jwtSecret: jwtSecret || 'dev-only-insecure-secret-change-me-0000',
    db: {
      host: env.DB_HOST ?? 'localhost',
      port: Number(env.DB_PORT ?? 5432),
      database: env.DB_NAME ?? 'teapoint',
      user: env.DB_USER ?? 'teapoint',
      password: env.DB_PASSWORD ?? '',
      ssl: env.DB_SSL === 'true',
    },
  };
}
