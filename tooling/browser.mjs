import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

export async function browser() {
  const executablePath = process.env.CHROME_PATH || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(path => existsSync(path));
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
}

export async function login(page) {
  await page.goto('http://localhost:5173');
  await page.getByLabel('Correo electrónico').fill(process.env.DEMO_EMAIL || 'demo@proyecta.local');
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.DEMO_PASSWORD || 'Proyecta2026!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('heading', { name: /^Hola,/ }).waitFor();
  await page.getByText('Próximas tareas', { exact: true }).waitFor();
}
