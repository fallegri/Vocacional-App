import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// ===========================================================================
// Suite de autorización basada en ROLES (modelo OAuth Google / Auth.js).
//
// Estrategia de prueba:
//  - resolveRoleForEmail e isStaffRole son funciones PURAS (web/lib/auth/roles.ts)
//    y se prueban directamente, SIN mocks, manipulando process.env con limpieza
//    en afterEach.
//  - isAuthConfigured es la lógica REAL de web/auth.ts. Ese módulo importa el
//    runtime de NextAuth (que arrastra next/server, que no resuelve bajo el
//    entorno node de Vitest), así que mockeamos "next-auth",
//    "next-auth/providers/google" y "@/lib/auth/link-user" con implementaciones
//    mínimas para poder importarlo. Solo se prueba la LÓGICA propia del proyecto
//    (lectura de GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/AUTH_SECRET), nunca las
//    internas del framework.
//  - La guardia authorizeStaff/authorizeStaffWithRoles (web/lib/auth/staff.ts)
//    usa el isAuthConfigured REAL (controlado por variables de entorno) y el
//    helper getCurrentUser, que se mockea para inyectar el usuario/rol de sesión
//    sin depender del runtime de Auth.js.
//
// Las aserciones están diseñadas para FALLAR si la implementación se revirtiera
// al antiguo modelo basado solo en token compartido.
// ===========================================================================

// Mock mínimo del runtime de NextAuth: permite importar web/auth.ts (y por
// transitividad web/lib/auth/staff.ts) sin arrastrar next/server.
vi.mock("next-auth", () => ({
  default: () => ({
    handlers: {},
    auth: () => null,
    signIn: () => {},
    signOut: () => {},
  }),
}));
vi.mock("next-auth/providers/credentials", () => ({ default: () => ({}) }));

// Solo mockeamos getCurrentUser para inyectar la sesión en las pruebas de la
// guardia; isAuthConfigured se usa REAL (leyendo process.env).
let currentUser: { email: string; role: string } | null = null;
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => currentUser,
}));

import { isStaffRole } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/auth";
import {
  authorizeStaff,
  authorizeStaffWithRoles,
  authorizeStaffRequest,
  isStaffAuthEnabled,
  STAFF_TOKEN_HEADER,
} from "@/lib/auth/staff";

// --- Limpieza de variables de entorno usadas por las pruebas ----------------
const ENV_KEYS = [
  "STAFF_ACCESS_TOKEN",
  "AUTH_SECRET",
] as const;

const ORIGINAL: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) ORIGINAL[k] = process.env[k];

/** Define AUTH_SECRET para que isAuthConfigured() sea true. */
function configureOAuth() {
  process.env.AUTH_SECRET = "test-auth-secret";
}

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  currentUser = null;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL[k];
  }
});

// ===========================================================================
// resolveRoleForEmail ya NO existe (fue reemplazada por DB-backed getUserRole).
// isStaffRole (función pura, sin mocks)
// ===========================================================================
describe("isStaffRole", () => {
  it("es true para roles de personal (staff)", () => {
    expect(isStaffRole("SUPER_ADMIN")).toBe(true);
    expect(isStaffRole("TEST_ADMIN")).toBe(true);
    expect(isStaffRole("REPORT_REVIEWER")).toBe(true);
    expect(isStaffRole("PROFESOR")).toBe(true);
  });

  it("es false para STUDENT", () => {
    expect(isStaffRole("STUDENT")).toBe(false);
  });
})

// ===========================================================================
// isAuthConfigured (lógica real de web/auth.ts)
// ===========================================================================
describe("isAuthConfigured", () => {
  it("es false cuando AUTH_SECRET no está definida", () => {
    expect(isAuthConfigured()).toBe(false);
  });

  it("es false cuando AUTH_SECRET está en blanco", () => {
    process.env.AUTH_SECRET = "   ";
    expect(isAuthConfigured()).toBe(false);
  });

  it("es true cuando AUTH_SECRET está definida y no está en blanco", () => {
    process.env.AUTH_SECRET = "test-auth-secret";
    expect(isAuthConfigured()).toBe(true);
  });
});

