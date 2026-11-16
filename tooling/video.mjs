// Graba una instalación real en una copia limpia y una demostración de la UI.
// Requiere los dos servidores locales activos y las credenciales en backend/.env.
import { browser, login } from './browser.mjs';
import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import ffmpeg from 'ffmpeg-static';

const root = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile(join(root, 'backend/.env'));
const requireBackend = createRequire(join(root, 'backend/package.json'));
const pg = requireBackend('pg');
const output = join(root, 'artifacts/entrega');
const scratch = join(root, '.tools/video-instalacion-' + Date.now());
await mkdir(output, { recursive: true });
await mkdir(scratch, { recursive: true });
const admin = new pg.Client({ database: 'postgres', connectionTimeoutMillis: 5000 });
await admin.connect();
const database = 'proyecta_video_' + Date.now();
await admin.query(`CREATE DATABASE "${database}"`);
const instance = await browser();
const context = await instance.newContext({ viewport: { width: 1280, height: 900 }, recordVideo: { dir: join(root, 'artifacts/video-original'), size: { width: 1280, height: 900 } }, locale: 'es-BO' });
const page = await context.newPage();
const recording = page.video();
const chapters = [];
const started = Date.now();
const pause = seconds => page.waitForTimeout(seconds * 1000);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

async function caption(title, text, seconds = 5) {
  chapters.push({ seconds: Math.round((Date.now() - started) / 1000), title, text });
  console.log('VIDEO:', title);
  await page.evaluate(({ title, text }) => {
    document.getElementById('video-caption')?.remove();
    const element = document.createElement('div');
    element.id = 'video-caption';
    element.style.cssText = 'position:fixed;z-index:99999;top:8px;left:250px;right:16px;padding:11px 18px;border-radius:9px;background:#173f37f5;color:white;box-shadow:0 4px 20px #0002;pointer-events:none;font:13px/1.5 Segoe UI,Arial;';
    const heading = document.createElement('strong'); heading.textContent = title; heading.style.cssText = 'display:block;font-size:13px;color:#d1e4b8;margin-bottom:2px';
    const paragraph = document.createElement('span'); paragraph.textContent = text;
    element.append(heading, paragraph); document.documentElement.append(element);
  }, { title, text });
  await pause(seconds);
}

async function slide(title, subtitle, content) {
  await page.setContent(`<html lang="es"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f4f7f1;color:#294239;font-family:Segoe UI,Arial;padding:95px 75px}small{letter-spacing:3px;font-size:12px;color:#7b9271}h1{font-size:43px;letter-spacing:-1.2px;font-weight:500;margin:20px 0 12px}p{font-size:19px;line-height:1.6;color:#7a8e70;margin-bottom:35px}pre{background:#183d36;color:#d1e5c2;border-radius:14px;padding:27px;font:16px/1.7 Consolas,monospace;white-space:pre-wrap;max-height:540px;overflow:hidden}footer{position:fixed;bottom:25px;left:75px;color:#8a9c80;font-size:12px}</style><small>PROYECTA · PROYECTO FINAL</small><h1>${escape(title)}</h1><p>${escape(subtitle)}</p><pre id="console">${escape(content)}</pre><footer>React + Express + PostgreSQL 18 · Dos proyectos independientes · Comunicación REST</footer></html>`);
}

async function command(label, args, cwd, env = process.env) {
  await page.locator('#console').evaluate((el, value) => { el.textContent = '$ ' + value + '\n'; }, label);
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true });
  let output = '';
  const append = chunk => { output += chunk.toString().replace(/\x1b\[[0-9;]*m/g, ''); };
  child.stdout.on('data', append); child.stderr.on('data', append);
  const timer = setInterval(() => { page.locator('#console').evaluate((el, value) => { el.textContent = value; el.scrollTop = el.scrollHeight; }, '$ ' + label + '\n' + output).catch(() => {}); }, 300);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  clearInterval(timer);
  await page.locator('#console').evaluate((el, value) => { el.textContent = value; el.scrollTop = el.scrollHeight; }, '$ ' + label + '\n' + output + `\nCódigo de salida: ${code}`);
  if (code !== 0) throw new Error('Falló la instalación grabada: ' + label);
  await pause(4);
  return output;
}

