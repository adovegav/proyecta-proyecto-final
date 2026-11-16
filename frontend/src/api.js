let token = null;
export function setToken(value) { token = value; }

export async function api(path, { body, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}${path}`, {
      ...options,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar al servidor. Comprueba tu conexión e intenta nuevamente.');
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('session-expired'));
    throw new Error(data?.message || 'No se pudo completar la operación.');
  }
  return data;
}
