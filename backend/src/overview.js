import { Router } from "express";
import { pool } from "./db.js";

export const overviewRouter = Router();
overviewRouter.get("/meta", (_req, res) =>
  res.json({
    projectStatuses: [
      { value: "planning", label: "En planificación" },
      { value: "active", label: "En curso" },
      { value: "completed", label: "Completado" },
    ],
    taskStatuses: [
      { value: "pending", label: "Pendiente" },
      { value: "in_progress", label: "En curso" },
      { value: "completed", label: "Completada" },
    ],
    priorities: [
      { value: "low", label: "Baja" },
      { value: "medium", label: "Media" },
      { value: "high", label: "Alta" },
    ],
  }),
);

overviewRouter.get("/dashboard", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const projects = await client.query(
      `SELECT count(*)::int AS total, count(*) FILTER(WHERE status='active')::int AS active FROM projects WHERE owner_id=$1`,
      [req.user.id],
    );
    const tasks = await client.query(
      `SELECT count(*)::int AS total,
      count(*) FILTER(WHERE t.status='completed')::int AS completed,
      count(*) FILTER(WHERE t.status='pending')::int AS pending,
      count(*) FILTER(WHERE t.status='in_progress')::int AS in_progress,
      count(*) FILTER(WHERE t.status!='completed' AND t.due_date<CURRENT_DATE)::int AS overdue
      FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.owner_id=$1`,
      [req.user.id],
    );
    const upcoming = await client.query(
      `SELECT t.id,t.title,t.status,t.priority,to_char(t.due_date,'YYYY-MM-DD') AS due_date,p.name AS project_name
      FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.owner_id=$1 AND t.status!='completed'
      ORDER BY t.due_date ASC NULLS LAST,t.created_at DESC LIMIT 5`,
      [req.user.id],
    );
    await client.query("COMMIT");
    res.json({
      projects: projects.rows[0],
      tasks: tasks.rows[0],
      upcoming: upcoming.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