let failure;
try {
  await slide('Proyecta: proyectos que avanzan.', 'Demostración de instalación, configuración y funcionamiento.', 'Frontend: React + JavaScript + HTML5 + CSS3\nBackend: Express + JWT + API REST\nBase relacional: PostgreSQL 18\n\n6 pantallas · 10 rutas CRUD protegidas · Relación proyecto → tareas\nRepositorio: github.com/adovegav/proyecta-proyecto-final');
  await pause(8);
  for (const project of ['backend', 'frontend']) await cp(join(root, project), join(scratch, project), { recursive: true, filter: source => !/(?:^|[\\/])(?:node_modules|dist|\.env)(?:[\\/]|$)/.test(source) });
  const cli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  await slide('01 / Instalación desde una copia limpia', 'Los siguientes comandos se ejecutan realmente sobre el código, sin node_modules.', 'Requisitos: Node.js 24 LTS + npm + Git + PostgreSQL 18\n\nLos dos proyectos mantienen sus propias dependencias y lockfiles.\nPrimero instalamos el backend, luego el frontend.');
  await pause(7);
  await command('cd backend && npm ci', [cli, 'ci', '--no-fund', '--cache', join(root, '.tools/npm-cache')], join(scratch, 'backend'));
  await command('cd frontend && npm ci', [cli, 'ci', '--no-fund', '--cache', join(root, '.tools/npm-cache')], join(scratch, 'frontend'));
  await slide('02 / Configuración del backend', 'Se genera JWT_SECRET y se configuran las variables locales sin mostrar contraseñas.', 'npm run setup\n\nPGHOST=localhost\nPGPORT=5433\nPGDATABASE=<base exclusiva de la demostración>\nPGUSER=<usuario local>\nPGPASSWORD=<valor privado en .env>\nFRONTEND_ORIGIN=http://localhost:5173\n\nFrontend: VITE_API_URL=http://localhost:3000/api\nLos archivos .env están excluidos de Git y de los ZIP.');
  await pause(10);
  await command('npm run setup', [cli, 'run', 'setup'], join(scratch, 'backend'));
  const env = { ...process.env, PGDATABASE: database };
  // El entorno de este proceso dirige migración/seed a una base nueva y aislada.
  await command('npm run db:check', [cli, 'run', 'db:check'], join(scratch, 'backend'), env);
  await command('npm run db:migrate', [cli, 'run', 'db:migrate'], join(scratch, 'backend'), env);
  await command('npm run db:seed', [cli, 'run', 'db:seed'], join(scratch, 'backend'), env);
  await command('cd frontend && npm run build', [cli, 'run', 'build'], join(scratch, 'frontend'));
  await slide('03 / Iniciar los dos proyectos', 'Cada aplicación se ejecuta en su propio proceso.', 'Terminal 1 — backend\n  npm start\n  http://localhost:3000/api\n\nTerminal 2 — frontend\n  npm run dev -- --strictPort\n  http://localhost:5173\n\nCORS permite el origen configurado. JWT protege los recursos.\nA continuación usamos los servidores locales ya iniciados.');
  await pause(9);
  await page.goto('http://localhost:5173');
  await page.getByRole('heading', { name: /Tu próximo paso/ }).waitFor();
  await page.waitForLoadState('networkidle');
  await caption('PANTALLA 1 / Login', 'Formulario de autenticación. El backend valida el hash de contraseña y entrega un JWT temporal.', 7);
  await page.getByLabel('Correo electrónico').fill(process.env.DEMO_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await caption('Validación de credenciales', 'Las credenciales incorrectas devuelven 401 y un mensaje visible. No se permite entrar al dashboard.', 5);
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('heading', { name: /^Hola,/ }).waitFor();
  await page.getByText('Próximas tareas', { exact: true }).waitFor();
  await caption('PANTALLA 2 / Dashboard', 'Los contadores, el progreso y las próximas tareas se consultan por Fetch a la API; no son datos fijos.', 8);
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('heading', { name: 'Mis proyectos.' }).waitFor();
  await caption('PANTALLA 3 / Lista de proyectos', 'Consulta los proyectos propios, su progreso y las acciones para crear, editar y eliminar.', 7);
  await page.getByRole('link', { name: 'Nuevo proyecto', exact: true }).click();
  await page.getByLabel('Nombre del proyecto').fill('Proyecto de la demostración');
  await page.getByLabel('Descripción', { exact: true }).fill('Proyecto creado durante el video para demostrar el CRUD completo.');
  await page.getByLabel('Estado').selectOption('active');
  await caption('PANTALLA 4 / Crear y editar proyecto', 'Nombre obligatorio, descripción y estado. Guardar ejecuta POST /api/projects y persiste en PostgreSQL.', 7);
  await page.getByRole('button', { name: 'Crear proyecto', exact: true }).click();
  await page.getByRole('heading', { name: 'Proyecto de la demostración', exact: true }).waitFor();
  await pause(3);
  await page.getByRole('link', { name: 'Editar Proyecto de la demostración', exact: true }).click();
  await page.getByLabel('Estado').selectOption('planning');
  await caption('Actualizar el recurso padre', 'La misma pantalla carga GET /projects/:id y guarda los cambios mediante PUT /projects/:id.', 6);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('status').filter({ hasText: 'Proyecto actualizado correctamente.' }).waitFor();
  await page.getByRole('link', { name: 'Tareas', exact: true }).click();
  await page.getByRole('heading', { name: 'Mis tareas.' }).waitFor();
  await caption('PANTALLA 5 / Lista de tareas', 'Cada tarea muestra su proyecto relacionado, estado, prioridad y fecha. Los filtros permiten enfocar la lista.', 7);
  await page.getByRole('link', { name: 'Nueva tarea', exact: true }).click();
  await page.getByLabel('Título de la tarea').fill('Validar la entrega final');
  await page.getByLabel('Proyecto relacionado').selectOption({ label: 'Proyecto de la demostración' });
  await page.getByLabel('Descripción', { exact: true }).fill('Verificar código, guía, archivos ZIP y video.');
  await page.getByLabel('Prioridad').selectOption('high');
  await page.getByLabel('Fecha límite').fill('2026-12-15');
  await caption('PANTALLA 6 / Crear y editar tarea', 'El selector de proyectos viene del backend. La clave foránea conecta esta tarea con el proyecto padre.', 8);
  await page.getByRole('button', { name: 'Crear tarea', exact: true }).click();
  await page.getByText('Validar la entrega final', { exact: true }).waitFor();
  await pause(4);
  await page.getByRole('link', { name: 'Editar Validar la entrega final', exact: true }).click();
  await page.getByLabel('Estado').selectOption('completed');
  await caption('Actualizar el recurso hijo', 'Marcamos la tarea como completada. PUT /tasks/:id actualiza su estado y el dashboard reflejará el cambio.', 6);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('status').filter({ hasText: 'Tarea actualizada correctamente.' }).waitFor();
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Proyecto de la demostración', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'El proyecto tiene tareas relacionadas.' }).waitFor();
  await caption('Integridad relacional / 409 Conflict', 'No se puede eliminar un proyecto con tareas. La API conserva la relación y explica cómo continuar.', 7);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('link', { name: 'Tareas', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Validar la entrega final', exact: true }).click();
  await caption('Eliminar una tarea', 'La confirmación evita borrados accidentales. DELETE /tasks/:id responde 204 al completarse.', 5);
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Tarea eliminada correctamente.' }).waitFor();
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Proyecto de la demostración', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Proyecto eliminado correctamente.' }).waitFor();
  await caption('CRUD completo / padre e hijo', 'Después de borrar la tarea, el proyecto puede eliminarse. Ambos recursos completaron GET, POST, PUT y DELETE.', 7);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await caption('Autorización y cierre de sesión', 'Cerrar sesión elimina el token en memoria. Las diez rutas CRUD rechazan peticiones sin un JWT válido.', 6);
  await slide('Verificación y entregables', 'Código fuente listo para instalar y ejecutar.', 'Verificado:\n  • 10 pruebas de integración: login, permisos, CRUD e integridad\n  • 6 pantallas probadas y diseño responsivo\n  • Build de producción React\n  • Instalación real en copia limpia y migración PostgreSQL 18\n\nEntregables:\n  backend.zip + frontend.zip (sin node_modules ni .env)\n  Guía de instalación + documentación REST + este video\n  github.com/adovegav/proyecta-proyecto-final');
  await pause(10);
} catch (error) { failure = error; }
finally {
  await context.close(); await instance.close();
  await admin.query(`DROP DATABASE "${database}"`); await admin.end();
}
if (failure) throw failure;
const raw = await recording.path();
await writeFile(join(output, 'VIDEO_CAPITULOS.json'), JSON.stringify(chapters, null, 2));
const target = join(output, 'demostracion-proyecta.mp4');
const child = spawn(ffmpeg, ['-y', '-i', raw, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let log = ''; child.stderr.on('data', chunk => { log = (log + chunk).slice(-3000); });
if (await new Promise(resolve => child.once('exit', resolve)) !== 0) throw new Error(log);
console.log('Video generado:', target);
