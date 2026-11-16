import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";
import { fail } from "./errors.js";

export const authRouter = Router();
const dummyHash = await bcrypt.hash("not-a-real-account-password", 12);
const attempts = new Map();
const cleanup = setInterval(() => {
  for (const [key, value] of attempts)
    if (value.until < Date.now()) attempts.delete(key);
}, 60000);
cleanup.unref();

authRouter.post("/login", async (req, res) => {
  const key = req.ip;
  let entry = attempts.get(key);
  if (!entry || entry.until < Date.now())
    entry = { count: 0, until: Date.now() + 15 * 60000 };
  if (entry.count >= 30)
    fail(429, "Demasiados intentos. Intenta nuevamente en 15 minutos.");
  entry.count++;
  attempts.set(key, entry);
  const { email, password } = req.body || {};
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length > 128
  )
    fail(400, "Ingresa un correo y una contraseña válidos.");
  const { rows } = await pool.query(
    "SELECT id,name,email,password_hash FROM users WHERE email=$1",
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  const valid = await bcrypt.compare(
    password,
    user?.password_hash || dummyHash,
  );
  if (!user || !valid) fail(401, "Correo o contraseña incorrectos.");
  attempts.delete(key);
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: "2h",
    algorithm: "HS256",
    issuer: "proyecta-api",
    audience: "proyecta-web",
  });
  res
    .set("Cache-Control", "no-store")
    .json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

export async function authorize(req, _res, next) {
  const token = req.get("Authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) fail(401, "Inicia sesión para continuar.");
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "proyecta-api",
      audience: "proyecta-web",
    });
  } catch {
    fail(401, "Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
  }
  if (!/^[1-9]\d*$/.test(payload.sub) || Number(payload.sub) > 2147483647)
    fail(401, "Sesión no válida.");
  const { rows } = await pool.query(
    "SELECT id,name,email FROM users WHERE id=$1",
    [payload.sub],
  );
  if (!rows.length) fail(401, "Sesión no válida.");
  req.user = rows[0];
  next();
}
