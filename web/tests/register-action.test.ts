import { describe, it, expect, vi, beforeEach } from "vitest";

// ===========================================================================
// Tests de registerAction (web/lib/actions/auth.ts).
//
// Cubre los casos:
//   1. Registro exitoso de un usuario nuevo.
//   2. Correo existente ya VERIFICADO -> error con mensaje específico.
//   3. Correo existente NO VERIFICADO -> reenvía token -> ok:true con resent.
//   4. Validaciones básicas (correo inválido, nombre vacío, contraseña corta).
//
// Se mockean todas las dependencias lazy: lib/auth/users, lib/auth/passwords,
// lib/auth/tokens y lib/email/client.
// ===========================================================================

// Mocks de NextAuth mínimos para que auth.ts importe sin arrastrar next/server.
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: async () => null,
    signIn: async () => {},
    signOut: async () => {},
  })),
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((opts: { authorize?: unknown }) => ({ ...opts, id: "credentials" })),
}));

// Mocks de auth.ts para evitar la cadena de imports de next-auth.
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  isAuthConfigured: vi.fn(() => true),
  auth: vi.fn(async () => null),
}));

vi.mock("@/lib/auth/passwords", () => ({
  hashPassword: vi.fn(async () => "hashed-password"),
}));

vi.mock("@/lib/auth/users", () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock("@/lib/auth/tokens", () => ({
  createVerificationToken: vi.fn(async () => "new-token-123"),
}));

vi.mock("@/lib/email/client", () => ({
  sendVerificationEmail: vi.fn(async () => ({ sent: false, skipped: true })),
}));

import { registerAction } from "@/lib/actions/auth";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { hashPassword } from "@/lib/auth/passwords";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email/client";

const mockCreateUser = vi.mocked(createUser);
const mockFindUserByEmail = vi.mocked(findUserByEmail);
const mockHashPassword = vi.mocked(hashPassword);
const mockCreateVerificationToken = vi.mocked(createVerificationToken);
const mockSendVerificationEmail = vi.mocked(sendVerificationEmail);

beforeEach(() => {
  vi.clearAllMocks();
  mockHashPassword.mockResolvedValue("hashed-password");
  mockCreateVerificationToken.mockResolvedValue("new-token-abc");
  mockSendVerificationEmail.mockResolvedValue({ sent: false, skipped: true });
});

describe("registerAction - validaciones de entrada", () => {
  it("devuelve error para un correo inválido", async () => {
    const result = await registerAction({
      email: "no-es-correo",
      displayName: "Usuario",
      password: "contraseña123",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("correo");
  });

  it("devuelve error cuando el nombre está vacío", async () => {
    const result = await registerAction({
      email: "test@example.com",
      displayName: "  ",
      password: "contraseña123",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("devuelve error cuando la contraseña es demasiado corta", async () => {
    const result = await registerAction({
      email: "test@example.com",
      displayName: "Usuario",
      password: "corta",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("8 caracteres");
  });
});

describe("registerAction - usuario nuevo", () => {
  it("registra exitosamente a un usuario nuevo", async () => {
    mockCreateUser.mockResolvedValue({
      id: "email:nuevo@example.com",
      email: "nuevo@example.com",
      displayName: "Usuario Nuevo",
      role: "STUDENT",
      passwordHash: "hashed-password",
      emailVerifiedAt: null,
      authProvider: "EMAIL",
    });

    const result = await registerAction({
      email: "nuevo@example.com",
      displayName: "Usuario Nuevo",
      password: "contraseña123",
    });

    expect(result.ok).toBe(true);
    expect(result.resent).toBeUndefined();
    expect(mockCreateUser).toHaveBeenCalledOnce();
    expect(mockCreateVerificationToken).toHaveBeenCalledOnce();
    expect(mockSendVerificationEmail).toHaveBeenCalledOnce();
  });
});

describe("registerAction - correo existente", () => {
  it("devuelve error específico cuando el correo ya está verificado", async () => {
    // createUser devuelve null -> ON CONFLICT
    mockCreateUser.mockResolvedValue(null);
    // El usuario existente ya está verificado.
    mockFindUserByEmail.mockResolvedValue({
      id: "email:verificado@example.com",
      email: "verificado@example.com",
      displayName: "Ya Verificado",
      role: "STUDENT",
      passwordHash: "old-hash",
      emailVerifiedAt: Date.now() - 1000,
      authProvider: "EMAIL",
    });

    const result = await registerAction({
      email: "verificado@example.com",
      displayName: "Intento Nuevo",
      password: "contraseña123",
    });

    expect(result.ok).toBe(false);
    expect(result.resent).toBeUndefined();
    expect(result.error).toContain("verificada");
    expect(result.error).toContain("Inicia sesión");
    // No debe generar ni enviar un token para una cuenta ya verificada.
    expect(mockCreateVerificationToken).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("reenvía el token cuando la cuenta existe pero NO está verificada", async () => {
    // createUser devuelve null -> ON CONFLICT
    mockCreateUser.mockResolvedValue(null);
    // El usuario existente NO está verificado.
    mockFindUserByEmail.mockResolvedValue({
      id: "email:sinverificar@example.com",
      email: "sinverificar@example.com",
      displayName: "Sin Verificar",
      role: "STUDENT",
      passwordHash: "old-hash",
      emailVerifiedAt: null,
      authProvider: "EMAIL",
    });

    const result = await registerAction({
      email: "sinverificar@example.com",
      displayName: "Intento Nuevo",
      password: "contraseña123",
    });

    expect(result.ok).toBe(true);
    expect(result.resent).toBe(true);
    expect(result.error).toContain("sin verificar");
    expect(result.error).toContain("nuevo correo de confirmación");
    // Debe generar un nuevo token y enviar el correo.
    expect(mockCreateVerificationToken).toHaveBeenCalledOnce();
    expect(mockSendVerificationEmail).toHaveBeenCalledOnce();
  });

  it("devuelve ok:true con resent:true incluso si el envío de correo falla", async () => {
    mockCreateUser.mockResolvedValue(null);
    mockFindUserByEmail.mockResolvedValue({
      id: "email:fallo@example.com",
      email: "fallo@example.com",
      displayName: "Fallo Correo",
      role: "STUDENT",
      passwordHash: "old-hash",
      emailVerifiedAt: null,
      authProvider: "EMAIL",
    });
    // El envío del correo lanza una excepción.
    mockSendVerificationEmail.mockRejectedValue(new Error("Error de red"));

    const result = await registerAction({
      email: "fallo@example.com",
      displayName: "Intento Nuevo",
      password: "contraseña123",
    });

    // El resultado sigue siendo ok:true con resent:true aunque el correo falle.
    expect(result.ok).toBe(true);
    expect(result.resent).toBe(true);
  });
});
