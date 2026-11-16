import { pool } from "../src/db.js";

try {
  const { rows } = await pool.query(
    "SELECT current_database() AS database, current_user AS username, current_setting('server_version') AS version",
  );
  console.log("Conexión PostgreSQL correcta:", rows[0]);
} catch (error) {
  console.error(
    "No se pudo conectar a PostgreSQL. Revisa servicio, puerto y variables PG* en .env. Código:",
    error.code || "sin código",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
