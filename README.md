# Proyecta · Gestor de proyectos y tareas

Trabajo final: React y API REST Express en dos proyectos independientes, con PostgreSQL 18, autenticación JWT y autorización por propietario.

**Repositorio público:** https://github.com/adovegav/proyecta-proyecto-final

## Funcionalidad

Login, dashboard dinámico, CRUD de proyectos y tareas relacionadas, búsquedas y filtros, formularios con validaciones, confirmación de borrado y diseño responsivo. Cada usuario solo accede a sus propios datos. Las diez rutas CRUD exigen JWT y validan pertenencia en backend. Los proyectos con tareas no pueden eliminarse hasta eliminar sus tareas.

## 1. Requisitos y paquetes

| Herramienta | Versión utilizada | Uso |
| --- | --- | --- |
| Node.js | 24.22.3 (24 LTS) | Backend, npm y React |
| npm | Incluido en Node 24 | Instalación mediante lockfiles |
| PostgreSQL | 18.7 | Persistencia relacional |
| Git | 2.38.1 | Versionamiento |
| Navegador | Chrome o Edge moderno | Interfaz web |

Descargas oficiales: [Node.js](https://nodejs.org/), [PostgreSQL](https://www.postgresql.org/download/windows/), [Git](https://git-scm.com/downloads). No se necesita Docker, Python, pgAdmin ni paquetes npm globales. pgAdmin es opcional.

Backend instala `express`, `cors`, `pg`, `bcryptjs` y `jsonwebtoken`. Frontend instala `react`, `react-dom`, `react-router-dom` y Vite para desarrollo/build. Cada proyecto tiene versiones exactas en `package.json` y `package-lock.json`; usar `npm ci`. `tooling/` contiene herramientas opcionales de pruebas visuales y video: no es necesario instalarlo para ejecutar la aplicación.

## 2. Obtener el código

```powershell
git clone https://github.com/adovegav/proyecta-proyecto-final.git
cd proyecta-proyecto-final
```

Alternativa: extraer `backend.zip` y `frontend.zip` en una carpeta común. Deben quedar dos carpetas hermanas: `backend/` y `frontend/`. Cada una se instala y ejecuta por separado; se comunican únicamente por HTTP REST.

En el equipo de desarrollo existe Node portable en `.tools`, que no se entrega. **Solo en ese equipo**, desde la raíz y en cada terminal:

```powershell
. .\scripts\activar-entorno.ps1
```

En otro equipo instalar Node 24 y comprobar:

```powershell
node --version
npm.cmd --version
git --version
```

Se usa `npm.cmd` para evitar bloqueos de PowerShell sobre `npm.ps1`. En Linux/macOS usar `npm` y `cp` en lugar de `Copy-Item`.

## 3. Preparar PostgreSQL

La aplicación usa `localhost:5433`. En el equipo actual PostgreSQL 15 ocupa 5432 y PostgreSQL 18 se inició en 5433. En una instalación nueva se puede utilizar 5432 y ajustar `PGPORT` en `.env`.

En **el equipo de desarrollo**, iniciar el clúster 18 existente si está detenido:

```powershell
.\scripts\iniciar-postgres18.ps1
```

En otro equipo iniciar el servicio instalado desde Servicios de Windows o PowerShell con permisos de administrador y el nombre real:

```powershell
Get-Service -Name '*postgres*'
Start-Service -Name postgresql-x64-18
```

Agregar las herramientas a la terminal actual (adaptar ruta/puerto si corresponde):

```powershell
$env:Path = "C:\Program Files\PostgreSQL\18\bin;$env:Path"
psql --version
pg_isready -h localhost -p 5433
```

En una **instalación nueva**, crear usuario dedicado y base. Los comandos solicitan las contraseñas interactivamente:

```powershell
createuser -h localhost -p 5433 -U postgres -W -P --no-superuser --no-createdb --no-createrole gestor_app
createdb -h localhost -p 5433 -U postgres -W --owner=gestor_app gestor_proyectos
```

Usar el administrador `postgres` definido durante la instalación. No repetir si los objetos ya existen. También se pueden crear con pgAdmin. En el equipo actual la base está creada y el backend utiliza el usuario `postgres` por elección del usuario; no es necesario recrearla. La contraseña local no se distribuye.

## 4. Backend: instalación, configuración e inicialización

Desde la raíz:

```powershell
cd backend
npm.cmd ci
npm.cmd run setup
```

`setup` crea `.env` desde `.env.example` y genera un `JWT_SECRET` aleatorio de 48 bytes si falta. Conserva valores existentes y no imprime el secreto.

Editar `backend/.env` según tu instancia:

```dotenv
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
PGHOST=localhost
PGPORT=5433
PGDATABASE=gestor_proyectos
PGUSER=gestor_app
PGPASSWORD="LA_CONTRASEÑA_QUE_DEFINISTE"
JWT_SECRET=CONSERVAR_EL_VALOR_GENERADO_POR_SETUP
DEMO_EMAIL=demo@proyecta.local
DEMO_PASSWORD=Proyecta2026!
```

No copiar el texto de ejemplo sobre el secreto generado. Usar comillas si una contraseña contiene espacios o `#`. El usuario PostgreSQL es distinto del usuario de login de la aplicación. `.env` se excluye de Git y los ZIP; nunca poner secretos en variables `VITE_*`.

```powershell
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd start
```

Resultados esperados:

1. `db:check`: conexión correcta con base, usuario y versión 18.x del servidor.
2. `db:migrate`: crea `users`, `projects`, `tasks` y `schema_migrations`, con FK e índices. Solo aplica migraciones pendientes y usa transacciones.
3. `db:seed`: crea usuario demo, tres proyectos y seis tareas. Si el email existe, conserva su contraseña y sus datos. No restablece ni borra registros.
4. `start`: API en `http://localhost:3000`. Para desarrollo con recarga usar `npm run dev`.

Verificación pública: `http://localhost:3000/api/health` responde `{"status":"ok"}`. Health comprueba el proceso HTTP; `db:check` verifica PostgreSQL.

## 5. Frontend: instalación y ejecución

En **otra terminal**, desde la raíz y con Node 24 activo:

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev -- --strictPort
```

No sobrescribir `.env` si ya está configurado. Su contenido es:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Abrir **http://localhost:5173**. Mantener los dos procesos en ejecución y detenerlos con Ctrl+C. Usar `localhost` para coincidir con `FRONTEND_ORIGIN`. Al cambiar origen o puertos, actualizar variables y reiniciar ambos procesos.

## 6. Acceso y seis pantallas

Cuenta de demostración inicial, si se conservaron las variables antes del primer seed:

```text
Correo:     demo@proyecta.local
Contraseña: Proyecta2026!
```

Credenciales destinadas a la demostración académica. Se pueden cambiar en las variables antes de crear por primera vez el usuario demo.

| Pantalla | Ruta | Funcionalidad |
| --- | --- | --- |
| Login | `/login` | Acceso y errores de credenciales |
| Dashboard | `/` | Totales, progreso y próximas tareas desde API |
| Lista de proyectos | `/proyectos` | Buscar, filtrar, editar, eliminar y acceder a tareas |
| Formulario proyecto | `/proyectos/nuevo`, `/proyectos/:id/editar` | Crear y actualizar |
| Lista de tareas | `/tareas` | Buscar, filtrar por proyecto/estado, editar y eliminar |
| Formulario tarea | `/tareas/nueva`, `/tareas/:id/editar` | Crear y actualizar con relación al proyecto |

JWT dura dos horas y se guarda solo en memoria: recargar o cerrar la pestaña requiere login nuevamente. Cerrar sesión borra el token del cliente. Un token emitido sigue siendo válido en API hasta vencer; este alcance académico no incluye revocación individual ni registro público de usuarios.

## 7. Pruebas y build

Después de configurar y migrar la base, ejecutar desde backend:

```powershell
npm.cmd test
```

Diez pruebas de integración cubren login, CORS, rutas protegidas, token inválido/vencido, ambos CRUD, validaciones, aislamiento entre usuarios e integridad referencial. Crean registros temporales propios y los eliminan al terminar, conservando los datos demo.

Desde frontend:

```powershell
npm.cmd run build
npm.cmd run preview -- --port 5173 --strictPort
```

Detener el servidor de desarrollo antes de preview para liberar 5173. Mantener backend activo. En un hosting de producción configurar HTTPS y fallback a `index.html` para React Router. Se entrega ejecución local; no un despliegue público de la aplicación ni de la BD.

Prueba de interfaz opcional, con ambos servidores activos y Chrome/Edge instalado, desde la raíz:

```powershell
cd tooling
npm.cmd ci
npm.cmd run test:ui
```

Verifica seis pantallas, ambos CRUD, búsqueda, conflicto 409, salida y móvil; guarda capturas en `artifacts/capturas`. Para otra instalación Chromium se puede definir `CHROME_PATH`.

## 8. Arquitectura y API

```text
backend/src/       API, autorización, validación y consultas PostgreSQL
backend/sql/       Migraciones de esquema relacional
backend/scripts/   Configuración, migración, seed y comprobación
backend/test/      Pruebas de integración
frontend/src/      Sesión, cliente Fetch, componentes y CSS responsivo
frontend/src/pages/ Dashboard, listas y formularios
docs/              API, plan, guía, verificación y video
scripts/           Activación local, inicio de PostgreSQL y empaquetado
tooling/           Pruebas visuales y video (opcional)
```

Relaciones: `users (1) → (N) projects (1) → (N) tasks`. Claves foráneas `ON DELETE RESTRICT`, consultas parametrizadas e índices por propietario/proyecto. Dashboard obtiene un resumen consistente dentro de una transacción de lectura.

Contrato de las diez rutas CRUD, autenticación, cuerpos y errores: `docs/API.md` en GitHub o `API.md` en la entrega.

## 9. GitHub

https://github.com/adovegav/proyecta-proyecto-final

Ramas: `main`, `develop` y `feature/base-proyecto`. El historial conserva más de diez commits lógicos, sin squash que elimine los incrementos.

```powershell
git branch -a
git log --all --graph --oneline
```

## 10. ZIP y video

En la carpeta local `artifacts/entrega`: `backend.zip`, `frontend.zip`, `GUIA_INSTALACION.md`, `API.md`, `demostracion-proyecta.mp4`, índice de capítulos y hashes SHA-256. Los ZIP incluyen fuentes, lockfiles, ejemplos y guía; excluyen node_modules, `.env`, secretos, compilados y Node portable.

Regenerar desde la raíz (usa archivos registrados en Git):

```powershell
.\scripts\empaquetar.ps1
```

El video muestra instalación real de ambos proyectos en copia limpia, configuración sin revelar contraseñas, conexión y migración PostgreSQL 18 en base aislada, build, las seis pantallas y ambos CRUD. Incluye explicaciones escritas en español en pantalla; no incluye voz. Para regenerarlo ver `tooling/video.mjs`; requiere herramientas opcionales y servidores activos.

## 11. Solución de problemas

| Síntoma | Acción |
| --- | --- |
| Node/npm no reconocido | Instalar Node 24 y abrir otra terminal; en el equipo actual activar Node portable. |
| Bloqueo de npm.ps1 | Usar `npm.cmd`. |
| Conexión rechazada | Iniciar PostgreSQL y comprobar host/puerto (5433 en este equipo). |
| Error `28P01` | Revisar PGUSER/PGPASSWORD. |
| Error `3D000` | Crear la base o corregir PGDATABASE. |
| Error `42P01` | Ejecutar `npm run db:migrate`. |
| Falta JWT_SECRET | Ejecutar `npm run setup`. |
| Seed no cambia la contraseña | Es intencional: conserva usuarios existentes; usar las credenciales del primer seed. |
| Fetch/CORS | Comprobar API activa, VITE_API_URL, origen exacto y FRONTEND_ORIGIN. |
| Puerto ocupado | Detener el proceso anterior o cambiar puertos y variables relacionadas. |
| No permite borrar proyecto | Eliminar sus tareas primero. |

Referencias: [React Router](https://reactrouter.com/start/declarative/routing), [node-postgres](https://node-postgres.com/features/queries), [Vite](https://vite.dev/guide/).
