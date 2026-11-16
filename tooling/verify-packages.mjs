import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile(join(root, 'backend/.env'));
const pg = createRequire(join(root, 'backend/package.json'))('pg');
const folder = join(root, '.tools/entrega-verificada');
const admin = new pg.Client({ database: 'postgres', connectionTimeoutMillis: 5000 });
await admin.connect();
const database = 'proyecta_zip_' + Date.now();
await admin.query(`CREATE DATABASE "${database}"`);
const env = { ...process.env, PGDATABASE: database, PORT: '3001' };
const npmCli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
async function npm(project, args) {
  const child = spawn(process.execPath, [npmCli, ...args], { cwd: join(folder, project), env, windowsHide: true, stdio: 'inherit' });
  if (await new Promise(resolve => child.once('exit', resolve)) !== 0) throw new Error(`Falló ${project}: npm ${args.join(' ')}`);
}
async function startAndCheck() {
  const child = spawn(process.execPath, ['--env-file=.env', 'src/server.js'], { cwd: join(folder, 'backend'), env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const exited = new Promise(resolve => child.once('exit', resolve));
  try {
    let healthy = false;
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch('http://127.0.0.1:3001/api/health')).ok) { healthy = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!healthy) throw new Error('La API extraída del ZIP no inició.');
    const login = await fetch('http://127.0.0.1:3001/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD }) });
    if (!login.ok) throw new Error('Login de instalación limpia fallido.');
    const { token } = await login.json();
    const response = await fetch('http://127.0.0.1:3001/api/projects', { headers: { Authorization: `Bearer ${token}` } });
    const projects = await response.json();
    if (!response.ok || projects.length !== 3) throw new Error('Los datos iniciales no persistieron correctamente.');
    console.log('API del ZIP: login y tres proyectos persistentes, OK.');
  } finally { child.kill(); await exited; }
}
try {
  for (const project of ['backend', 'frontend']) await npm(project, ['ci', '--no-fund', '--cache', join(root, '.tools/npm-cache')]);
  await npm('backend', ['run', 'setup']);
  let content = await readFile(join(root, 'backend/.env'), 'utf8');
  content = content.replace(/^PGDATABASE=.*$/m, 'PGDATABASE=' + database).replace(/^PORT=.*$/m, 'PORT=3001');
  await writeFile(join(folder, 'backend/.env'), content);
  await npm('backend', ['run', 'db:check']);
  await npm('backend', ['run', 'db:migrate']);
  await npm('backend', ['run', 'db:migrate']);
  await npm('backend', ['run', 'db:seed']);
  await npm('backend', ['run', 'db:seed']);
  await npm('backend', ['test']);
  await npm('frontend', ['run', 'build']);
  await startAndCheck();
  await startAndCheck();
  console.log('ZIP OK: instalación limpia, migración/seed repetibles, pruebas, build y persistencia tras reinicio.');
} finally { await admin.query(`DROP DATABASE "${database}"`); await admin.end(); }
