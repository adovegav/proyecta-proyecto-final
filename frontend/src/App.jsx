import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './session.jsx';
import { Brand, Icon, Notice } from './components.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Projects, ProjectForm } from './pages/Projects.jsx';
import { Tasks, TaskForm } from './pages/Tasks.jsx';

function Login() {
  const { user, login, expired } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(email, password); navigate('/', { replace: true }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><section className="login-story"><header><Brand /><span className="eyebrow">TU ESPACIO DE TRABAJO</span></header><div className="story-copy"><span className="story-kicker"><span /> MENOS RUIDO, MÁS ENFOQUE</span><h1>Las buenas ideas<br />merecen un<br /><em>buen comienzo.</em></h1><p>Organiza tus proyectos, conecta cada tarea y haz espacio para lo que realmente importa.</p><div className="story-preview"><div className="preview-top"><span className="preview-icon"><Icon name="folder" /></span><span>De la idea al siguiente paso<small>Todo tu trabajo, en un solo lugar</small></span><span className="preview-check">✓</span></div><div className="preview-line"><span /><span /><span /></div><div className="preview-bottom"><span>Claridad en cada etapa</span><span>→</span></div></div></div><footer>Organiza. Conecta. Avanza.</footer><div className="story-orbit" /></section><main className="login-main"><div className="login-form-wrap"><span className="eyebrow muted">BIENVENIDO A PROYECTA</span><h2>Tu próximo paso<br />empieza aquí.</h2><p className="lead">Inicia sesión y retoma tus proyectos.</p><Notice error>{error || (expired ? 'Tu sesión terminó. Inicia sesión nuevamente.' : '')}</Notice><form onSubmit={submit}><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="username" placeholder="nombre@correo.com" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} /><label htmlFor="password">Contraseña</label><div className="password-input"><input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={event => setPassword(event.target.value)} required maxLength={128} /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="eye" /></button></div><button className="button primary login-submit" disabled={busy}>{busy ? 'Iniciando sesión…' : 'Iniciar sesión'}<Icon name="arrow" size={18} /></button></form><p className="login-note"><Icon name="check" size={16} />Un espacio privado para tus proyectos y tareas.</p></div><footer>PROYECTO FINAL · INGENIERÍA DE SOFTWARE</footer></main></div>;
}

function Workspace() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  if (!user) return <Navigate to="/login" replace />;
  const section = location.pathname.startsWith('/proyectos') ? 'Proyectos' : location.pathname.startsWith('/tareas') ? 'Tareas' : 'Resumen';
  return <div className="workspace"><a className="skip-link" href="#contenido">Saltar al contenido</a><aside className="sidebar"><Link to="/" aria-label="Proyecta, inicio"><Brand /></Link><div className="sidebar-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal"><NavLink to="/" end><Icon name="grid" />Resumen</NavLink><NavLink to="/proyectos"><Icon name="folder" />Proyectos</NavLink><NavLink to="/tareas"><Icon name="check" />Tareas</NavLink></nav><div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-spark">✳</span><strong>Un paso a la vez.</strong><p>Cada tarea completada te acerca a tu próxima gran idea.</p></div><div className="profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><span>Mi espacio personal</span></div><button className="logout" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => { logout(); navigate('/login'); }}><Icon name="logout" size={18} /></button></div></div></aside><div className="workspace-body"><header className="topbar"><div className="breadcrumb">Mi espacio <span>/</span><strong>{section}</strong></div><span className="workspace-indicator"><span /> Espacio personal</span></header><main id="contenido" tabIndex={-1}><Outlet /></main><footer className="workspace-footer"><span>Proyecta · Hecho para avanzar.</span><span>Proyectos y tareas en un solo lugar</span></footer></div></div>;
}

export default function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route element={<Workspace />}><Route index element={<Dashboard />} /><Route path="proyectos" element={<Projects />} /><Route path="proyectos/nuevo" element={<ProjectForm />} /><Route path="proyectos/:id/editar" element={<ProjectForm />} /><Route path="tareas" element={<Tasks />} /><Route path="tareas/nueva" element={<TaskForm />} /><Route path="tareas/:id/editar" element={<TaskForm />} /><Route path="*" element={<div className="empty"><h1>Página no encontrada</h1><p>La dirección que buscas no existe.</p><Link className="button primary" to="/">Volver al resumen</Link></div>} /></Route></Routes>;
}
