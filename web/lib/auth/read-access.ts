// ===========================================================================
// Guardas de autorización de LECTURA (solo servidor).
//
// Extiende el modelo de roles OAuth (lib/auth/roles.ts, lib/auth/session.ts)
// a las lecturas: no basta con proteger las mutaciones, también las páginas y
// endpoints que LEEN datos de una sesión deben respetar la propiedad del
// estudiante y los niveles de personal (staff).
//
// Modelo aplicado por authorizeSessionRead(session):
//   - isAuthConfigured() === false  -> ok:true (MODO DEMO: las lecturas quedan
//     abiertas, se preserva el comportamiento actual para que `next build` sin
//     variables de entorno y las demostraciones locales sigan funcionando).
//   - Con OAuth configurado:
//       * anónimo (sin sesión)           -> ok:false
//       * personal (isStaffRole)         -> ok:true (puede leer cualquier sesión)
//       * STUDENT dueño de la sesión     -> ok:true SOLO si session.student_email
//         no es nulo/vacío y coincide (sin distinguir mayúsculas) con el correo
//         autenticado.
//       * STUDENT que no es el dueño     -> ok:false
//       * sesión con student_email nulo  -> legible solo por personal (staff).
//
// Todas las variables de entorno se leen en tiempo de llamada (nunca al cargar
// el módulo). Todos los mensajes de cara al usuario están en español.
// ===========================================================================

import { isAuthConfigured } from "@/auth";
import { getCurrentUser, requireStaff } from "@/lib/auth/session";
import type { AuthGuardResult, CurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";

/** Resultado estructurado de una autorización de lectura de sesión. */
export interface ReadAuthResult {
  ok: boolean;
  /** true si la autenticación (OAuth Google) está configurada en el servidor. */
  authConfigured: boolean;
  /** true si el usuario autenticado es personal (staff). */
  isStaff: boolean;
  /** Usuario autenticado cuando hay sesión. */
  user?: CurrentUser;
  /** Mensaje en español cuando ok === false. */
  error?: string;
}

/** Forma mínima de una sesión necesaria para decidir la propiedad. */
interface SessionLike {
  studentEmail: string | null;
}

/** Normaliza un correo para comparaciones (trim + minúsculas). */
function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Autoriza la LECTURA de una sesión de evaluación según el modelo documentado
 * arriba. Lee las variables de entorno en tiempo de llamada.
 */
export async function authorizeSessionRead(
  session: SessionLike
): Promise<ReadAuthResult> {
  const authConfigured = isAuthConfigured();

  // Modo demo: sin OAuth, las lecturas quedan abiertas (comportamiento actual).
  if (!authConfigured) {
    return { ok: true, authConfigured: false, isStaff: false };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      authConfigured: true,
      isStaff: false,
      error: "Debes iniciar sesión con Google para ver estos resultados.",
    };
  }

  // El personal (staff) puede leer cualquier sesión, incluidas las que tienen
  // student_email nulo/vacío.
  if (isStaffRole(user.role)) {
    return { ok: true, authConfigured: true, isStaff: true, user };
  }

  // STUDENT: solo puede leer su propia sesión (correo no nulo y coincidente).
  const ownerEmail = normalizeEmail(session.studentEmail);
  if (ownerEmail && ownerEmail === normalizeEmail(user.email)) {
    return { ok: true, authConfigured: true, isStaff: false, user };
  }

  return {
    ok: false,
    authConfigured: true,
    isStaff: false,
    user,
    error: "No tienes permisos para ver los resultados de esta evaluación.",
  };
}

/**
 * Envoltura fina para listados reservados al personal (staff), delegando en
 * requireStaff(). Útil para páginas/endpoints que listan datos agregados.
 */
export async function requireStaffRead(): Promise<AuthGuardResult> {
  return requireStaff();
}
