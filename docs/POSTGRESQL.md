# Preparar PostgreSQL

Versión elegida y verificada por conexión: PostgreSQL 18.7 en `localhost:5433`. Base `gestor_proyectos` creada y conexión del backend comprobada. PostgreSQL 15 permanece en el puerto 5432. Las instancias y sus datos son independientes; no se realizó migración de datos de 15 a 18.

La instancia 18 se inició con `pg_ctl`, limitada a localhost, sin registrar un servicio Windows. Después de reiniciar el equipo, ejecutar desde la raíz:

```powershell
.\scripts\iniciar-postgres18.ps1
```

Este script usa el clúster existente en `C:\Program Files\PostgreSQL\18\data`, puerto 5433 y logs en `.tools/postgres18.log`. No inicializa ni elimina datos. En este equipo el backend usa el usuario `postgres` con la contraseña local configurada en `.env`. Los pasos de creación siguientes son para instalaciones nuevas con usuario dedicado.

## 1. Servicio

Comprobar desde PowerShell:

```powershell
Get-Service -Name '*postgres*'
```

Si está detenido, iniciar desde Servicios de Windows o PowerShell con permisos de administrador:

```powershell
Start-Service -Name NOMBRE_DEL_SERVICIO
```

## 2. Usuario y base dedicados

Agregar las herramientas a la terminal actual:

```powershell
$env:Path = "C:\Program Files\PostgreSQL\18\bin;$env:Path"
```

Crear usuario sin privilegios de superusuario y base propia. Los comandos solicitan contraseñas interactivamente: la del nuevo usuario y la del administrador `postgres` según corresponda. No hace falta compartirlas en el chat.

```powershell
createuser -h localhost -p 5433 -U postgres -W -P --no-superuser --no-createdb --no-createrole gestor_app
createdb -h localhost -p 5433 -U postgres -W --owner=gestor_app gestor_proyectos
```

Ejecutar una vez. Si los nombres ya existen, revisar los objetos existentes antes de continuar; no borrar bases para repetir estos pasos. También se puede crear el rol de login y la base con propietario `gestor_app` desde pgAdmin.

## 3. Backend

En `backend/.env` configurar:

```dotenv
PGHOST=localhost
PGPORT=5433
PGDATABASE=gestor_proyectos
PGUSER=gestor_app
PGPASSWORD="tu_contraseña_local"
```

Usar el puerto real de tu instancia si difiere de 5433. Una instalación estándar puede usar 5432; este proyecto usa 5433 para evitar conflicto con PostgreSQL 15. `.env` está excluido de Git. No colocar credenciales de PostgreSQL en frontend.

Desde la raíz:

```powershell
. .\scripts\activar-entorno.ps1
cd backend
npm.cmd ci
npm.cmd run db:check
```

Resultado esperado: `Conexión PostgreSQL correcta` con nombre de base y usuario. No imprime contraseñas. El comando tiene un tiempo límite de conexión de cinco segundos.

## Alcance actual

El pool, el esquema relacional, las migraciones y el usuario de demostración están implementados. Ejecutar `npm run setup`, configurar `.env`, y luego `npm run db:migrate` y `npm run db:seed` desde backend. El usuario PostgreSQL `gestor_app` es distinto del usuario que iniciará sesión en la página. En el equipo actual se utiliza `postgres` para conexión local, como fue solicitado.

`GET /api/health` comprueba únicamente el proceso HTTP; no confirma conexión con PostgreSQL. Usar `db:check` para verificar la base.

## Diagnóstico

- Conexión rechazada: revisar servicio, host y puerto.
- `28P01`: revisar usuario y contraseña.
- `3D000`: crear la base o corregir `PGDATABASE`.
- Comando `psql` no reconocido: agregar la carpeta `bin` al PATH temporal como se indica arriba.

Referencias: [conexiones node-postgres](https://node-postgres.com/features/connecting), [createuser](https://www.postgresql.org/docs/18/app-createuser.html), [createdb](https://www.postgresql.org/docs/18/app-createdb.html).
