import { createApp } from './app';
import { loadConfig } from './config';
import { createPool } from './db';

const config = loadConfig();
const pool = createPool(config);
const app = createApp(pool, config);

const server = app.listen(config.port, () => {
  console.log(JSON.stringify({ level: 'info', msg: 'teapoint-backend listening', port: config.port }));
});

function shutdown(signal: string) {
  console.log(JSON.stringify({ level: 'info', msg: 'shutting down', signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
