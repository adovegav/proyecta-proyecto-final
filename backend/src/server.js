import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(error.status || 500).json({ message: error.status === 400 ? 'JSON inválido' : 'Error del servidor' });
});
app.listen(Number(process.env.PORT || 3000), () => console.log(`API en http://localhost:${process.env.PORT || 3000}`));
