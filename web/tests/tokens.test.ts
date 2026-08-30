import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ===========================================================================
// Tests del ciclo de vida de tokens de verificación (lib/auth/tokens.ts).
//
// Se mockea lib/db para no necesitar una base de datos real. Las pruebas
// verifican:
//   1. Que createVerificationToken inserta un token con los campos correctos.
//   2. Que consumeVerificationToken permite consumir un token válido una sola vez.
//   3. Que un token ya consumido no puede usarse de nuevo.
//   4. Que un token expirado es rechazado.
// ===========================================================================

// Almacén en memoria para simular la base de datos.
let db: Map<string, {
  token: string;
  email: string;
  purpose: string;
  created_at: number;
  expires_at: number;
  consumed_at: number | null;
}> = new Map();

vi.mock("@/lib/db", () => ({
  query: vi.fn(async (sql: string, params: unknown[]) => {
    const s = sql.trim().toUpperCase();

    if (s.startsWith("INSERT INTO EMAIL_VERIFICATION_TOKENS")) {
      const [token, email, createdAt, expiresAt] = params as [
        string, string, number, number
      ];
      db.set(token, {
        token,
        email,
        purpose: "VERIFY_EMAIL",
        created_at: createdAt,
        expires_at: expiresAt,
        consumed_at: null,
      });
      return [];
    }

    if (s.startsWith("SELECT EMAIL, EXPIRES_AT, CONSUMED_AT")) {
      const [token] = params as [string];
      const row = db.get(token);
      if (!row) return [];
      return [{
        email: row.email,
        expires_at: row.expires_at,
        consumed_at: row.consumed_at,
      }];
    }

    if (s.startsWith("UPDATE EMAIL_VERIFICATION_TOKENS")) {
      const [consumedAt, token] = params as [number, string];
      const row = db.get(token);
      if (row) {
        db.set(token, { ...row, consumed_at: consumedAt });
      }
      return [];
    }

    return [];
  }),
}));

import {
  generateVerificationToken,
  createVerificationToken,
  consumeVerificationToken,
} from "@/lib/auth/tokens";

beforeEach(() => {
  db = new Map();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateVerificationToken", () => {
  it("devuelve un string no vacío con formato UUID", () => {
    const token = generateVerificationToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    // UUID v4 tiene exactamente 36 caracteres con guiones.
    expect(token).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("dos llamadas consecutivas generan tokens distintos", () => {
    expect(generateVerificationToken()).not.toBe(generateVerificationToken());
  });
});

describe("createVerificationToken", () => {
  it("crea un token en la base de datos para el correo dado", async () => {
    const token = await createVerificationToken("test@example.com");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    const row = db.get(token);
    expect(row).toBeDefined();
    expect(row?.email).toBe("test@example.com");
    expect(row?.purpose).toBe("VERIFY_EMAIL");
    expect(row?.consumed_at).toBeNull();
    expect(row?.expires_at).toBeGreaterThan(row?.created_at ?? 0);
  });

  it("normaliza el correo a minúsculas", async () => {
    const token = await createVerificationToken("USUARIO@CORREO.COM");
    const row = db.get(token);
    expect(row?.email).toBe("usuario@correo.com");
  });
});

describe("consumeVerificationToken", () => {
  it("consume un token válido y devuelve el correo", async () => {
    const token = await createVerificationToken("usuario@example.com");
    const email = await consumeVerificationToken(token);
    expect(email).toBe("usuario@example.com");
  });

  it("marca el token como consumido tras el primer uso", async () => {
    const token = await createVerificationToken("usuario@example.com");
    await consumeVerificationToken(token);

    const row = db.get(token);
    expect(row?.consumed_at).not.toBeNull();
  });

  it("rechaza un segundo intento de consumir el mismo token", async () => {
    const token = await createVerificationToken("usuario@example.com");
    await consumeVerificationToken(token); // Primera vez: ok.
    const second = await consumeVerificationToken(token); // Segunda vez: nulo.
    expect(second).toBeNull();
  });

  it("rechaza un token expirado", async () => {
    const token = generateVerificationToken();
    // Insertar manualmente un token ya expirado.
    const now = Date.now();
    db.set(token, {
      token,
      email: "expirado@example.com",
      purpose: "VERIFY_EMAIL",
      created_at: now - 48 * 60 * 60 * 1000,
      expires_at: now - 1, // expirado hace 1 ms
      consumed_at: null,
    });

    const email = await consumeVerificationToken(token);
    expect(email).toBeNull();
  });

  it("devuelve null para un token inexistente", async () => {
    const email = await consumeVerificationToken("token-que-no-existe");
    expect(email).toBeNull();
  });

  it("devuelve null para token vacío", async () => {
    const email = await consumeVerificationToken("");
    expect(email).toBeNull();
  });
});
