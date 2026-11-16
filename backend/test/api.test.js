import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../src/db.js";
import { createApp } from "../src/app.js";

let server, base, first, second, project, task;
const tag = randomUUID();
const email = `test-${tag}@example.test`;
const otherEmail = `other-${tag}@example.test`;
const password = "PruebaSegura2026!";
const userIds = [];
async function request(
  path,
  { token, body, method = "GET", headers = {} } = {},
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    headers: response.headers,
    data: response.status === 204 ? null : await response.json(),
  };
}
const projectBody = {
  name: "Proyecto de prueba",
  description: "Prueba de integración real.",
  status: "active",
};
const taskBody = () => ({
  project_id: project.id,
  title: "Tarea de prueba",
  description: "",
  status: "pending",
  priority: "high",
  due_date: "2026-12-15",
});

before(async () => {
  const hash = await bcrypt.hash(password, 4);
  for (const address of [email, otherEmail]) {
    const { rows } = await pool.query(
      "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id",
      ["Test", address, hash],
    );
    userIds.push(rows[0].id);
  }
  server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.query(
    "DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE owner_id=ANY($1::int[]))",
    [userIds],
  );
  await pool.query("DELETE FROM projects WHERE owner_id=ANY($1::int[])", [
    userIds,
  ]);
  await pool.query("DELETE FROM users WHERE id=ANY($1::int[])", [userIds]);
  await pool.end();
});

