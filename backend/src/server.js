import { createApp } from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, '127.0.0.1', () => console.log(`API en http://localhost:${port}`));
server.on('error', error => { console.error('No se pudo iniciar la API:', error.code); process.exitCode = 1; pool.end(); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
