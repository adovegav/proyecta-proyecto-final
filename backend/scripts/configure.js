import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const path = new URL("../.env", import.meta.url);
let content = readFileSync(
  existsSync(path) ? path : new URL("../.env.example", import.meta.url),
  "utf8",
);
if (/^JWT_SECRET=\s*$/m.test(content))
  content = content.replace(
    /^JWT_SECRET=.*$/m,
    `JWT_SECRET=${randomBytes(48).toString("hex")}`,
  );
writeFileSync(path, content);
console.log(
  "Archivo .env preparado. Configura las variables PG* antes de migrar. Los valores existentes se conservaron.",
);
