# API REST de Proyecta

Base local: `http://localhost:3000/api`. Cuerpo y respuestas JSON salvo DELETE exitoso (204 sin cuerpo). Métodos PUT actualizan todos los campos editables del recurso.

## Autenticación

`POST /auth/login` público. Cuerpo: `{ "email": "demo@proyecta.local", "password": "Proyecta2026!" }` para la cuenta de demostración inicial. Respuesta 200: `{token, user: {id,name,email}}`. Error 401 para credenciales incorrectas. Límite: 30 intentos de login por IP en 15 minutos; 429 al excederlo. Las contraseñas se almacenan como hash bcrypt, nunca en texto plano.

Para todas las rutas siguientes, enviar `Authorization: Bearer TOKEN`. JWT HS256 con issuer, audience y vencimiento de dos horas. El servidor comprueba que el usuario siga existiendo y filtra todas las operaciones por propietario. Recurso ajeno se trata como inexistente (404).

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| GET | `/auth/me` | Usuario actual | 200 |
| GET | `/projects` | Lista con conteo de tareas y completadas | 200 |
| GET | `/projects/:id` | Proyecto individual | 200 |
| POST | `/projects` | Crear proyecto | 201 + Location |
| PUT | `/projects/:id` | Actualizar proyecto | 200 |
| DELETE | `/projects/:id` | Eliminar proyecto sin tareas | 204 |
| GET | `/tasks` | Lista de tareas con nombre del proyecto | 200 |
| GET | `/tasks/:id` | Tarea individual | 200 |
| POST | `/tasks` | Crear tarea en proyecto propio | 201 + Location |
| PUT | `/tasks/:id` | Actualizar tarea; reasignación solo a proyecto propio | 200 |
| DELETE | `/tasks/:id` | Eliminar tarea | 204 |
| GET | `/dashboard` | Totales y próximas tareas del usuario | 200 |
| GET | `/meta` | Estados y prioridades para formularios y filtros | 200 |

`GET /health` es público y verifica únicamente que la API HTTP funciona. Para probar conexión PostgreSQL ejecutar `npm run db:check`.

## Proyecto (POST / PUT)

```json
{
  "name": "Aplicación de cursos",
  "description": "Organizar contenidos y seguimiento.",
  "status": "active"
}
```

Nombre obligatorio hasta 120 caracteres; descripción hasta 2000 (opcional). Estados: `planning`, `active`, `completed`.

## Tarea (POST / PUT)

```json
{
  "project_id": 1,
  "title": "Diseñar el login",
  "description": "Validar el acceso y mostrar errores.",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-12-15"
}
```

Título obligatorio hasta 160 caracteres. `project_id` debe existir y ser del usuario. Estados: `pending`, `in_progress`, `completed`. Prioridades: `low`, `medium`, `high`. Fecha opcional en formato `YYYY-MM-DD`, o null/cadena vacía. GET devuelve fecha como cadena sin conversión horaria. Filtro de lista: `GET /tasks?projectId=1`.

## Errores

Formato: `{ "message": "Descripción legible." }`. 400 por campos/ID/JSON inválidos; 401 por sesión ausente, inválida o vencida; 404 por recurso inexistente o ajeno; 409 al intentar eliminar un proyecto que tiene tareas; 413 por cuerpo mayor a 100 KB; 429 por límite de login; 500 por error inesperado sin detalles SQL. CORS permite únicamente el origen configurado en `FRONTEND_ORIGIN` para lectura desde navegador; no sustituye la autorización JWT.

## Ejemplo desde PowerShell

```powershell
$credentials = @{ email = 'demo@proyecta.local'; password = 'Proyecta2026!' } | ConvertTo-Json
$session = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/login' -ContentType 'application/json' -Body $credentials
$headers = @{ Authorization = "Bearer $($session.token)" }
Invoke-RestMethod -Uri 'http://localhost:3000/api/projects' -Headers $headers
```

El token se conserva en memoria en frontend: recargar o cerrar la pestaña requiere volver a iniciar sesión. Cerrar sesión borra el token del cliente. Un token previamente emitido sigue siendo válido en la API hasta su expiración; este alcance académico no implementa revocación individual.
