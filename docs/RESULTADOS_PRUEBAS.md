# Resultados de verificación

Verificación realizada el 16 de noviembre de 2026 con Node 24.22.3, PostgreSQL 18.7 y Chrome local.

## Backend

`npm test`: **10 pruebas aprobadas, 0 fallos**. Se inicia una API en puerto aleatorio, se crean dos usuarios temporales y se prueban peticiones HTTP reales sobre PostgreSQL. Al terminar se eliminan únicamente los registros de esos usuarios.

| Caso | Evidencia |
| --- | --- |
| Health y CORS | HTTP 200 y origen configurado en cabecera |
| Autenticación | Login válido 200; contraseña incorrecta 401; respuesta sin hash |
| Diez rutas protegidas | Cada verbo/ruta CRUD sin token devuelve 401 |
| JWT inválido/vencido | Ambos rechazos con 401 |
| Proyectos | POST 201 + Location, GET lista/individual 200, PUT 200, DELETE 204 |
| Tareas | POST 201, GET lista/individual, filtro por padre, PUT y DELETE |
| Autorización | Segundo usuario no lista, consulta, modifica ni elimina recursos ajenos; no puede crear/reasignar tareas a proyectos ajenos |
| Validaciones | Campos vacíos/largos, estados, IDs, JSON y fecha imposible devuelven 400 |
| Relación | Padre inexistente devuelve 404; borrar padre con hijos devuelve 409 |
| Dashboard | Totales por usuario y metadatos desde API |

## Interfaz

`npm run test:ui` en tooling: **aprobado**. Chrome ejecuta la aplicación real y verifica:

- Redirección de ruta interna al login sin sesión.
- Error de login y acceso válido.
- Dashboard y las seis pantallas mínimas.
- Creación, consulta, edición y borrado de proyectos y tareas desde formularios/listas.
- Asociación de tarea con proyecto y actualización de estado.
- Mensaje de conflicto al borrar un proyecto con tareas y posterior borrado en el orden correcto.
- Búsqueda sin resultados y cierre de sesión.
- Vista de 390 px sin desbordamiento horizontal del documento (tabla con scroll interno).
- Ausencia de errores JavaScript de página.

Capturas: `artifacts/capturas/01-login.png` a `07-movil.png`. Se inspeccionó visualmente login, dashboard de escritorio y dashboard móvil.

## Build y dependencias

`npm run build` en frontend: compilación correcta. Vite puede advertir sobre directivas `use client` de React Router; esta aplicación es una SPA de cliente y la compilación final se genera correctamente.

Las instalaciones npm realizadas reportaron cero vulnerabilidades. Esto refleja la auditoría disponible durante la ejecución, no una garantía permanente.

## Instalación limpia y video

La herramienta de video copia fuentes sin node_modules ni `.env`, ejecuta `npm ci` para ambos proyectos, genera configuración, comprueba conexión, aplica migración y seed en una base PostgreSQL 18 temporal y ejecuta el build. Después graba los flujos de UI sobre los servidores locales de la aplicación. La base temporal se elimina al finalizar la grabación; los datos demo de la aplicación se conservan.

Además se extrajeron `backend.zip` y `frontend.zip` en `.tools/entrega-verificada`, se instaló con `npm ci`, se aplicaron migración y seed dos veces para comprobar repetibilidad, se ejecutaron las diez pruebas y el build desde esos archivos. La API del ZIP inició en puerto 3001 y, tras detenerla y volverla a iniciar, autenticó al usuario y recuperó los tres proyectos persistentes. Resultado: instalación de los ZIP y persistencia tras reinicio aprobadas.

## Límites

No se simularon carga masiva, navegadores antiguos ni despliegue de producción. Las pruebas verifican un entorno local de ejecución. El video presenta explicaciones escritas, sin voz. El repositorio contiene fuentes y guías; las dependencias, secretos y archivos locales de entrega se excluyen del historial Git.
