// ===========================================================================
// Script de inicialización de la base de datos (Neon Postgres).
//
// Uso:
//   npm run db:seed
//
// Qué hace:
//   1. Verifica que DATABASE_URL esté definida (si no, sale con un mensaje claro).
//   2. Aplica el esquema autoritativo web/db/schema.sql (idempotente: usa
//      CREATE TABLE/EXTENSION/INDEX IF NOT EXISTS).
//   3. Inserta las cohortes semilla (DEFAULT_COHORTS) y los usuarios semilla
//      (DEFAULT_USERS) desde web/data/seed.ts, sin duplicar filas existentes.
//
// Este script SOLO se ejecuta bajo demanda (nunca durante `next build`) y lee
// DATABASE_URL en tiempo de ejecución mediante el cliente perezoso de
// web/lib/db.ts.
// ===========================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { query } from "@/lib/db";
import { DEFAULT_COHORTS, DEFAULT_USERS } from "@/data/seed";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(HERE, "..", "db", "schema.sql");

/**
 * Divide el contenido SQL en sentencias individuales respetando los bloques
 * con comillas simples. El driver serverless de Neon ejecuta una sentencia por
 * llamada, así que aplicamos el esquema sentencia por sentencia.
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];

    // Saltar comentarios de línea (-- ... hasta el fin de línea) fuera de cadenas.
    if (!inSingleQuote && char === "-" && sql[i + 1] === "-") {
      const newline = sql.indexOf("\n", i);
      if (newline === -1) break;
      i = newline;
      continue;
    }

    if (char === "'") {
      inSingleQuote = !inSingleQuote;
    }

    if (char === ";" && !inSingleQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

async function applySchema(): Promise<void> {
  console.log("→ Aplicando esquema web/db/schema.sql ...");
  const sql = await readFile(SCHEMA_PATH, "utf8");
  const statements = splitSqlStatements(sql);
  for (const statement of statements) {
    await query(statement);
  }
  console.log(`  ✓ ${statements.length} sentencias aplicadas (idempotentes).`);
}

async function seedCohorts(): Promise<void> {
  console.log("→ Insertando cohortes semilla (DEFAULT_COHORTS) ...");
  let inserted = 0;
  for (const cohort of DEFAULT_COHORTS) {
    const rows = await query(
      `INSERT INTO cohort_groups (
          code, title, institution, creator_name, created_at, is_active, description
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (code) DO NOTHING
       RETURNING code`,
      [
        cohort.code,
        cohort.title,
        cohort.institution,
        cohort.creatorName,
        Date.now(),
        cohort.isActive,
        cohort.description,
      ]
    );
    if (rows.length > 0) inserted += 1;
  }
  console.log(
    `  ✓ ${inserted} cohortes nuevas (${DEFAULT_COHORTS.length - inserted} ya existían).`
  );
}

async function seedUsers(): Promise<void> {
  console.log("→ Insertando usuarios semilla (DEFAULT_USERS) ...");
  let inserted = 0;
  for (const user of DEFAULT_USERS) {
    const rows = await query(
      `INSERT INTO app_users (
          id, email, display_name, role, cohort_code, auth_provider, institution
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [
        user.id,
        user.email,
        user.displayName,
        user.role,
        user.cohortCode ?? null,
        user.authProvider,
        user.institution ?? null,
      ]
    );
    if (rows.length > 0) inserted += 1;
  }
  console.log(
    `  ✓ ${inserted} usuarios nuevos (${DEFAULT_USERS.length - inserted} ya existían).`
  );
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      "\n✗ DATABASE_URL no está definida.\n" +
        "  Configura la cadena de conexión de Neon Postgres antes de sembrar la base de datos.\n" +
        "  Por ejemplo, crea web/.env.local con:\n" +
        "    DATABASE_URL=postgres://usuario:password@host.neon.tech/orientapp?sslmode=require\n" +
        "  y vuelve a ejecutar: npm run db:seed\n"
    );
    process.exit(1);
    return;
  }

  console.log("Inicializando la base de datos OrientApp en Neon ...\n");
  await applySchema();
  await seedCohorts();
  await seedUsers();
  console.log("\n✓ Base de datos lista. Cohortes y usuarios semilla cargados.");
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const maybe = err as { message?: unknown; error?: { message?: unknown } };
    if (typeof maybe.message === "string" && maybe.message) return maybe.message;
    if (typeof maybe.error?.message === "string" && maybe.error.message) {
      return maybe.error.message;
    }
  }
  return String(err);
}

main().catch((err: unknown) => {
  console.error(
    `\n✗ Error al sembrar la base de datos: ${describeError(err)}\n` +
      "  Verifica que DATABASE_URL apunte a una base Neon accesible y que la\n" +
      "  extensión pgvector esté disponible (CREATE EXTENSION vector).\n"
  );
  process.exit(1);
});
