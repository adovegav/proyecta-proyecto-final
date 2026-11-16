# Plan de trabajo

## Alcance propuesto

Gestor de proyectos y tareas para un usuario autenticado. Permite registrar proyectos y administrar sus tareas. Es una propuesta inicial modificable antes de implementar el dominio. Estimación orientativa: 20–28 horas, según experiencia; no hay fecha de entrega indicada.

Tecnologías: React con JavaScript y React Router; CSS Grid y Flexbox; Fetch; Node 24 LTS y Express; SQLite con el módulo integrado `node:sqlite`; contraseñas con bcryptjs y autenticación JWT con jsonwebtoken. No se requiere Docker ni servidor de base de datos separado. Dependencias resueltas registradas en los lockfiles: usar `npm ci`.

## Modelo y reglas

- Usuario: id, email único, password_hash y fecha de creación.
- Proyecto: id, owner_id (FK usuario), nombre obligatorio, descripción, fecha de creación.
- Tarea: id, project_id (FK proyecto), título obligatorio, descripción, estado (`pendiente`, `en_progreso`, `completada`), fecha de creación.
- Un usuario administra únicamente sus proyectos y las tareas de estos. Validar pertenencia en backend para listas, consultas y modificaciones.
- Activar claves foráneas SQLite. Rechazar con 409 la eliminación de un proyecto con tareas; mostrar el motivo en frontend.
- Validar identificadores, campos, longitudes, estados y existencia del proyecto padre. Usar SQL parametrizado.
- Crear usuario de demostración mediante script que lea credenciales desde variables de entorno y guarde únicamente el hash. No publicar contraseñas reales.

## Pantallas mínimas

| Pantalla | Ruta frontend | Comportamiento esperado |
| --- | --- | --- |
| Login | `/login` | Validación, error de credenciales y acceso al dashboard |
| Dashboard | `/` | Totales y resumen de proyectos/tareas obtenidos por API |
| Proyectos | `/proyectos` | Lista, estado vacío, crear, editar, eliminar |
| Formulario proyecto | `/proyectos/nuevo` y `/proyectos/:id/editar` | Crear y actualizar con validación |
| Tareas | `/tareas` | Lista con nombre de proyecto, filtro y acciones CRUD |
| Formulario tarea | `/tareas/nueva` y `/tareas/:id/editar` | Selección de proyecto desde API, título y estado |

Formularios reutilizados para creación/edición: seis tipos de pantalla y ocho rutas. Todas las pantallas internas tendrán navegación, cierre de sesión, `header`, `nav`, `main`, `footer`, etiquetas accesibles y diseño responsivo. Manejar carga, error y listas vacías. Los datos de negocio, opciones de proyectos y estadísticas se obtienen desde backend.

## Contrato REST previsto

Prefijo `/api`. JSON como formato de intercambio. Las siguientes diez rutas requieren `Authorization: Bearer <token>`:

| Verbo | Ruta | Resultado |
| --- | --- | --- |
| GET | `/projects` | Lista del usuario (200) |
| GET | `/projects/:id` | Proyecto individual (200/404) |
| POST | `/projects` | Crear (201) |
| PUT | `/projects/:id` | Actualizar (200/404) |
| DELETE | `/projects/:id` | Eliminar (204/404/409) |
| GET | `/tasks` | Lista del usuario; filtro opcional `projectId` (200) |
| GET | `/tasks/:id` | Tarea individual (200/404) |
| POST | `/tasks` | Crear (201) |
| PUT | `/tasks/:id` | Actualizar (200/404) |
| DELETE | `/tasks/:id` | Eliminar (204/404) |

Adicionales: `POST /auth/login` (público), `GET /auth/me` y `GET /dashboard` (protegidos). `GET /health` público ya implementado para verificar conectividad.

Login recibe `{email, password}` y devuelve `{token, user}`. Token con vencimiento; para este alcance guardarlo en memoria y solicitar login al recargar. Backend verifica firma y expiración. Credenciales inválidas o token ausente/expirado: 401. Recurso ajeno: 404 para no revelar su existencia. Validaciones: 400; acción sin privilegios si se incorporan roles: 403. Errores JSON `{message}`. Nunca confiar solo en rutas protegidas del navegador.

## Fases y commits reales

Cada fila representa un incremento verificable. No crear commits vacíos para completar la cantidad.

| Orden | Incremento / mensaje orientativo | Validación | Horas |
| --- | --- | --- | --- |
| 1 | `chore: preparar estructura y plan de entrega` | Revisar documentos y exclusiones Git | 1 |
| 2 | `chore: preparar entorno y conexion REST base` | Build y health por Fetch | 1 |
| 3 | `feat: crear esquema SQLite e inicializacion` | Base desde cero, FK y persistencia | 2 |
| 4 | `feat: implementar login y autorizacion` | Login válido/inválido, token y pertenencia | 3 |
| 5 | `feat: implementar CRUD de proyectos` | Cinco métodos, errores y propietario | 2 |
| 6 | `feat: implementar CRUD de tareas relacionadas` | Cinco métodos, FK y pertenencia | 2 |
| 7 | `feat: crear login y navegacion protegida React` | Acceso, salida y sesión vencida | 2 |
| 8 | `feat: crear lista y formulario de proyectos` | Crear, leer, editar y borrar por UI | 2 |
| 9 | `feat: crear lista y formulario de tareas` | Relación y ciclo CRUD por UI | 2 |
| 10 | `feat: crear dashboard responsivo desde API` | Datos reales y pantalla móvil | 2 |
| 11 | `test: verificar autenticacion y CRUD relacionados` | Pruebas de integración y correcciones | 3 |
| 12 | `docs: completar guia video y entrega` | Instalación limpia, ZIP y video | 3 |

Los dos primeros incrementos corresponden a esta preparación. Los restantes se harán al desarrollar la aplicación. La evaluación no asigna puntos individuales por criterio: no se inventa un reparto de los 45 puntos.

## Flujo Git

`main`: versiones estables. `develop`: integración. `feature/base-proyecto`: base actual. Crear siguientes ramas desde develop, por ejemplo `feature/autenticacion`, `feature/proyectos` y `feature/tareas`.

Al terminar cada incremento: revisar `git diff`, agregar únicamente archivos pertinentes, hacer commit y subir la rama. Integrar a develop tras verificar; al terminar, integrar develop a main. Conservar historial de al menos diez commits lógicos en GitHub: evitar squash que reduzca el total por debajo de diez. Subir main, develop y al menos una feature. Guardar evidencia con `git log --all --graph --oneline` y el enlace de GitHub.

## Decisiones pendientes

Confirmar si se mantiene el dominio propuesto y conocer la fecha límite para convertir las horas en calendario. Crear el repositorio GitHub y comprobar acceso del docente. El entorno local puede avanzar sin esas decisiones.
