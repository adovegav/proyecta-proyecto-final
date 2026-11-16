import { Router } from "express";
import { pool } from "./db.js";
import { fail, id, text, choice } from "./errors.js";

export const projectsRouter = Router();
const fields = (body) => ({
  name: text(body?.name, "Nombre", 120),
  description: text(body?.description ?? "", "Descripción", 2000, false),
  status: choice(body?.status, ["planning", "active", "completed"], "Estado"),
});

projectsRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, count(t.id)::int AS task_count,
    count(t.id) FILTER (WHERE t.status='completed')::int AS completed_count
    FROM projects p LEFT JOIN tasks t ON t.project_id=p.id
    WHERE p.owner_id=$1 GROUP BY p.id ORDER BY p.created_at DESC,p.id DESC`,
    [req.user.id],
  );
  res.json(rows);
});

projectsRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM projects WHERE id=$1 AND owner_id=$2",
    [id(req.params.id), req.user.id],
  );
  if (!rows.length) fail(404, "Proyecto no encontrado.");
  res.json(rows[0]);
});

projectsRouter.post("/", async (req, res) => {
  const value = fields(req.body);
  const { rows } = await pool.query(
    "INSERT INTO projects(owner_id,name,description,status) VALUES($1,$2,$3,$4) RETURNING *",
    [req.user.id, value.name, value.description, value.status],
  );
  res.location(`/api/projects/${rows[0].id}`).status(201).json(rows[0]);
});

projectsRouter.put("/:id", async (req, res) => {
  const projectId = id(req.params.id);
  const value = fields(req.body);
  const { rows } = await pool.query(
    "UPDATE projects SET name=$1,description=$2,status=$3,updated_at=now() WHERE id=$4 AND owner_id=$5 RETURNING *",
    [value.name, value.description, value.status, projectId, req.user.id],
  );
  if (!rows.length) fail(404, "Proyecto no encontrado.");
  res.json(rows[0]);
});

projectsRouter.delete("/:id", async (req, res) => {
  const { rowCount } = await pool.query(
    "DELETE FROM projects WHERE id=$1 AND owner_id=$2",
    [id(req.params.id), req.user.id],
  );
  if (!rowCount) fail(404, "Proyecto no encontrado.");
  res.status(204).end();
});
