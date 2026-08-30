// ===========================================================================
// Helpers de usuarios en la base de datos (Neon Postgres).
//
// Operaciones CRUD básicas para app_users usando el cliente lazy de lib/db.ts.
// Todas las consultas son case-insensitive en el correo (lower(email)).
//
// INVARIANTE DE BUILD: no se leen variables de entorno ni se crea ningún Pool
// al cargar el módulo. Solo se inicializa la conexión al ejecutar una consulta.
// ===========================================================================

import { query } from "@/lib/db";
import type { UserRoleCode } from "@/lib/riasec/types";

export interface DBUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRoleCode;
  passwordHash: string | null;
  emailVerifiedAt: number | null;
  authProvider: string;
}

/**
 * Busca un usuario por correo electrónico (comparación sin distinguir
 * mayúsculas). Devuelve null si no existe.
 */
export async function findUserByEmail(email: string): Promise<DBUser | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await query(
    `SELECT id, email, display_name, role, password_hash,
            email_verified_at, auth_provider
     FROM app_users
     WHERE lower(email) = $1
     LIMIT 1`,
    [normalized]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    role: row.role as UserRoleCode,
    passwordHash: row.password_hash as string | null,
    emailVerifiedAt: row.email_verified_at as number | null,
    authProvider: row.auth_provider as string,
  };
}

/**
 * Crea un nuevo usuario con correo y contraseña hasheada.
 * Usa ON CONFLICT en lower(email) para evitar duplicados (idempotente).
 * Devuelve el usuario creado o null si ya existía.
 */
export async function createUser(params: {
  email: string;
  displayName: string;
  passwordHash: string;
  role?: UserRoleCode;
}): Promise<DBUser | null> {
  const { email, displayName, passwordHash, role = "STUDENT" } = params;
  const normalized = email.trim().toLowerCase();
  const id = `email:${normalized}`;
  const now = Date.now();

  const rows = await query(
    `INSERT INTO app_users
       (id, email, display_name, role, password_hash, email_verified_at, auth_provider)
     VALUES ($1, $2, $3, $4, $5, NULL, 'EMAIL')
     ON CONFLICT DO NOTHING
     RETURNING id, email, display_name, role, password_hash,
               email_verified_at, auth_provider`,
    [id, normalized, displayName.trim(), role, passwordHash, now]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    role: row.role as UserRoleCode,
    passwordHash: row.password_hash as string | null,
    emailVerifiedAt: row.email_verified_at as number | null,
    authProvider: row.auth_provider as string,
  };
}

/**
 * Marca el correo de un usuario como verificado (email_verified_at = ahora).
 */
export async function markEmailVerified(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  await query(
    `UPDATE app_users
     SET email_verified_at = $1
     WHERE lower(email) = $2
       AND email_verified_at IS NULL`,
    [now, normalized]
  );
}

/**
 * Devuelve el rol de un usuario a partir de su correo.
 * Devuelve 'STUDENT' si el usuario no existe en la base de datos.
 */
export async function getUserRole(email: string): Promise<UserRoleCode> {
  const user = await findUserByEmail(email);
  return user?.role ?? "STUDENT";
}
