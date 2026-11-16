import { Router } from "express";
import { pool } from "./db.js";
import { fail, id, text, choice, date } from "./errors.js";

export const tasksRouter = Router();
const fields = (body) => ({
  projectId: id(body?.project_id),
  title: text(body?.title, "Título", 160),
  description: text(body?.description ?? "", "Descripción", 2000, false),
  status: choice(
    body?.status,
    ["pending", "in_progress", "completed"],
    "Estado",
  ),
  priority: choice(body?.priority, ["low", "medium", "high"], "Prioridad"),
  dueDate: date(body?.due_date),
});
const select = `SELECT t.*, to_char(t.due_date,'YYYY-MM-DD') AS due_date, p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id`;

tasksRouter.get("/", async (req, res) => {
  const projectId =
    req.query.projectId === undefined ? null : id(req.query.projectId);
  const { rows } = await pool.query(
    `${select} WHERE p.owner_id=$1 AND ($2::integer IS NULL OR t.project_id=$2) ORDER BY t.created_at DESC,t.id DESC`,
    [req.user.id, projectId],
  );
  res.json(rows);
});

tasksRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    `${select} WHERE t.id=$1 AND p.owner_id=$2`,
    [id(req.params.id), req.user.id],
  );
  if (!rows.length) fail(404, "Tarea no encontrada.");
  res.json(rows[0]);
});

tasksRouter.post("/", async (req, res) => {
  const value = fields(req.body);
  const { rows } = await pool.query(
    `INSERT INTO tasks(project_id,title,description,status,priority,due_date)
    SELECT id,$1,$2,$3,$4,$5::date FROM projects WHERE id=$6 AND owner_id=$7
    RETURNING *,to_char(due_date,'YYYY-MM-DD') AS due_date`,
    [
      value.title,
      value.description,
      value.status,
      value.priority,
      value.dueDate,
      value.projectId,
      req.user.id,
    ],
  );
  if (!rows.length) fail(404, "Proyecto no encontrado.");
  res.location(`/api/tasks/${rows[0].id}`).status(201).json(rows[0]);
});

tasksRouter.put("/:id", async (req, res) => {
  const taskId = id(req.params.id);
  const value = fields(req.body);
  const { rows } = await pool.query(
    `UPDATE tasks t SET project_id=$1,title=$2,description=$3,status=$4,priority=$5,due_date=$6::date,updated_at=now()
    WHERE t.id=$7 AND EXISTS(SELECT 1 FROM projects p WHERE p.id=t.project_id AND p.owner_id=$8)
    AND EXISTS(SELECT 1 FROM projects p WHERE p.id=$1 AND p.owner_id=$8)
    RETURNING t.*,to_char(t.due_date,'YYYY-MM-DD') AS due_date`,
    [
      value.projectId,
      value.title,
      value.description,
      value.status,
      value.priority,
      value.dueDate,
      taskId,
      req.user.id,
    ],
  );
  if (!rows.length) fail(404, "Tarea o proyecto no encontrado.");
  res.json(rows[0]);
});

tasksRouter.delete("/:id", async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM tasks t USING projects p WHERE t.project_id=p.id AND p.owner_id=$1 AND t.id=$2`,
    [req.user.id, id(req.params.id)],
  );
  if (!rowCount) fail(404, "Tarea no encontrada.");
  res.status(204).end();
});
