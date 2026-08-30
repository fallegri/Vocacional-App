// ===========================================================================
// Guardia de autorización para operaciones de personal (staff).
//
// A partir de FEAT-002 la autorización es PRINCIPALMENTE basada en ROLES vía
// credenciales (Auth.js / email+contraseña). Cuando la autenticación está
// configurada (isAuthConfigured() === true), la sesión del usuario y su rol
// son la única puerta de acceso: el token compartido queda deshabilitado.
//
// El antiguo STAFF_ACCESS_TOKEN se conserva ÚNICAMENTE como fallback local/demo:
//  - isAuthConfigured() === false  &&  STAFF_ACCESS_TOKEN definido  -> se exige
//    el token compartido (comportamiento heredado, útil en despliegues sin
//    credenciales todavía configuradas).
//  - isAuthConfigured() === false  &&  STAFF_ACCESS_TOKEN sin definir -> "modo
//    demo": las mutaciones se permiten (para que `next build` sin variables de
//    entorno y las demostraciones locales sigan funcionando).
//
// Todos los mensajes de cara al usuario están en español.
// ===========================================================================

import { isAuthConfigured } from "@/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import type { UserRoleCode } from "@/lib/riasec/types";

export interface StaffAuthResult {
  ok: boolean;
  /** Mensaje en español cuando ok === false. */
  error?: string;
}

/** Nombre de la cabecera HTTP donde la UI (heredada) envía el token de personal. */
export const STAFF_TOKEN_HEADER = "x-staff-token";

/** Mensaje estándar cuando falta una sesión de personal autorizada. */
const NOT_STAFF_ERROR =
  "Debes iniciar sesión con una cuenta de personal autorizada para realizar esta operación.";

/** Mensaje estándar cuando el rol no alcanza para la operación solicitada. */
const INSUFFICIENT_ROLE_ERROR =
  "No tienes permisos suficientes para realizar esta operación.";

/**
 * true si el servidor exige un token de personal heredado. Ahora SOLO aplica
 * como fallback: cuando la autenticación por credenciales NO está configurada
 * y hay un STAFF_ACCESS_TOKEN definido. Con credenciales configuradas el token
 * queda inactivo.
 */
export function isStaffAuthEnabled(): boolean {
  if (isAuthConfigured()) return false;
  return (process.env.STAFF_ACCESS_TOKEN ?? "").trim().length > 0;
}

/**
 * Comparación en tiempo (aproximadamente) constante para evitar filtrar la
 * longitud/contenido del token mediante el tiempo de respuesta.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Fallback heredado por token compartido. Solo se invoca cuando la auth de
 * credenciales NO está configurada. { ok: true } en modo demo (sin token
 * configurado) o cuando el token presentado coincide.
 */
function authorizeByToken(presentedToken: string | null | undefined): StaffAuthResult {
  const expected = (process.env.STAFF_ACCESS_TOKEN ?? "").trim();
  if (!expected) {
    // Modo demo: sin token configurado, se permite (comportamiento previo).
    return { ok: true };
  }

  const token = (presentedToken ?? "").trim();
  if (!token) {
    return {
      ok: false,
      error:
        "Esta operación requiere un token de personal. Introduce el token de acceso del personal para continuar.",
    };
  }
  if (!safeEqual(token, expected)) {
    return { ok: false, error: "Token de personal inválido." };
  }
  return { ok: true };
}

/**
 * Autoriza una mutación exigiendo que el usuario autenticado tenga uno de los
 * `allowedRoles` (basado en rol vía credenciales). Si la auth NO está
 * configurada, cae al fallback heredado (token compartido o modo demo).
 *
 * @param allowedRoles roles que pueden ejecutar la operación cuando hay credenciales.
 * @param presentedToken token heredado opcional (solo usado en el fallback).
 */
export async function authorizeStaffWithRoles(
  allowedRoles: UserRoleCode[],
  presentedToken?: string | null
): Promise<StaffAuthResult> {
  if (!isAuthConfigured()) {
    // Sin credenciales: fallback local/demo por token compartido.
    return authorizeByToken(presentedToken);
  }

  // Con credenciales configuradas, la sesión + rol es la única puerta de acceso.
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    return { ok: false, error: NOT_STAFF_ERROR };
  }
  if (!allowedRoles.includes(user.role)) {
    return { ok: false, error: INSUFFICIENT_ROLE_ERROR };
  }
  return { ok: true };
}

/**
 * Autoriza una mutación de CUALQUIER personal (staff). Con credenciales
 * configuradas exige un rol staff; sin credenciales cae al fallback heredado.
 */
export async function authorizeStaff(
  presentedToken?: string | null
): Promise<StaffAuthResult> {
  return authorizeStaffWithRoles(
    ["SUPER_ADMIN", "TEST_ADMIN", "PROFESOR", "REPORT_REVIEWER"],
    presentedToken
  );
}

/**
 * Extrae el token de personal heredado de una petición entrante (route
 * handlers). Lo busca en la cabecera `x-staff-token`.
 */
export function getStaffTokenFromRequest(request: Request): string | null {
  return request.headers.get(STAFF_TOKEN_HEADER);
}

/**
 * Autoriza una mutación de personal a partir de una Request, exigiendo uno de
 * los `allowedRoles` cuando hay credenciales (o el fallback por token en su
 * ausencia). Por defecto admite cualquier rol staff.
 */
export async function authorizeStaffRequest(
  request: Request,
  allowedRoles: UserRoleCode[] = [
    "SUPER_ADMIN",
    "TEST_ADMIN",
    "PROFESOR",
    "REPORT_REVIEWER",
  ]
): Promise<StaffAuthResult> {
  return authorizeStaffWithRoles(
    allowedRoles,
    getStaffTokenFromRequest(request)
  );
}
