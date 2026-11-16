import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../session.jsx";
import {
  Badge,
  ConfirmDelete,
  dateLabel,
  Empty,
  Icon,
  Loading,
  Notice,
  useLoad,
} from "../components.jsx";

export function Tasks() {
  const { meta } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("proyecto") || "";
  const [revision, setRevision] = useState(0);
  const { data, error, loading } = useLoad(
    `/tasks${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`,
    revision,
  );
  const projects = useLoad("/projects");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const filtered =
    data?.filter(
      (task) =>
        `${task.title} ${task.project_name}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()) &&
        (!status || task.status === status),
    ) || [];
  async function remove() {
    setBusy(true);
    setDeleteError("");
    try {
      await api(`/tasks/${selected.id}`, { method: "DELETE" });
      setSelected(null);
      setMessage("Tarea eliminada correctamente.");
      setRevision((value) => value + 1);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">CADA PASO CUENTA</span>
          <h1>
            Mis tareas<span className="heading-dot">.</span>
          </h1>
          <p>Convierte tus objetivos en pequeños pasos concretos.</p>
        </div>
        <Link
          className="button primary"
          to={`/tareas/nueva${projectId ? `?proyecto=${projectId}` : ""}`}
        >
          <Icon name="plus" size={18} />
          Nueva tarea
        </Link>
      </div>
      <Notice>{message}</Notice>
      <div className="list-toolbar task-toolbar">
        <div className="search-input">
          <Icon name="search" size={18} />
          <input
            type="search"
            aria-label="Buscar tareas"
            placeholder="Buscar una tarea…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por proyecto"
          value={projectId}
          onChange={(event) =>
            setParams(
              event.target.value ? { proyecto: event.target.value } : {},
            )
          }
        >
          <option value="">Todos los proyectos</option>
          {projects.data?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar tareas por estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos los estados</option>
          {meta.taskStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Notice error>{error || projects.error}</Notice>
      {loading ? (
        <Loading />
      ) : (
        data &&
        (filtered.length ? (
          <section className="table-card">
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Lista de tareas y sus proyectos relacionados
                </caption>
                <thead>
                  <tr>
                    <th>Tarea / proyecto</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Fecha límite</th>
                    <th className="actions-heading">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className="task-name">
                          <span
                            className={`task-square ${task.status === "completed" ? "done" : ""}`}
                          >
                            {task.status === "completed" ? "✓" : ""}
                          </span>
                          <div>
                            <strong>{task.title}</strong>
                            <span>{task.project_name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          value={task.status}
                          options={meta.taskStatuses}
                        />
                      </td>
                      <td>
                        <Badge
                          priority
                          value={task.priority}
                          options={meta.priorities}
                        />
                      </td>
                      <td className="date-cell">{dateLabel(task.due_date)}</td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="icon-button"
                            to={`/tareas/${task.id}/editar`}
                            aria-label={`Editar ${task.title}`}
                            title="Editar tarea"
                          >
                            <Icon name="edit" size={17} />
                          </Link>
                          <button
                            className="icon-button delete"
                            aria-label={`Eliminar ${task.title}`}
                            title="Eliminar tarea"
                            onClick={() => {
                              setSelected(task);
                              setDeleteError("");
                            }}
                          >
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              {filtered.length} {filtered.length === 1 ? "tarea" : "tareas"} en
              tu lista<span>Un paso más cerca de tus objetivos.</span>
            </div>
          </section>
        ) : (
          <Empty
            title={
              data.length || projectId || search || status
                ? "No hay tareas para esta selección"
                : "Dale un siguiente paso a tu proyecto"
            }
          >
            <span>
              {projects.data?.length
                ? "Crea una tarea o ajusta los filtros para continuar."
                : "Primero crea un proyecto para poder añadir tareas."}
            </span>
            <Link
              className="button primary"
              to={projects.data?.length ? "/tareas/nueva" : "/proyectos/nuevo"}
            >
              <Icon name="plus" size={18} />
              {projects.data?.length ? "Crear una tarea" : "Crear un proyecto"}
            </Link>
          </Empty>
        ))
      )}
      {selected && (
        <ConfirmDelete
          item={selected}
          kind="tarea"
          busy={busy}
          error={deleteError}
          onCancel={() => setSelected(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

export function TaskForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const task = useLoad(id ? `/tasks/${id}` : "/meta");
  const projects = useLoad("/projects");
  return (
    <>
      <Link to="/tareas" className="back-link">
        <Icon name="back" size={17} />
        Volver a tareas
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">UN OBJETIVO, UN SIGUIENTE PASO</span>
          <h1>
            {id ? "Editar tarea" : "Nueva tarea"}
            <span className="heading-dot">.</span>
          </h1>
          <p>Define qué hay que hacer y a qué proyecto pertenece.</p>
        </div>
      </div>
      <Notice error>{task.error || projects.error}</Notice>
      {task.loading || projects.loading ? (
        <Loading />
      ) : (
        task.data &&
        projects.data &&
        (projects.data.length ? (
          <TaskEditor
            key={id || "new"}
            item={id ? task.data : null}
            projects={projects.data}
            initialProject={params.get("proyecto")}
          />
        ) : (
          <Empty title="Primero necesitas un proyecto">
            <span>Las tareas siempre pertenecen a un proyecto.</span>
            <Link to="/proyectos/nuevo" className="button primary">
              Crear proyecto
            </Link>
          </Empty>
        ))
      )}
    </>
  );
}

function TaskEditor({ item, projects, initialProject }) {
  const { meta } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: item?.title || "",
    project_id:
      item?.project_id ||
      (projects.some((project) => String(project.id) === initialProject)
        ? initialProject
        : ""),
    description: item?.description || "",
    status: item?.status || "pending",
    priority: item?.priority || "medium",
    due_date: item?.due_date || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(item ? `/tasks/${item.id}` : "/tasks", {
        method: item ? "PUT" : "POST",
        body: { ...form, project_id: Number(form.project_id) },
      });
      navigate("/tareas", {
        state: {
          message: item
            ? "Tarea actualizada correctamente."
            : "Tarea creada correctamente.",
        },
      });
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <div className="form-layout">
      <section className="form-card">
        <div className="section-heading">
          <span className="section-icon">
            <Icon name="check" />
          </span>
          <div>
            <h2>Detalles de la tarea</h2>
            <p>Los campos con * son obligatorios.</p>
          </div>
        </div>
        <form onSubmit={submit}>
          <Notice error>{error}</Notice>
          <label htmlFor="title">Título de la tarea *</label>
          <input
            id="title"
            name="title"
            placeholder="Ej. Diseñar la pantalla de inicio"
            maxLength={160}
            value={form.title}
            onChange={update}
            required
          />
          <label htmlFor="project_id">Proyecto relacionado *</label>
          <select
            id="project_id"
            name="project_id"
            value={form.project_id}
            onChange={update}
            required
          >
            <option value="" disabled>
              Selecciona un proyecto
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Añade contexto o criterios para completar la tarea."
            maxLength={2000}
            value={form.description}
            onChange={update}
          />
          <div className="form-row">
            <div>
              <label htmlFor="status">Estado *</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={update}
              >
                {meta.taskStatuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority">Prioridad *</label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={update}
              >
                {meta.priorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label htmlFor="due_date">Fecha límite</label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            min="1900-01-01"
            max="9999-12-31"
            value={form.due_date}
            onChange={update}
          />
          <div className="form-actions">
            <Link className="button secondary" to="/tareas">
              Cancelar
            </Link>
            <button className="button primary" disabled={busy}>
              {busy ? "Guardando…" : item ? "Guardar cambios" : "Crear tarea"}
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </form>
      </section>
      <aside className="form-aside">
        <span className="tip-spark">✳</span>
        <h3>
          Hazlo claro.
          <br />
          Hazlo posible.
        </h3>
        <p>
          Una tarea concreta es más fácil de empezar. Elige un título que
          describa una acción y un resultado.
        </p>
        <div className="aside-divider" />
        <span className="eyebrow muted">MANTÉN EL ENFOQUE</span>
        <p>
          Reserva la prioridad alta para lo que necesita tu atención primero.
        </p>
      </aside>
    </div>
  );
}