test("health y CORS permiten el origen configurado", async () => {
  const result = await request("/health", {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(result.status, 200);
  assert.equal(
    result.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
});
test("login rechaza credenciales incorrectas y emite token válido", async () => {
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email, password: "incorrecta" },
      })
    ).status,
    401,
  );
  const result = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(result.status, 200);
  first = result.data.token;
  assert.equal(result.data.user.email, email);
  assert.equal(result.data.user.password_hash, undefined);
  second = (
    await request("/auth/login", {
      method: "POST",
      body: { email: otherEmail, password },
    })
  ).data.token;
  assert.equal(
    (await request("/auth/me", { token: first })).data.id,
    userIds[0],
  );
});
test("las diez rutas CRUD exigen token y rechazan token inválido o vencido", async () => {
  for (const resource of ["projects", "tasks"])
    for (const [method, suffix] of [
      ["GET", ""],
      ["GET", "/1"],
      ["POST", ""],
      ["PUT", "/1"],
      ["DELETE", "/1"],
    ]) {
      assert.equal(
        (await request(`/${resource}${suffix}`, { method })).status,
        401,
      );
    }
  assert.equal((await request("/projects", { token: "invalid" })).status, 401);
  const expired = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userIds[0]),
    expiresIn: -1,
    issuer: "proyecta-api",
    audience: "proyecta-web",
  });
  assert.equal((await request("/tasks", { token: expired })).status, 401);
});
test("proyectos: POST, GET lista, GET individual y PUT", async () => {
  const created = await request("/projects", {
    token: first,
    method: "POST",
    body: projectBody,
  });
  assert.equal(created.status, 201);
  project = created.data;
  assert.equal(created.headers.get("location"), `/api/projects/${project.id}`);
  assert.equal((await request("/projects", { token: first })).data.length, 1);
  assert.equal(
    (await request(`/projects/${project.id}`, { token: first })).data.name,
    projectBody.name,
  );
  const updated = await request(`/projects/${project.id}`, {
    token: first,
    method: "PUT",
    body: { ...projectBody, name: "Proyecto actualizado" },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.name, "Proyecto actualizado");
});
test("validaciones de proyectos y entradas malformadas devuelven 400", async () => {
  for (const body of [
    { ...projectBody, name: "  " },
    { ...projectBody, name: "x".repeat(121) },
    { ...projectBody, status: "invalid" },
    null,
  ]) {
    assert.equal(
      (await request("/projects", { token: first, method: "POST", body }))
        .status,
      400,
    );
  }
  assert.equal(
    (await request("/projects/no-id", { token: first })).status,
    400,
  );
  assert.equal(
    (await request("/projects/2147483648", { token: first })).status,
    400,
  );
  const response = await fetch(`${base}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${first}`,
      "Content-Type": "application/json",
    },
    body: "{",
  });
  assert.equal(response.status, 400);
});
test("tareas: POST, GET lista, GET individual, filtro y PUT", async () => {
  const created = await request("/tasks", {
    token: first,
    method: "POST",
    body: taskBody(),
  });
  assert.equal(created.status, 201);
  task = created.data;
  assert.equal(task.due_date, "2026-12-15");
  assert.equal(
    (await request(`/tasks?projectId=${project.id}`, { token: first })).data
      .length,
    1,
  );
  const single = await request(`/tasks/${task.id}`, { token: first });
  assert.equal(single.status, 200);
  assert.equal(single.data.project_name, "Proyecto actualizado");
  const updated = await request(`/tasks/${task.id}`, {
    token: first,
    method: "PUT",
    body: {
      ...taskBody(),
      status: "completed",
      title: "Tarea terminada",
      due_date: "",
    },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.status, "completed");
  assert.equal(updated.data.due_date, null);
});
test("autorización: un usuario no accede ni modifica datos del otro", async () => {
  assert.deepEqual((await request("/projects", { token: second })).data, []);
  assert.deepEqual((await request("/tasks", { token: second })).data, []);
  for (const [resource, value, body] of [
    ["projects", project, projectBody],
    ["tasks", task, taskBody()],
  ]) {
    for (const method of ["GET", "PUT", "DELETE"])
      assert.equal(
        (
          await request(`/${resource}/${value.id}`, {
            token: second,
            method,
            ...(method === "PUT" ? { body } : {}),
          })
        ).status,
        404,
      );
  }
  assert.equal(
    (
      await request("/tasks", {
        token: second,
        method: "POST",
        body: taskBody(),
      })
    ).status,
    404,
  );
  const foreign = await request("/projects", {
    token: second,
    method: "POST",
    body: projectBody,
  });
  assert.equal(
    (
      await request(`/tasks/${task.id}`, {
        token: first,
        method: "PUT",
        body: { ...taskBody(), project_id: foreign.data.id },
      })
    ).status,
    404,
  );
  assert.equal(
    (await request("/dashboard", { token: second })).data.tasks.total,
    0,
  );
});
test("validaciones de tareas, fechas y referencia al padre", async () => {
  for (const body of [
    { ...taskBody(), title: "" },
    { ...taskBody(), priority: "wrong" },
    { ...taskBody(), status: "wrong" },
    { ...taskBody(), due_date: "2026-02-30" },
    { ...taskBody(), project_id: "wrong" },
  ]) {
    assert.equal(
      (await request("/tasks", { token: first, method: "POST", body })).status,
      400,
    );
  }
  assert.equal(
    (
      await request("/tasks", {
        token: first,
        method: "POST",
        body: { ...taskBody(), project_id: 2147483647 },
      })
    ).status,
    404,
  );
  assert.equal(
    (await request("/tasks?projectId=abc", { token: first })).status,
    400,
  );
});
test("dashboard y metadatos se obtienen desde backend", async () => {
  const result = await request("/dashboard", { token: first });
  assert.equal(result.status, 200);
  assert.equal(result.data.projects.total, 1);
  assert.equal(result.data.tasks.completed, 1);
  assert.equal(
    (await request("/meta", { token: first })).data.taskStatuses.length,
    3,
  );
});
test("integridad referencial: 409 y DELETE de ambos recursos con posterior 404", async () => {
  assert.equal(
    (
      await request(`/projects/${project.id}`, {
        token: first,
        method: "DELETE",
      })
    ).status,
    409,
  );
  assert.equal(
    (await request(`/tasks/${task.id}`, { token: first, method: "DELETE" }))
      .status,
    204,
  );
  assert.equal(
    (await request(`/tasks/${task.id}`, { token: first })).status,
    404,
  );
  assert.equal(
    (
      await request(`/projects/${project.id}`, {
        token: first,
        method: "DELETE",
      })
    ).status,
    204,
  );
  assert.equal(
    (await request(`/projects/${project.id}`, { token: first })).status,
    404,
  );
});
