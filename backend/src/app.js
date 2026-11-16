import express from 'express';
import cors from 'cors';
import { authRouter, authorize } from './auth.js';

export function createApp() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Configura JWT_SECRET con al menos 32 caracteres.');
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api', authorize);
  app.get('/api/auth/me', (req, res) => res.json(req.user));
  app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));
  app.use((error, _req, res, _next) => {
    if (error.code === '23503') return res.status(409).json({ message: 'El proyecto tiene tareas relacionadas. Elimínalas antes de borrar el proyecto.' });
    const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 500;
    if (status === 500) console.error('Error de API:', error.code || error.message);
    res.status(status).json({ message: status === 500 ? 'No se pudo completar la operación. Intenta nuevamente.' : error.type === 'entity.parse.failed' ? 'JSON inválido.' : error.message });
  });
  return app;
}
