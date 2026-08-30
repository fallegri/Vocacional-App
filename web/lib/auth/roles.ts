// ===========================================================================
// Resolución de rol para un correo autenticado (Credentials / Auth.js v5).
//
// A partir de FEAT-002 el rol se lee de la base de datos (app_users) en el
// momento del inicio de sesión y se almacena en el JWT. La antigua lógica de
// allowlists por variables de entorno ha sido eliminada.
//
// Este módulo es PURO al cargarse: no lee variables de entorno ni accede a
// la base de datos al importarse. Toda la lógica lazy queda en los helpers de
// lib/auth/users.ts.
//
// isStaffRole(role) es la única función pura exportada aquí; se mantiene para
// que los guardas de autorización (staff.ts, session.ts, read-access.ts) puedan
// verificar si un rol pertenece al personal sin depender de lib/auth/users.ts.
// ===========================================================================

import { USER_ROLES, type UserRoleCode } from "@/lib/riasec/types";

/**
 * true si el rol corresponde a personal (staff), consultando USER_ROLES.
 * Incluye SUPER_ADMIN, TEST_ADMIN, PROFESOR y REPORT_REVIEWER.
 */
export function isStaffRole(role: UserRoleCode): boolean {
  return USER_ROLES[role]?.isStaff ?? false;
}

/**
 * Obtiene el rol de un usuario por correo electrónico desde la base de datos.
 * Devuelve 'STUDENT' si el usuario no existe.
 *
 * Esta función es una capa de indirección sobre lib/auth/users.getUserRole para
 * mantener compatibilidad con los módulos que importan desde lib/auth/roles.
 * Solo se ejecuta en tiempo de petición (nunca al cargar el módulo).
 */
export async function resolveRoleFromDB(email: string): Promise<UserRoleCode> {
  const { getUserRole } = await import("@/lib/auth/users");
  return getUserRole(email);
}