// ===========================================================================
// Guardia basada en rol: authorizeStaffWithRoles / authorizeStaff (con OAuth)
// ===========================================================================
describe("authorizeStaffWithRoles (OAuth configurado, sesión mockeada)", () => {
  beforeEach(() => {
    configureOAuth();
  });

  it("rechaza cuando no hay sesión (anónimo)", async () => {
    currentUser = null;
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("rechaza a un estudiante (rol no staff)", async () => {
    currentUser = { email: "alumno@x.com", role: "STUDENT" };
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(false);
  });

  it("rechaza a un staff cuyo rol no está en la lista permitida", async () => {
    currentUser = { email: "revisor@x.com", role: "REPORT_REVIEWER" };
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(false);
  });

  it("acepta a un usuario con un rol permitido", async () => {
    currentUser = { email: "admin@x.com", role: "SUPER_ADMIN" };
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(true);
  });

  it("authorizeStaff acepta cualquier rol de personal", async () => {
    currentUser = { email: "revisor@x.com", role: "REPORT_REVIEWER" };
    expect((await authorizeStaff()).ok).toBe(true);
  });

  it("authorizeStaff rechaza a un estudiante", async () => {
    currentUser = { email: "alumno@x.com", role: "STUDENT" };
    expect((await authorizeStaff()).ok).toBe(false);
  });

  it("con OAuth configurado, isStaffAuthEnabled es false aunque exista STAFF_ACCESS_TOKEN", () => {
    process.env.STAFF_ACCESS_TOKEN = "irrelevante";
    expect(isStaffAuthEnabled()).toBe(false);
  });

  it("con OAuth configurado, el token compartido NO otorga acceso a un estudiante", async () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto";
    currentUser = { email: "alumno@x.com", role: "STUDENT" };
    // Aunque se presente el token correcto, manda la sesión + rol.
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN"], "secreto");
    expect(res.ok).toBe(false);
  });
});

// ===========================================================================
// Fallback heredado por token: solo activo cuando la auth NO está configurada.
// ===========================================================================
describe("fallback STAFF_ACCESS_TOKEN (sin OAuth configurado)", () => {
  it("modo demo: sin token configurado permite cualquier mutación", async () => {
    expect(isAuthConfigured()).toBe(false);
    expect(isStaffAuthEnabled()).toBe(false);
    expect((await authorizeStaff(null)).ok).toBe(true);
    expect((await authorizeStaff("lo-que-sea")).ok).toBe(true);
  });

  it("con token configurado, se exige y valida", async () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    expect(isStaffAuthEnabled()).toBe(true);

    // Sin token presentado -> rechazo.
    const sinToken = await authorizeStaff(null);
    expect(sinToken.ok).toBe(false);
    expect(sinToken.error).toBeTruthy();

    // Token incorrecto -> rechazo.
    expect((await authorizeStaff("otro")).ok).toBe(false);

    // Token correcto (con espacios recortados) -> acepta.
    expect((await authorizeStaff("secreto-123")).ok).toBe(true);
    expect((await authorizeStaff("  secreto-123  ")).ok).toBe(true);
  });
});

// ===========================================================================
// authorizeStaffRequest: extrae el token de la cabecera (fallback sin OAuth)
// ===========================================================================
describe("authorizeStaffRequest", () => {
  it("usa la cabecera x-staff-token como fallback cuando no hay OAuth", async () => {
    process.env.STAFF_ACCESS_TOKEN = "abc";

    const ok = new Request("https://x/api", {
      headers: { [STAFF_TOKEN_HEADER]: "abc" },
    });
    expect((await authorizeStaffRequest(ok)).ok).toBe(true);

    const bad = new Request("https://x/api", {
      headers: { [STAFF_TOKEN_HEADER]: "nope" },
    });
    expect((await authorizeStaffRequest(bad)).ok).toBe(false);
  });
});
