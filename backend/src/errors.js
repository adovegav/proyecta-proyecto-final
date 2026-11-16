export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) fail(400, 'Identificador inválido.');
  return Number(value);
}

export function text(value, label, max, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, `${label}: ${required ? 'campo obligatorio, ' : ''}máximo ${max} caracteres.`);
  return value.trim();
}

export function choice(value, options, label) {
  if (!options.includes(value)) fail(400, `${label} no válido.`);
  return value;
}

export function date(value) {
  if (value === null || value === '' || value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '9999-12-31') fail(400, 'Fecha no válida.');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(400, 'Fecha no válida.');
  return value;
}
