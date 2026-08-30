import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// ===========================================================================
// Suite de autorización de LECTURA (authorizeSessionRead, web/lib/auth/read-access.ts).
//
// Estrategia de prueba (misma que web/tests/auth-roles.test.ts):
//  - Mockeamos "next-auth", "next-auth/providers/google" y "@/lib/auth/link-user"
//    con implementaciones mínimas para poder importar web/auth.ts (y así usar el
//    isAuthConfigured REAL, controlado por variables de entorno) sin arrastrar
//    el runtime de NextAuth (next/server) al entorno node de Vitest.
//  - Mockeamos SOLO getCurrentUser de "@/lib/auth/session" para inyectar la
//    sesión/rol del usuario en cada caso. isStaffRole y la lógica bajo prueba
//    (authorizeSessionRead) son REALES, para que las aserciones FALLEN si se
//    revierte la lógica de propiedad.
//  - isAuthConfigured se controla mediante GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/
//    AUTH_SECRET, con limpieza en afterEach.
// ===========================================================================

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: {},
    auth: () => null,
    signIn: () => {},
    signOut: () => {},
  }),
}));
vi.mock("next-auth/providers/credentials", () => ({ default: () => ({}) }));

let currentUser: { email: string; role: string } | null = null;
vi.mock("@/lib/auth/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/session")>(
    "@/lib/auth/session"
  );
  return {
    ...actual,
    getCurrentUser: async () => currentUser,
  };
});

import { authorizeSessionRead } from "@/lib/auth/read-access";

const ENV_KEYS = [
  "AUTH_SECRET",
] as const;

const ORIGINAL: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) ORIGINAL[k] = process.env[k];

function configureOAuth() {
  process.env.AUTH_SECRET = "test-auth-secret";
}

/** Sesión mínima con el correo dueño (student_email). */
function sessionWithOwner(studentEmail: string | null) {
  return { studentEmail };
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

describe("authorizeSessionRead", () => {
  it("(1) modo demo (sin OAuth): ok true sin importar el dueño", async () => {
    // Aunque haya un correo dueño distinto o nulo, el modo demo abre la lectura.
    currentUser = null;
    const res1 = await authorizeSessionRead(sessionWithOwner("otro@x.com"));
    expect(res1.ok).toBe(true);
    expect(res1.authConfigured).toBe(false);

    const res2 = await authorizeSessionRead(sessionWithOwner(null));
    expect(res2.ok).toBe(true);
    expect(res2.authConfigured).toBe(false);
  });

  it("(2) OAuth configurado + anónimo: ok false", async () => {
    configureOAuth();
    currentUser = null;
    const res = await authorizeSessionRead(sessionWithOwner("dueno@x.com"));
    expect(res.ok).toBe(false);
    expect(res.authConfigured).toBe(true);
    expect(res.error).toBeTruthy();
  });

  it("(3) personal (staff) puede leer cualquier sesión, incluso con student_email nulo", async () => {
    configureOAuth();
    currentUser = { email: "revisor@x.com", role: "REPORT_REVIEWER" };
    const conDueno = await authorizeSessionRead(sessionWithOwner("otro@x.com"));
    expect(conDueno.ok).toBe(true);
    expect(conDueno.isStaff).toBe(true);

    const sinDueno = await authorizeSessionRead(sessionWithOwner(null));
    expect(sinDueno.ok).toBe(true);
    expect(sinDueno.isStaff).toBe(true);
  });

  it("(4) STUDENT dueño (correo coincide, sin distinguir mayúsculas): ok true", async () => {
    configureOAuth();
    currentUser = { email: "Alumno@X.com", role: "STUDENT" };
    const res = await authorizeSessionRead(sessionWithOwner("alumno@x.com"));
    expect(res.ok).toBe(true);
    expect(res.isStaff).toBe(false);
  });

  it("(5) STUDENT con correo que no coincide: ok false", async () => {
    configureOAuth();
    currentUser = { email: "alumno@x.com", role: "STUDENT" };
    const res = await authorizeSessionRead(sessionWithOwner("otro@x.com"));
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("(6) STUDENT y session.student_email nulo: ok false", async () => {
    configureOAuth();
    currentUser = { email: "alumno@x.com", role: "STUDENT" };
    const res = await authorizeSessionRead(sessionWithOwner(null));
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });
});
