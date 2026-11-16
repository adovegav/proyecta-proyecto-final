# Criterios de aceptación y entrega

## Requisitos

- [x] Carpetas frontend/backend con manifests y ejecución separados.
- [x] Base React con HTML5 semántico, CSS Grid/Flexbox y Fetch a API.
- [x] Backend base con CORS y health.
- [ ] Login funcional y cierre de sesión; JWT validado en backend.
- [ ] SQLite persistente, inicialización reproducible y usuario de demostración.
- [ ] Diez rutas CRUD de proyectos y tareas, incluyendo consulta individual.
- [ ] Autorización por propietario; ningún acceso a recursos de otro usuario.
- [ ] Seis tipos de pantalla completos, ocho rutas frontend.
- [ ] Dashboard y todos los datos dinámicos desde API.
- [ ] Errores, carga, formularios accesibles y vista móvil.
- [ ] main, develop y feature visibles en GitHub.
- [ ] Al menos diez commits lógicos subidos.
- [ ] Guía final contrastada con instalación desde cero.
- [ ] Video con instalación, configuración, seis pantallas y CRUD.

## Pruebas a realizar durante el desarrollo

1. Inicializar base vacía y usuario, detener/reiniciar y comprobar persistencia.
2. Login correcto e incorrecto; CRUD sin token, token manipulado y expirado devuelve 401.
3. Con dos usuarios: ninguno lista, consulta, crea tareas en, edita o elimina recursos del otro.
4. Proyecto: POST → GET lista → GET id → PUT → DELETE. Verificar 201/200/204 y posterior 404.
5. Tarea: repetir ciclo completo con proyecto válido; rechazar padre inexistente/ajeno.
6. Rechazar campos vacíos, identificadores inválidos y estado no admitido.
7. Intentar borrar proyecto con tareas: 409. Eliminar tareas y luego proyecto: 204.
8. Revisar CORS desde el origen configurado y Fetch real desde frontend.
9. Navegar las seis pantallas, probar errores del servidor y listas vacías; validar móvil y teclado.
10. Ejecutar build de frontend y pruebas de integración backend; repetir instalación en carpeta limpia con `npm ci`.

## Entregables

| Archivo / enlace | Contenido y revisión |
| --- | --- |
| `backend.zip` | Código, package.json, lockfile, .env.example, esquema/scripts y README. Excluir node_modules, .env, bases locales, logs y secretos. |
| `frontend.zip` | Código, package.json, lockfile, .env.example, index.html y README. Excluir node_modules, dist y .env. |
| Enlace GitHub | Público o acceso comprobado para docente, tres ramas y diez commits como mínimo. |
| Guía de instalación | Requisitos y versiones, comandos por proyecto, variables, inicialización, credenciales de demo, URLs, pruebas y solución de problemas. |
| Video | Archivo o enlace accesible; instalación limpia y demostración explicada. |

Copiar la guía final dentro de cada ZIP o incluir README específico para que cada entregable se entienda por separado. No comprimir toda la raíz: `.tools` contiene Node portable y no forma parte del código fuente. Extraer ambos ZIP en otra carpeta y repetir la guía antes de entregar. Crear los ZIP solo al finalizar la aplicación.
