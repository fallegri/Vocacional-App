// ===========================================================================
// Guardia mínima de autorización para operaciones de personal (staff).
//
// La app aún NO tiene OAuth real (ver README > "Autenticación"). Este módulo
// añade una barrera pragmática para las MUTACIONES del personal (crear
// cohortes, guardar la configuración de IA, subir documentos a la base de
// conocimiento y guardar el dictamen del revisor) sin requerir un proveedor
// OAuth ni variables de entorno para que `next build` funcione.
//
// Modelo:
//  - Si `STAFF_ACCESS_TOKEN` NO está definido en el entorno del servidor, la app
//    corre en "modo demo": las mutaciones se permiten (como hasta ahora) para no
//    romper la demostración ni el build sin variables de entorno.
//  - Si `STAFF_ACCESS_TOKEN` está definido, TODA mutación de personal exige que
//    el cliente presente ese mismo token; de lo contrario se rechaza. Así, en
//    un despliegue real basta con definir la variable para cerrar el acceso.
//
// El token se compara SOLO en el servidor y nunca se envía al navegador. En la
// UI el personal lo introduce en un campo y se reenvía con cada mutación.
//
// Esto NO sustituye a una autenticación real (OAuth / SSO / roles). Es una
// barrera de despliegue mínima hasta implementar auth completa (fuera de alcance
// de esta migración).
// ===========================================================================

export interface StaffAuthResult {
  ok: boolean;
  /** Mensaje en español cuando ok === false. */
  error?: string;
}

/** Nombre de la cabecera HTTP donde la UI envía el token de personal. */
export const STAFF_TOKEN_HEADER = "x-staff-token";

/** true si el servidor exige un token de personal (STAFF_ACCESS_TOKEN definido). */
export function isStaffAuthEnabled(): boolean {
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
 * Autoriza una mutación de personal a partir del token presentado.
 * Devuelve { ok: true } en modo demo (sin STAFF_ACCESS_TOKEN) o cuando el token
 * coincide; en caso contrario { ok: false, error }.
 */
export function authorizeStaff(presentedToken: string | null | undefined): StaffAuthResult {
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
 * Extrae el token de personal de una petición entrante (route handlers).
 * Lo busca en la cabecera `x-staff-token`.
 */
export function getStaffTokenFromRequest(request: Request): string | null {
  return request.headers.get(STAFF_TOKEN_HEADER);
}

/** Autoriza una mutación de personal a partir de una Request. */
export function authorizeStaffRequest(request: Request): StaffAuthResult {
  return authorizeStaff(getStaffTokenFromRequest(request));
}
