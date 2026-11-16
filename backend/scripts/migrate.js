import { readFile } from "node:fs/promises";
import { pool } from "../src/db.js";

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(918241)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const { rowCount } = await client.query(
    "SELECT version FROM schema_migrations WHERE version = 1",
  );
  if (!rowCount) {
    await client.query(
      await readFile(
        new URL("../sql/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await client.query("INSERT INTO schema_migrations(version) VALUES(1)");
    console.log("Migración 001 aplicada.");
  } else console.log("Esquema actualizado; no hay migraciones pendientes.");
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Migración fallida:", error.code || error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
