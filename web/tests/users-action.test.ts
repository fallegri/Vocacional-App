import { describe, it, expect, vi, beforeEach } from "vitest";

// ===========================================================================
// Tests para las server actions de gestión de usuarios (lib/actions/users.ts).
//
// Se mockean lib/db y lib/auth/staff para no necesitar base de datos ni sesión
// real. Las pruebas verifican:
//   1. Un SUPER_ADMIN puede cambiar el rol de un usuario.
//   2. Un usuario sin permisos recibe un error de autorización.
//   3. listUsers devuelve usuarios cuando el personal está autorizado.
//   4. listUsers devuelve [] cuando la DB no está disponible.
// ===========================================================================

// Usamos vi.mock con factory para evitar el problema de hoisting con variables.
vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/auth/staff", () => ({
  authorizeStaffWithRoles: vi.fn(),
}));

// Importar módulos y mocks DESPUÉS de declarar los vi.mock.
import { setUserRole, listUsers } from "@/lib/actions/users";
import { query } from "@/lib/db";
import { authorizeStaffWithRoles } from "@/lib/auth/staff";

const mockQuery = vi.mocked(query);
const mockAuthorizeStaffWithRoles = vi.mocked(authorizeStaffWithRoles);

beforeEach(() => {
  mockQuery.mockReset();
  mockAuthorizeStaffWithRoles.mockReset();
});

describe("setUserRole", () => {
  it("SUPER_ADMIN puede cambiar el rol de un usuario", async () => {
    // Simular que el SUPER_ADMIN está autorizado.
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });
    mockQuery.mockResolvedValue([]);

    const result = await setUserRole("alumno@example.com", "PROFESOR");

    expect(result.ok).toBe(true);
    expect(mockQuery).toHaveBeenCalledOnce();
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("UPDATE app_users SET role");
    expect(params).toContain("PROFESOR");
    expect(params).toContain("alumno@example.com");
  });

  it("normaliza el correo a minúsculas al hacer el UPDATE", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });
    mockQuery.mockResolvedValue([]);

    await setUserRole("ALUMNO@EXAMPLE.COM", "STUDENT");

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toContain("alumno@example.com");
  });

  it("devuelve error cuando la autorización falla", async () => {
    // Simular que no hay permisos (p. ej. STUDENT).
    mockAuthorizeStaffWithRoles.mockResolvedValue({
      ok: false,
      error: "Solo el administrador principal puede cambiar roles de usuario.",
    });

    const result = await setUserRole("alumno@example.com", "TEST_ADMIN");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    // No se debe ejecutar ninguna consulta DB.
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("devuelve error para un rol inválido", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });

    const result = await setUserRole(
      "alumno@example.com",
      "ROL_INVENTADO" as import("@/lib/riasec/types").UserRoleCode
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("no es válido");
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("devuelve error cuando el correo está vacío", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });

    const result = await setUserRole("   ", "STUDENT");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("devuelve error cuando la DB falla", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });
    mockQuery.mockRejectedValue(new Error("Conexión rechazada"));

    const result = await setUserRole("alumno@example.com", "REPORT_REVIEWER");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Conexión rechazada");
  });
});

describe("listUsers", () => {
  it("devuelve usuarios cuando el personal está autorizado", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });
    mockQuery.mockResolvedValue([
      {
        id: "email:admin@test.com",
        email: "admin@test.com",
        display_name: "Administrador",
        role: "SUPER_ADMIN",
        email_verified_at: 1700000000000,
      },
      {
        id: "email:profesor@test.com",
        email: "profesor@test.com",
        display_name: "Prof. García",
        role: "PROFESOR",
        email_verified_at: null,
      },
    ]);

    const users = await listUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe("admin@test.com");
    expect(users[0].role).toBe("SUPER_ADMIN");
    expect(users[0].emailVerifiedAt).toBe(1700000000000);
    expect(users[1].displayName).toBe("Prof. García");
    expect(users[1].emailVerifiedAt).toBeNull();
  });

  it("devuelve [] cuando la autorización falla", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({
      ok: false,
      error: "No autorizado",
    });

    const users = await listUsers();

    expect(users).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("devuelve [] cuando la DB lanza una excepción", async () => {
    mockAuthorizeStaffWithRoles.mockResolvedValue({ ok: true });
    mockQuery.mockRejectedValue(new Error("Sin conexión a la base de datos"));

    const users = await listUsers();

    expect(users).toEqual([]);
  });
});
