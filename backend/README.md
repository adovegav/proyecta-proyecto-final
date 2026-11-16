# Proyecta · Backend

API REST independiente en Node.js 24, Express y PostgreSQL 18. Instalar con `npm ci`; ejecutar `npm run setup` para preparar `.env`, configurar PostgreSQL y luego `npm run db:migrate`, `npm run db:seed`, `npm start`.

La guía completa está en el README de la raíz del repositorio y en `GUIA_INSTALACION.md` dentro del ZIP de entrega. Las rutas se documentan en `docs/API.md` del repositorio.

Pruebas de integración: `npm test`. Requieren una base migrada y credenciales configuradas. Crean usuarios temporales y eliminan únicamente sus propios registros al terminar.
