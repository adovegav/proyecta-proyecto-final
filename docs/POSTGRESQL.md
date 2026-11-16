# Preparar PostgreSQL

En este equipo se detectó PostgreSQL 15.1 en `C:\Program Files\PostgreSQL\15`. Servicio Windows: `postgresql-x64-15`. No es necesario reinstalar para comenzar. Antes de la entrega conviene actualizar a la última revisión de la versión mayor elegida.

## 1. Servicio

Comprobar desde PowerShell:

```powershell
Get-Service postgresql-x64-15
```

Si está detenido, iniciar desde Servicios de Windows o PowerShell con permisos de administrador:

```powershell
Start-Service postgresql-x64-15
```

## 2. Usuario y base dedicados

Agregar las herramientas a la terminal actual:

```powershell
$env:Path = "C:\Program Files\PostgreSQL\15\bin;$env:Path"
```

Crear usuario sin privilegios de superusuario y base propia. Los comandos solicitan contraseñas interactivamente: la del nuevo usuario y la del administrador `postgres` según corresponda. No hace falta compartirlas en el chat.

```powershell
createuser -h localhost -p 5432 -U postgres -W -P --no-superuser --no-createdb --no-createrole gestor_app
createdb -h localhost -p 5432 -U postgres -W --owner=gestor_app gestor_proyectos
```

Ejecutar una vez. Si los nombres ya existen, revisar los objetos existentes antes de continuar; no borrar bases para repetir estos pasos. También se puede crear el rol de login y la base con propietario `gestor_app` desde pgAdmin.

## 3. Backend

En `backend/.env` configurar:

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=gestor_proyectos
PGUSER=gestor_app
PGPASSWORD="tu_contraseña_local"
```

Usar el puerto real de tu instancia si difiere de 5432. `.env` está excluido de Git. No colocar credenciales de PostgreSQL en frontend.

Desde la raíz:

```powershell
. .\scripts\activar-entorno.ps1
cd backend
npm.cmd ci
npm.cmd run db:check
```

Resultado esperado: `Conexión PostgreSQL correcta` con nombre de base y usuario. No imprime contraseñas. El comando tiene un tiempo límite de conexión de cinco segundos.

## Alcance actual

El pool y el comando de comprobación están preparados. El esquema de tablas, migraciones y creación de usuario de la aplicación siguen pendientes. El usuario PostgreSQL `gestor_app` es distinto del usuario que iniciará sesión en la página.

`GET /api/health` comprueba únicamente el proceso HTTP; no confirma conexión con PostgreSQL. Usar `db:check` para verificar la base.

## Diagnóstico

- Conexión rechazada: revisar servicio, host y puerto.
- `28P01`: revisar usuario y contraseña.
- `3D000`: crear la base o corregir `PGDATABASE`.
- Comando `psql` no reconocido: agregar la carpeta `bin` al PATH temporal como se indica arriba.

Referencias: [conexiones node-postgres](https://node-postgres.com/features/connecting), [createuser](https://www.postgresql.org/docs/15/app-createuser.html), [createdb](https://www.postgresql.org/docs/15/app-createdb.html).
