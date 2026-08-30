import { describe, it, expect } from "vitest";

// ===========================================================================
// Tests de hashing y verificación de contraseñas (lib/auth/passwords.ts).
//
// Se prueban directamente sin mocks ya que bcryptjs es una dependencia pura
// (sin efectos secundarios al cargarse) y no depende de variables de entorno.
// ===========================================================================

import { hashPassword, verifyPassword } from "@/lib/auth/passwords";

describe("hashPassword / verifyPassword", () => {
  it("el hash no es igual al texto plano", async () => {
    const plain = "MiContraseña123";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifica correctamente la contraseña correcta", async () => {
    const plain = "ContraseñaSegura!99";
    const hash = await hashPassword(plain);
    const ok = await verifyPassword(plain, hash);
    expect(ok).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const plain = "ContraseñaSegura!99";
    const hash = await hashPassword(plain);
    const ok = await verifyPassword("OtraContraseña", hash);
    expect(ok).toBe(false);
  });

  it("cada llamada a hashPassword genera un hash diferente (salt)", async () => {
    const plain = "MismoTexto";
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2);
    // Pero ambos verifican correctamente.
    expect(await verifyPassword(plain, hash1)).toBe(true);
    expect(await verifyPassword(plain, hash2)).toBe(true);
  });

  it("verifyPassword devuelve false para hash vacío", async () => {
    const ok = await verifyPassword("algo", "");
    expect(ok).toBe(false);
  });
});
