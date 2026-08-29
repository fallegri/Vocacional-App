import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";

// La guardia de staff ahora depende de @/auth (Auth.js) y de los helpers de
// sesión. En el entorno de test (node, sin next runtime) mockeamos ambos para
// probar la lógica de autorización de forma aislada.
//
// NOTA (FEAT-002): este es un ajuste mínimo para mantener la suite verde tras
// pasar la guardia a un modelo basado en ROLES con fallback por token. La
// reescritura completa del suite (cobertura de roles OAuth) corresponde a
// FEAT-003.
const authState = { configured: false };
const sessionUser: { email: string; role: string } | null = { email: "", role: "STUDENT" };
let currentUser: { email: string; role: string } | null = null;

vi.mock("@/auth", () => ({
  isAuthConfigured: () => authState.configured,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => currentUser,
}));

import {
  authorizeStaff,
  authorizeStaffWithRoles,
  authorizeStaffRequest,
  isStaffAuthEnabled,
  STAFF_TOKEN_HEADER,
} from "@/lib/auth/staff";

const ORIGINAL = process.env.STAFF_ACCESS_TOKEN;

beforeEach(() => {
  authState.configured = false;
  currentUser = null;
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STAFF_ACCESS_TOKEN;
  else process.env.STAFF_ACCESS_TOKEN = ORIGINAL;
});

describe("authorizeStaff (demo mode, sin OAuth ni token)", () => {
  it("permite cualquier mutación cuando no hay OAuth ni STAFF_ACCESS_TOKEN", async () => {
    delete process.env.STAFF_ACCESS_TOKEN;
    expect(isStaffAuthEnabled()).toBe(false);
    expect((await authorizeStaff(null)).ok).toBe(true);
    expect((await authorizeStaff("whatever")).ok).toBe(true);
  });
});

describe("authorizeStaff (fallback por token, sin OAuth)", () => {
  it("rechaza cuando no se presenta token", async () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    expect(isStaffAuthEnabled()).toBe(true);
    const res = await authorizeStaff(null);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("rechaza un token incorrecto", async () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    expect((await authorizeStaff("otro")).ok).toBe(false);
  });

  it("acepta el token correcto (con trim)", async () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    expect((await authorizeStaff("secreto-123")).ok).toBe(true);
    expect((await authorizeStaff("  secreto-123  ")).ok).toBe(true);
  });
});

describe("authorizeStaffWithRoles (con OAuth configurado)", () => {
  beforeEach(() => {
    authState.configured = true;
  });

  it("rechaza cuando no hay sesión", async () => {
    currentUser = null;
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("rechaza a un estudiante (no staff)", async () => {
    currentUser = { email: "a@b.com", role: "STUDENT" };
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(false);
  });

  it("rechaza a un staff con rol no permitido", async () => {
    currentUser = { email: "a@b.com", role: "REPORT_REVIEWER" };
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(false);
  });

  it("acepta a un rol permitido", async () => {
    currentUser = { email: "a@b.com", role: "SUPER_ADMIN" };
    const res = await authorizeStaffWithRoles(["SUPER_ADMIN", "TEST_ADMIN"]);
    expect(res.ok).toBe(true);
  });

  it("isStaffAuthEnabled es false cuando OAuth está configurado", () => {
    process.env.STAFF_ACCESS_TOKEN = "x";
    expect(isStaffAuthEnabled()).toBe(false);
  });
});

describe("authorizeStaffRequest", () => {
  it("usa el token de la cabecera x-staff-token como fallback sin OAuth", async () => {
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
