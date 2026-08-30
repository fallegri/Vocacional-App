"use server";

// ===========================================================================
// Server actions para gestión de usuarios (solo personal autorizado).
//
// listUsers(): cualquier miembro del personal puede listar los usuarios.
// setUserRole(): solo SUPER_ADMIN puede cambiar el rol de un usuario.
//
// Todos los accesos a la base de datos son lazy (se leen en tiempo de petición).
// Todos los mensajes de cara al usuario están en español.
// ===========================================================================

import { query } from "@/lib/db";
import { authorizeStaffWithRoles } from "@/lib/auth/staff";
import type { UserRoleCode } from "@/lib/riasec/types";

export interface AppUserSummary {
  id: string;
  email: string;
  displayName: string;
  role: UserRoleCode;
  emailVerifiedAt: number | null;
}

export interface SetUserRoleResult {
  ok: boolean;
  error?: string;
}

/**
 * Lista todos los usuarios registrados en la base de datos.
 * Autorizado para cualquier miembro del personal (staff).
 * Si la base de datos no está disponible devuelve un array vacío.
 */
export async function listUsers(): Promise<AppUserSummary[]> {
  const auth = await authorizeStaffWithRoles([
    "SUPER_ADMIN",
    "TEST_ADMIN",
    "PROFESOR",
    "REPORT_REVIEWER",
  ]);
  if (!auth.ok) {
    // Sin autorización devolvemos lista vacía (no lanzamos).
    return [];
  }

  try {
    const rows = await query(
      `SELECT id, email, display_name, role, email_verified_at
       FROM app_users
       ORDER BY role, email`
    );

    return rows.map((row) => ({
      id: row.id as string,
      email: row.email as string,
      displayName: row.display_name as string,
      role: row.role as UserRoleCode,
      emailVerifiedAt: row.email_verified_at as number | null,
    }));
  } catch {
    // Base de datos no disponible: devolvemos array vacío.
    return [];
  }
}

/**
 * Actualiza el rol de un usuario en la base de datos.
 * Solo los SUPER_ADMIN pueden ejecutar esta acción.
 *
 * @param email Correo del usuario a modificar (sin distinción de mayúsculas).
 * @param role  Nuevo rol a asignar.
 */
export async function setUserRole(
  email: string,
  role: UserRoleCode
): Promise<SetUserRoleResult> {
  const auth = await authorizeStaffWithRoles(["SUPER_ADMIN"]);
  if (!auth.ok) {
    return {
      ok: false,
      error:
        auth.error ??
        "Solo el administrador principal puede cambiar roles de usuario.",
    };
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "El correo del usuario no puede estar vacío." };
  }

  // Validar que el rol sea uno de los valores permitidos.
  const validRoles: UserRoleCode[] = [
    "SUPER_ADMIN",
    "TEST_ADMIN",
    "PROFESOR",
    "REPORT_REVIEWER",
    "STUDENT",
  ];
  if (!validRoles.includes(role)) {
    return { ok: false, error: `El rol '${role}' no es válido.` };
  }

  try {
    await query(
      `UPDATE app_users SET role = $1 WHERE lower(email) = $2`,
      [role, normalized]
    );
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo actualizar el rol.";
    return { ok: false, error: message };
  }
}
