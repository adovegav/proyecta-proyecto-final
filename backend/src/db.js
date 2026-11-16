import pg from 'pg';

export const pool = new pg.Pool({
  connectionTimeoutMillis: 5000,
  max: 10,
});

pool.on('error', error => {
  console.error('Error en conexión PostgreSQL:', error.code || 'desconocido');
});
