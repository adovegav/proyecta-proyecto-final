import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../session.jsx";
import {
  Badge,
  ConfirmDelete,
  Empty,
  Icon,
  Loading,
  Notice,
  useLoad,
} from "../components.jsx";

export function Projects() {
  const { meta } = useAuth();
  const location = useLocation();
  const [revision, setRevision] = useState(0);
  const { data, error, loading } = useLoad("/projects", revision);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const filtered =
    data?.filter(
      (project) =>
        project.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (!status || project.status === status),
    ) || [];
  async function remove() {
    setBusy(true);
    setDeleteError("");
    try {
      await api(`/projects/${selected.id}`, { method: "DELETE" });
      setSelected(null);
      setMessage("Proyecto eliminado correctamente.");
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
          <span className="eyebrow muted">DE LAS IDEAS A LA ACCIÓN</span>
          <h1>
            Mis proyectos<span className="heading-dot">.</span>
          </h1>
          <p>Un lugar para dar forma a todo lo que quieres lograr.</p>
        </div>
        <Link className="button primary" to="/proyectos/nuevo">
          <Icon name="plus" size={18} />
          Nuevo proyecto
        </Link>
      </div>
      <Notice>{message}</Notice>
      <div className="list-toolbar">
        <div className="search-input">
          <Icon name="search" size={18} />
          <input
            type="search"
            aria-label="Buscar proyectos"
            placeholder="Buscar un proyecto…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar proyectos por estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos los estados</option>
          {meta.projectStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="result-count">{filtered.length} proyectos</span>
      </div>
      <Notice error>{error}</Notice>
      {loading ? (
        <Loading />
      ) : (
        data &&
        (filtered.length ? (
          <div className="project-grid">
            {filtered.map((project, index) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-top">
                  <span className={`project-icon tone-${index % 3}`}>
                    <Icon name="folder" size={24} />
                  </span>
                  <Badge
                    value={project.status}
                    options={meta.projectStatuses}
                  />
                </div>
                <h2>{project.name}</h2>
                <p className="project-description">
                  {project.description ||
                    "Este proyecto aún no tiene descripción."}
                </p>
                <div className="progress-label">
                  <span>Progreso de tareas</span>
                  <strong>
                    {project.task_count
                      ? Math.round(
                          (project.completed_count / project.task_count) * 100,
                        )
                      : 0}
                    %
                  </strong>
                </div>
                <progress
                  aria-label={`Progreso de ${project.name}`}
                  max={project.task_count || 1}
                  value={project.completed_count}
                />
                <div className="project-card-footer">
                  <Link
                    className="task-count-link"
                    to={`/tareas?proyecto=${project.id}`}
                  >
                    <Icon name="check" size={16} />
                    {project.completed_count}/{project.task_count} tareas
                  </Link>
                  <div className="row-actions">
                    <Link
                      className="icon-button"
                      to={`/proyectos/${project.id}/editar`}
                      aria-label={`Editar ${project.name}`}
                      title="Editar proyecto"
                    >
                      <Icon name="edit" size={17} />
                    </Link>
                    <button
                      className="icon-button delete"
                      onClick={() => {
                        setSelected(project);
                        setDeleteError("");
                      }}
                      aria-label={`Eliminar ${project.name}`}
                      title="Eliminar proyecto"
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title={
              data.length
                ? "No encontramos proyectos"
                : "Tu próxima idea empieza aquí"
            }
          >
            {data.length ? (
              "Prueba con otra búsqueda o cambia el filtro."
            ) : (
              <>
                <span>
                  Crea tu primer proyecto y comienza a organizar sus tareas.
                </span>
                <Link className="button primary" to="/proyectos/nuevo">
                  <Icon name="plus" size={18} />
                  Crear un proyecto
                </Link>
              </>
            )}
          </Empty>
        ))
      )}
      {selected && (
        <ConfirmDelete
          item={selected}
          kind="proyecto"
          busy={busy}
          error={deleteError}
          onCancel={() => setSelected(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

export function ProjectForm() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(id ? `/projects/${id}` : "/meta");
  return (
    <>
      <Link to="/proyectos" className="back-link">
        <Icon name="back" size={17} />
        Volver a proyectos
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">DA FORMA A TU PRÓXIMA IDEA</span>
          <h1>
            {id ? "Editar proyecto" : "Nuevo proyecto"}
            <span className="heading-dot">.</span>
          </h1>
          <p>
            {id
              ? "Actualiza los detalles y sigue avanzando."
              : "Define el punto de partida. Las tareas vienen después."}
          </p>
        </div>
      </div>
      <Notice error>{error}</Notice>
      {loading ? (
        <Loading />
      ) : (
        data && <ProjectEditor key={id || "new"} item={id ? data : null} />
      )}
    </>
  );
}

function ProjectEditor({ item }) {
  const { meta } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    status: item?.status || "active",
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
      await api(item ? `/projects/${item.id}` : "/projects", {
        method: item ? "PUT" : "POST",
        body: form,
      });
      navigate("/proyectos", {
        state: {
          message: item
            ? "Proyecto actualizado correctamente."
            : "Proyecto creado correctamente.",
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
            <Icon name="folder" />
          </span>
          <div>
            <h2>Información del proyecto</h2>
            <p>Los campos con * son obligatorios.</p>
          </div>
        </div>
        <form onSubmit={submit}>
          <Notice error>{error}</Notice>
          <label htmlFor="name">Nombre del proyecto *</label>
          <input
            id="name"
            name="name"
            placeholder="Ej. Rediseño de la plataforma"
            maxLength={120}
            value={form.name}
            onChange={update}
            required
          />
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="¿Qué quieres conseguir con este proyecto?"
            maxLength={2000}
            value={form.description}
            onChange={update}
          />
          <span className="field-help">
            Un objetivo claro ayuda a dar el siguiente paso.
          </span>
          <label htmlFor="status">Estado *</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={update}
          >
            {meta.projectStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="form-actions">
            <Link className="button secondary" to="/proyectos">
              Cancelar
            </Link>
            <button className="button primary" disabled={busy}>
              {busy
                ? "Guardando…"
                : item
                  ? "Guardar cambios"
                  : "Crear proyecto"}
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </form>
      </section>
      <aside className="form-aside">
        <span className="tip-spark">✳</span>
        <h3>
          Las grandes ideas
          <br />
          empiezan en pequeño.
        </h3>
        <p>
          Después de crear el proyecto, podrás añadir tareas, definir
          prioridades y seguir cada avance.
        </p>
        <div className="aside-divider" />
        <span className="eyebrow muted">UN CONSEJO</span>
        <p>
          Usa un nombre breve y una descripción que explique el resultado que
          esperas.
        </p>
      </aside>
    </div>
  );
}
