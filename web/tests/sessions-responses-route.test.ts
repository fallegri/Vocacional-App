import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ===========================================================================
// Pruebas de CABLEADO para GET /api/sessions/[id]/responses.
//
// Estrategia de mocks (coherente con read-access-routes.test.ts):
//  - Mock mínimo de "next-auth" para poder importar @/auth.
//  - Mock de getCurrentUser para inyectar el usuario autenticado.
//  - Mock de loadSessionResponses para no tocar la base de datos.
//  - NO se mockea authorizeStaffRequest: es la guarda bajo prueba.
//
// Se verifica:
//  (1) 403 cuando no hay token y la autenticación por credenciales no está
//      configurada y STAFF_ACCESS_TOKEN está definido.
//  (2) 200 con la forma correcta { responses } cuando el token es válido.
//  (3) 500 cuando loadSessionResponses lanza una excepción de BD.
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

// Respuestas de ejemplo devueltas por la función de sesión.
const SAMPLE_RESPONSES = [
  {
    questionId: 1,
    dimensionCode: "R",
    score: 3,
    timeSpentMs: 2000,
    answeredAt: 1700000000000,
  },
];

let loadResponsesImpl: (id: string) => Promise<typeof SAMPLE_RESPONSES> = async () =>
  SAMPLE_RESPONSES;
vi.mock("@/lib/sessions", () => ({
  loadSession: vi.fn(),
  loadSessionResponses: (id: string) => loadResponsesImpl(id),
}));

import { GET } from "@/app/api/sessions/[id]/responses/route";

const ENV_KEYS = ["AUTH_SECRET", "STAFF_ACCESS_TOKEN"] as const;
const ORIGINAL: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) ORIGINAL[k] = process.env[k];

function makeRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers["x-staff-token"] = token;
  return new Request("http://localhost/api/sessions/sess-1/responses", {
    headers,
  });
}

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  currentUser = null;
  loadResponsesImpl = async () => SAMPLE_RESPONSES;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL[k];
  }
});

describe("GET /api/sessions/[id]/responses", () => {
  it("(1) devuelve 403 cuando el token es inválido y STAFF_ACCESS_TOKEN está configurado", async () => {
    // Sin AUTH_SECRET → fallback por token; con STAFF_ACCESS_TOKEN definido
    // se exige el token correcto.
    process.env.STAFF_ACCESS_TOKEN = "token-correcto";

    const response = await GET(makeRequest("token-incorrecto"), {
      params: Promise.resolve({ id: "sess-1" }),
    });

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  it("(2) devuelve 200 con { responses } cuando el token es válido", async () => {
    process.env.STAFF_ACCESS_TOKEN = "token-correcto";

    const response = await GET(makeRequest("token-correcto"), {
      params: Promise.resolve({ id: "sess-1" }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { responses?: unknown[] };
    expect(Array.isArray(body.responses)).toBe(true);
    expect(body.responses).toHaveLength(1);
    expect((body.responses as typeof SAMPLE_RESPONSES)[0].questionId).toBe(1);
  });

  it("(3) devuelve 500 cuando loadSessionResponses lanza una excepción de BD", async () => {
    process.env.STAFF_ACCESS_TOKEN = "token-correcto";
    loadResponsesImpl = async () => {
      throw new Error("connection refused");
    };

    const response = await GET(makeRequest("token-correcto"), {
      params: Promise.resolve({ id: "sess-1" }),
    });

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("connection refused");
  });

  it("(4) devuelve 200 en modo demo (sin STAFF_ACCESS_TOKEN y sin AUTH_SECRET)", async () => {
    // Sin token configurado ni auth → modo demo: cualquier petición permitida.
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ id: "sess-1" }),
    });

    expect(response.status).toBe(200);
  });
});
