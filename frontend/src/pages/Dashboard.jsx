import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../session.jsx";
import {
  Badge,
  dateLabel,
  Empty,
  Icon,
  Loading,
  Notice,
  useLoad,
} from "../components.jsx";

export function Dashboard() {
  const { user, meta } = useAuth();
  const { data, error, loading } = useLoad("/dashboard");
  const projects = useLoad("/projects");
  const percent = data?.tasks.total
    ? Math.round((data.tasks.completed / data.tasks.total) * 100)
    : 0;
  const stats = data
    ? [
        {
          label: "Proyectos",
          value: data.projects.total,
          icon: "folder",
          note: `${data.projects.active} en curso`,
          tone: "teal",
        },
        {
          label: "Tareas pendientes",
          value: data.tasks.pending,
          icon: "clock",
          note: "Tu siguiente paso",
          tone: "amber",
        },
        {
          label: "En curso",
          value: data.tasks.in_progress,
          icon: "grid",
          note: "Ideas en movimiento",
          tone: "blue",
        },
        {
          label: "Completadas",
          value: data.tasks.completed,
          icon: "check",
          note: `${percent}% del total de tareas`,
          tone: "violet",
        },
      ]
    : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">TU TRABAJO, CON PERSPECTIVA</span>
          <h1>
            Hola, {user.name.split(" ")[0]}
            <span className="heading-dot">.</span>
          </h1>
          <p>Un vistazo a tus proyectos. Un buen lugar para continuar.</p>
        </div>
        <Link to="/proyectos/nuevo" className="button primary">
          <Icon name="plus" size={18} />
          Nuevo proyecto
        </Link>
      </div>
      <Notice error>{error || projects.error}</Notice>
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <section className="stats-grid" aria-label="Resumen de actividad">
              {stats.map((stat) => (
                <article className="stat-card" key={stat.label}>
                  <div className="stat-top">
                    <span>{stat.label}</span>
                    <span className={`stat-icon ${stat.tone}`}>
                      <Icon name={stat.icon} size={20} />
                    </span>
                  </div>
                  <strong className="stat-value">
                    {String(stat.value).padStart(2, "0")}
                  </strong>
                  <span className="stat-note">{stat.note}</span>
                </article>
              ))}
            </section>
            <section className="focus-banner">
              <div>
                <span className="eyebrow">UN POCO DE CLARIDAD, CADA DÍA</span>
                <h2>
                  Todo gran proyecto avanza
                  <br />
                  una tarea a la vez.
                </h2>
                <p>
                  {data.tasks.overdue
                    ? `Tienes ${data.tasks.overdue} tareas con fecha vencida. Es un buen momento para revisarlas.`
                    : "Elige tu siguiente paso y sigue construyendo."}
                </p>
                <Link to="/tareas" className="banner-link">
                  Explorar mis tareas
                  <Icon name="arrow" size={17} />
                </Link>
              </div>
              <div className="focus-graphic" aria-hidden="true">
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
                <span className="orbit-dot" />
                <span className="big-check">✓</span>
                <span className="graphic-label">PASO A PASO</span>
              </div>
            </section>
            <div className="dashboard-columns">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow muted">LO QUE VIENE</span>
                    <h2>Próximas tareas</h2>
                  </div>
                  <Link className="text-link" to="/tareas">
                    Ver todas
                    <Icon name="arrow" size={15} />
                  </Link>
                </div>
                {data.upcoming.length ? (
                  <div className="upcoming-list">
                    {data.upcoming.map((task) => (
                      <Link
                        to={`/tareas/${task.id}/editar`}
                        className="upcoming-task"
                        key={task.id}
                      >
                        <span className="task-square" />
                        <div>
                          <strong>{task.title}</strong>
                          <span>{task.project_name}</span>
                        </div>
                        <div className="upcoming-meta">
                          <Badge
                            value={task.priority}
                            options={meta.priorities}
                            priority
                          />
                          <span>{dateLabel(task.due_date)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty title="Todo al día">
                    No tienes tareas pendientes. Puedes crear tu próximo paso.
                  </Empty>
                )}
              </section>
              <section className="panel progress-panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow muted">CADA AVANCE SUMA</span>
                    <h2>Tu progreso</h2>
                  </div>
                  <Icon name="check" />
                </div>
                <div
                  className="progress-ring"
                  style={{ "--progress": `${percent}%` }}
                  role="img"
                  aria-label={`${percent}% de tareas completadas`}
                >
                  <div>
                    <strong>
                      {percent}
                      <small>%</small>
                    </strong>
                    <span>completado</span>
                  </div>
                </div>
                <div className="progress-summary">
                  <span>
                    <i className="legend-dot teal-dot" />
                    Completadas<strong>{data.tasks.completed}</strong>
                  </span>
                  <span>
                    <i className="legend-dot gray-dot" />
                    Por completar
                    <strong>{data.tasks.total - data.tasks.completed}</strong>
                  </span>
                </div>
              </section>
            </div>
          </>
        )
      )}
      {projects.data && (
        <section className="recent-projects">
          <div className="section-title-row">
            <div>
              <span className="eyebrow muted">TUS IDEAS EN MARCHA</span>
              <h2>Proyectos recientes</h2>
            </div>
            <Link className="text-link" to="/proyectos">
              Ver proyectos
              <Icon name="arrow" size={15} />
            </Link>
          </div>
          {projects.data.length ? (
            <div className="mini-project-grid">
              {projects.data.slice(0, 3).map((project, index) => (
                <Link
                  className="mini-project"
                  to={`/tareas?proyecto=${project.id}`}
                  key={project.id}
                >
                  <span className={`project-icon tone-${index}`}>
                    <Icon name="folder" />
                  </span>
                  <div>
                    <h3>{project.name}</h3>
                    <span>
                      {project.task_count} tareas ·{" "}
                      {
                        meta.projectStatuses.find(
                          (option) => option.value === project.status,
                        )?.label
                      }
                    </span>
                  </div>
                  <Icon name="arrow" size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty title="Empieza con una idea">
              Crea tu primer proyecto para verlo aquí.
            </Empty>
          )}
        </section>
      )}
    </>
  );
}
