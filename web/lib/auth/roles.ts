// ===========================================================================
// Resolución de rol para un correo autenticado (OAuth Google).
//
// Módulo PURO y sin efectos secundarios: no toca la base de datos ni lee
// variables de entorno al cargarse. Todas las variables de entorno se leen en
// tiempo de llamada (process.env.*), para que `next build` y `tsc --noEmit`
// funcionen sin ningún secreto definido.
//
// Orden de resolución (gana el más privilegiado):
//   1. Coincidencia exacta (sin distinguir mayúsculas) contra DEFAULT_USERS
//      de web/data/seed.ts: se usa el rol de ese usuario semilla.
//   2. Listas de permitidos por entorno:
//        ADMIN_EMAILS            -> SUPER_ADMIN
//        TEST_ADMIN_EMAILS       -> TEST_ADMIN
//        REPORT_REVIEWER_EMAILS  -> REPORT_REVIEWER
//      Cada variable es una lista de correos separados por coma y/o espacios,
//      comparados sin distinguir mayúsculas. Si un correo aparece en más de una
//      lista, gana el rol de mayor privilegio.
//   3. Por defecto: STUDENT.
// ===========================================================================

import { DEFAULT_USERS } from "@/data/seed";
import { USER_ROLES, type UserRoleCode } from "@/lib/riasec/types";

/** Prioridad de roles: índice menor = mayor privilegio. */
const ROLE_PRIORITY: UserRoleCode[] = [
  "SUPER_ADMIN",
  "TEST_ADMIN",
  "REPORT_REVIEWER",
  "STUDENT",
];

/** Normaliza un correo para comparaciones (trim + minúsculas). */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Divide una lista de correos separados por coma y/o espacios. */
function parseEmailList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((e) => normalizeEmail(e))
    .filter((e) => e.length > 0);
}

/** Devuelve el rol de mayor privilegio entre dos códigos. */
function higherPrivilege(a: UserRoleCode, b: UserRoleCode): UserRoleCode {
  return ROLE_PRIORITY.indexOf(a) <= ROLE_PRIORITY.indexOf(b) ? a : b;
}

/**
 * Resuelve el UserRoleCode para un correo dado siguiendo el orden documentado
 * arriba. Lee las variables de entorno en tiempo de llamada.
 */
export function resolveRoleForEmail(email: string): UserRoleCode {
  const normalized = normalizeEmail(email ?? "");
  if (!normalized) return "STUDENT";

  // (1) Usuarios semilla (DEFAULT_USERS): coincidencia exacta case-insensitive.
  const seedUser = DEFAULT_USERS.find(
    (u) => normalizeEmail(u.email) === normalized
  );
  if (seedUser) return seedUser.role;

  // (2) Listas de permitidos por entorno. Gana el rol de mayor privilegio.
  const allowlists: Array<{ role: UserRoleCode; envVar: string }> = [
    { role: "SUPER_ADMIN", envVar: "ADMIN_EMAILS" },
    { role: "TEST_ADMIN", envVar: "TEST_ADMIN_EMAILS" },
    { role: "REPORT_REVIEWER", envVar: "REPORT_REVIEWER_EMAILS" },
  ];

  let matched: UserRoleCode | null = null;
  for (const { role, envVar } of allowlists) {
    const list = parseEmailList(process.env[envVar]);
    if (list.includes(normalized)) {
      matched = matched ? higherPrivilege(matched, role) : role;
    }
  }
  if (matched) return matched;

  // (3) Por defecto.
  return "STUDENT";
}

/** true si el rol corresponde a personal (staff), reutilizando USER_ROLES. */
export function isStaffRole(role: UserRoleCode): boolean {
  return USER_ROLES[role].isStaff;
}
