# Proyecta · Frontend

Aplicación independiente React con JavaScript, HTML5 y CSS Grid/Flexbox. Requiere Node.js 24 y el backend en ejecución.

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev -- --strictPort
```

Abrir `http://localhost:5173`. `VITE_API_URL` debe apuntar al backend (`http://localhost:3000/api` por defecto). Build: `npm run build`; vista de producción local: `npm run preview -- --port 5173 --strictPort`.

La guía completa está en el README de la raíz del repositorio y en `GUIA_INSTALACION.md` dentro del ZIP de entrega.
