# Gestor de proyectos y tareas

Preparación del trabajo final (45 puntos). Propuesta de dominio: proyectos (padre) y tareas (hijo). Estado actual: ambiente base y prueba de comunicación HTTP; no es todavía la aplicación final.

## Estructura

- `frontend/`: proyecto independiente React, HTML5, CSS3 y Vite.
- `backend/`: proyecto independiente Node.js y Express; SQLite previsto mediante `node:sqlite`.
- `docs/PLAN.md`: alcance, arquitectura, fases y estrategia Git.
- `docs/VERIFICACION.md`: criterios de aceptación y entregables.
- `docs/VIDEO.md`: guion de demostración.
- `scripts/activar-entorno.ps1`: activa Node portable en la terminal actual.

## Preparar y ejecutar (Windows / PowerShell)

Requisitos: Git y Node.js 24 LTS con npm. La instalación portable local está ignorada por Git y no se distribuye: al clonar el repositorio se debe instalar Node 24. La versión usada queda en `.nvmrc`. No se necesita instalar un servidor de base de datos para SQLite.

Desde la raíz, en **cada terminal**:

```powershell
. .\scripts\activar-entorno.ps1
```

Primera terminal:

```powershell
cd backend
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run dev
```

Segunda terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run dev
```

Abrir `http://localhost:5173`. Debe aparecer **Backend conectado**. El backend responde en `http://localhost:3000/api/health`. CORS permite el origen `http://localhost:5173`; usar ese nombre en el navegador. Si Vite cambia de puerto por estar ocupado, liberar el puerto 5173 o ajustar `FRONTEND_ORIGIN` y reiniciar backend.

No sobrescribir `.env` si ya está configurado. Las variables `VITE_*` son públicas; nunca colocar secretos allí. `JWT_SECRET` debe generarse al implementar login; la base actual no implementa autenticación, persistencia ni CRUD.

## Verificación del ambiente

```powershell
node --version
git --version
cd frontend
npm.cmd run build
```

Detener servidores con Ctrl+C. Ante errores de PowerShell con `npm.ps1`, utilizar `npm.cmd`. Si se restringe ejecutar el script de activación, agregar temporalmente Node al PATH sin cambiar políticas globales:

```powershell
$env:Path = "$(Get-Location)\.tools\node-v24.22.3-win-x64;$env:Path"
```

## GitHub (pendiente de creación del repositorio remoto)

Crear un repositorio vacío, preferentemente público, y ejecutar desde la raíz, reemplazando la URL:

```powershell
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
git push -u origin develop
git push -u origin feature/base-proyecto
```

La carpeta raíz reúne ambos proyectos en un repositorio; cada uno mantiene su propio `package.json`, lockfile y ejecución. La consigna exige proyectos independientes, no repositorios independientes.

## Entrega final

Seguir `docs/VERIFICACION.md`. No entregar esta base como trabajo terminado. La guía debe ampliarse con inicialización SQLite, creación de usuario y comandos reales de pruebas cuando estén implementados.
