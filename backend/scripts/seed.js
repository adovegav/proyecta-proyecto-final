import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const email = (process.env.DEMO_EMAIL || 'demo@proyecta.local').toLowerCase();
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 8) throw new Error('Configura DEMO_PASSWORD con al menos 8 caracteres en .env.');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const hash = await bcrypt.hash(password, 12);
  const result = await client.query(`INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3)
    ON CONFLICT(email) DO NOTHING RETURNING id`, ['Gustavo', email, hash]);
  if (!result.rowCount) {
    console.log('El usuario de demostración ya existe; se conservaron sus datos y contraseña.');
  } else {
    const userId = result.rows[0].id;
    const examples = [
      ['Plataforma de aprendizaje', 'Un espacio digital para organizar cursos, contenidos y seguimiento de estudiantes.', 'active'],
      ['Identidad de marca', 'Sistema visual y guía de comunicación para un nuevo emprendimiento.', 'planning'],
      ['Portal de atención', 'Mejoras de experiencia para consultas y solicitudes de clientes.', 'completed'],
    ];
    const ids = [];
    for (const project of examples) {
      const { rows } = await client.query('INSERT INTO projects(owner_id,name,description,status) VALUES($1,$2,$3,$4) RETURNING id', [userId, ...project]);
      ids.push(rows[0].id);
    }
    const tasks = [
      [ids[0], 'Definir los requisitos del producto', 'Documentar las necesidades y criterios de aceptación.', 'completed', 'high', -4],
      [ids[0], 'Diseñar las pantallas principales', 'Preparar el flujo de navegación y los formularios.', 'in_progress', 'high', 2],
      [ids[0], 'Implementar el acceso de usuarios', 'Integrar autenticación y permisos en la API.', 'pending', 'medium', 5],
      [ids[1], 'Explorar referencias visuales', 'Recopilar referencias y definir la dirección creativa.', 'in_progress', 'medium', 3],
      [ids[1], 'Preparar la presentación de marca', 'Organizar las propuestas para revisión.', 'pending', 'low', 7],
      [ids[2], 'Validar la experiencia de atención', 'Revisar navegación y accesibilidad.', 'completed', 'medium', -1],
    ];
    for (const task of tasks) await client.query(`INSERT INTO tasks(project_id,title,description,status,priority,due_date)
      VALUES($1,$2,$3,$4,$5,CURRENT_DATE + $6::integer)`, task);
    console.log('Usuario y datos de demostración creados.');
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('No se pudieron crear los datos:', error.code || error.message);
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
