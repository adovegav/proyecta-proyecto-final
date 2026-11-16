import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [status, setStatus] = useState('Conectando…');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/health`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('API no disponible'); return response.json(); })
      .then(data => setStatus(data.status === 'ok' ? 'Backend conectado' : 'Respuesta inesperada'))
      .catch(error => { if (error.name !== 'AbortError') setStatus('Backend sin conexión. Inicia el servidor en el puerto 3000.'); });
    return () => controller.abort();
  }, []);
  return <><header><h1>Gestor de proyectos y tareas</h1><nav aria-label="Principal"><a href="#ambiente">Ambiente de trabajo</a></nav></header><main id="ambiente"><h2>Base del proyecto preparada</h2><p role="status">{status}</p><p>Esta pantalla verifica la comunicación REST. Las seis pantallas del trabajo final están pendientes de implementación.</p></main><footer>Proyecto final · Ingeniería de Software</footer></>;
}

createRoot(document.getElementById('root')).render(<App />);
