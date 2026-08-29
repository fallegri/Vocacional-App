// ===========================================================================
// Helpers de sesión SOLO para servidor (server actions y route handlers).
//
// Obtienen el usuario autenticado desde la sesión de Auth.js (`auth()`) y
// ofrecen guardas por rol que devuelven un resultado estructurado (sin lanzar),
// para poder usarse cómodamente tanto en server actions como en handlers de
// ruta. Todos los mensajes de cara al usuario están en español.
//
// Comportamiento cuando la autenticación NO está configurada
// (isAuthConfigured() === false): getCurrentUser() devuelve null y las guardas
// devuelven { ok: false, authConfigured: false, ... }. Se expone el flag
// `authConfigured` en cada resultado para que FEAT-002 decida el fallback (por
// ejemplo, preservar el "modo demo" actual mientras no haya OAuth desplegado).
// Este módulo NO decide por sí mismo abrir el acceso; se limita a informar el
// estado real y a exigir sesión+rol cuando la auth SÍ está configurada.
// ===========================================================================

import { auth, isAuthConfigured } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import type { UserRoleCode } from "@/lib/riasec/types";

export interface CurrentUser {
  email: string;
  role: UserRoleCode;
}

export interface AuthGuardResult {
  ok: boolean;
  /** true si la autenticación (OAuth Google) está configurada en el servidor. */
  authConfigured: boolean;
  /** Mensaje en español cuando ok === false. */
  error?: string;
  /** Usuario autenticado cuando ok === true. */
  user?: CurrentUser;
}

/**
 * Devuelve el usuario autenticado ({ email, role }) o null si no hay sesión o
 * la autenticación no está configurada.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isAuthConfigured()) return null;

  const session = await auth();
  const email = session?.user?.email;
  const role = session?.user?.role;
  if (!email || !role) return null;

  return { email, role };
}

/**
 * Exige que el usuario autenticado tenga uno de los roles indicados.
 * Devuelve un resultado estructurado (no lanza).
 */
export async function requireRole(
  roles: UserRoleCode[]
): Promise<AuthGuardResult> {
  const authConfigured = isAuthConfigured();
  if (!authConfigured) {
    return {
      ok: false,
      authConfigured: false,
      error:
        "La autenticación con Google no está configurada en el servidor.",
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      authConfigured: true,
      error: "Debes iniciar sesión con Google para continuar.",
    };
  }

  if (!roles.includes(user.role)) {
    return {
      ok: false,
      authConfigured: true,
      error: "No tienes permisos suficientes para esta operación.",
      user,
    };
  }

  return { ok: true, authConfigured: true, user };
}

/**
 * Exige que el usuario autenticado sea personal (staff): cualquier rol con
 * USER_ROLES[rol].isStaff === true.
 */
export async function requireStaff(): Promise<AuthGuardResult> {
  const authConfigured = isAuthConfigured();
  if (!authConfigured) {
    return {
      ok: false,
      authConfigured: false,
      error:
        "La autenticación con Google no está configurada en el servidor.",
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      authConfigured: true,
      error: "Debes iniciar sesión con Google para continuar.",
    };
  }

  if (!isStaffRole(user.role)) {
    return {
      ok: false,
      authConfigured: true,
      error: "Esta operación está reservada al personal autorizado.",
      user,
    };
  }

  return { ok: true, authConfigured: true, user };
}
