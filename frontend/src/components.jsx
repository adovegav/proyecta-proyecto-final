import React, { useEffect, useRef, useState } from "react";
import { api } from "./api.js";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  folder:
    "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  check:
    "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  plus: "M12 5v14 M5 12h14",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "M19 12H5 M11 6l-6 6 6 6",
  edit: "M16 3l5 5 M14 5l5 5 M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  clock: "M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  logout: "M9 4H4v16h5 M9 12h12 M16 7l5 5-5 5",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  close: "M6 6l12 12 M6 18L18 6",
  alert: "M12 8v5 M12 16v.1 M3 20h18L12 3z",
};
export function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        p<span>·</span>
      </span>
      proyecta<span className="brand-period">.</span>
    </span>
  );
}
export function Notice({ children, error = false }) {
  return children ? (
    <div
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <Icon name={error ? "alert" : "check"} size={18} />
      <span>{children}</span>
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Cargando tu espacio…
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="folder" size={30} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Badge({ value, options, priority = false }) {
  return (
    <span className={`badge ${priority ? "priority-" : ""}${value}`}>
      <span className="badge-dot" />
      {options?.find((item) => item.value === value)?.label || value}
    </span>
  );
}
export const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${value}T12:00:00`))
    : "Sin fecha";

export function useLoad(path, revision = 0) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: "", loading: true });
    api(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, error: "", loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, error: error.message, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  return state;
}

export function ConfirmDelete({
  item,
  kind,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <div className="dialog-icon">
        <Icon name="trash" size={26} />
      </div>
      <h2 id="confirm-title">¿Eliminar {kind}?</h2>
      <p>
        Vas a eliminar <strong>{item.name || item.title}</strong>. Esta acción
        no se puede deshacer.
      </p>
      <Notice error>{error}</Notice>
      <div className="dialog-actions">
        <button
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
          autoFocus
        >
          Cancelar
        </button>
        <button className="button danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </dialog>
  );
}
