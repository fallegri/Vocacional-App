import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// ===========================================================================
// Pruebas de CABLEADO (integración a nivel de ruta) de la autorización de
// LECTURA. A diferencia de read-access.test.ts (que prueba authorizeSessionRead
// en aislamiento), estas pruebas invocan los handlers/página REALES y verifican
// que cada superficie protegida RECHAZA a un llamador no-dueño / anónimo. Su
// objetivo es fallar en CI si alguien elimina una llamada a la guarda de una
// ruta concreta (regresión que las pruebas unitarias de la política no detectan).
//
// Estrategia de mocks (misma que auth-roles/read-access):
//  - Mock mínimo de "next-auth", "next-auth/providers/google" y
//    "@/lib/auth/link-user" para poder importar @/auth sin arrastrar el runtime
//    de NextAuth al entorno node de Vitest.
//  - Mock de getCurrentUser (@/lib/auth/session) para inyectar el usuario. El
//    resto de @/lib/auth/session (y la lógica REAL de authorizeSessionRead,
//    isStaffRole, isAuthConfigured leyendo env) permanece real: si se quita una
//    guarda, la prueba correspondiente falla.
//  - Mock de @/lib/sessions (loadSession) y @/lib/knowledge/ingest
//    (listDocuments) para no tocar la base de datos.
//  - NO se mockean las guardas de autorización: son el objeto bajo prueba.
// ===========================================================================

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: {},
    auth: () => null,
    signIn: () => {},
    signOut: () => {},
  }),
}));
vi.mock("next-auth/providers/google", () => ({ default: () => ({}) }));
vi.mock("@/lib/auth/link-user", () => ({ linkOrCreateUser: async () => {} }));

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

// Sesión de evaluación de ejemplo cuyo dueño es otro estudiante.
const OTHER_OWNER_SESSION = {
  id: "sess-1",
  startedAt: 1,
  completedAt: 2,
  isValid: true,
  reliabilityLevel: "Alta",
  scores: { r: 50, i: 50, a: 50, s: 50, e: 50, c: 50 },
  dominantCode: "RIA",
  dominantSummary: "Resumen",
  warningMessage: null,
  topCareerTitle: null,
  topCareerAffinity: null,
  aiAnalysis: null,
  cohortCode: null,
  studentName: "Otro Alumno",
  studentEmail: "dueno@x.com",
  reviewStatus: "PENDING",
};

let loadSessionImpl: (id: string) => Promise<unknown> = async () =>
  OTHER_OWNER_SESSION;
vi.mock("@/lib/sessions", () => ({
  loadSession: (id: string) => loadSessionImpl(id),
}));

vi.mock("@/lib/knowledge/ingest", () => ({
  listDocuments: async () => [{ id: 1, title: "Doc secreto" }],
  KNOWLEDGE_SOURCE_TYPES: { BOOK: "Libro", RESEARCH: "Inv.", ARTICLE: "Art." },
  ingestDocument: async () => ({ ok: true }),
}));

// La IA se considera configurada para que el chat/report avancen hasta la
// guarda de lectura (si no, /api/ai/chat corta antes con 503 por falta de IA).
vi.mock("@/lib/ai/config", () => ({
  resolveAiConfig: async () => ({
    baseUrl: "https://ai",
    apiKey: "k",
    model: "m",
  }),
  isConfigured: () => true,
  EMBEDDING_DIMENSION: 1536,
}));

import { POST as reportPost } from "@/app/api/ai/report/route";
import { POST as chatPost } from "@/app/api/ai/chat/route";
import { GET as knowledgeGet } from "@/app/api/knowledge/route";
import ResultsPage from "@/app/results/[sessionId]/page";
import AccessRestricted from "@/components/AccessRestricted";

const ENV_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "STAFF_ACCESS_TOKEN",
] as const;

const ORIGINAL: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) ORIGINAL[k] = process.env[k];

function configureOAuth() {
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.AUTH_SECRET = "test-auth-secret";
}

function jsonRequest(body: unknown): Request {
  return new Request("https://x/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  currentUser = null;
  loadSessionImpl = async () => OTHER_OWNER_SESSION;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL[k];
  }
});

// ===========================================================================
// POST /api/ai/report
// ===========================================================================
describe("POST /api/ai/report (cableado de la guarda de lectura)", () => {
  it("rechaza con 403 a un estudiante que no es dueño de la sesión", async () => {
    configureOAuth();
    currentUser = { email: "intruso@x.com", role: "STUDENT" };
    const res = await reportPost(jsonRequest({ sessionId: "sess-1" }));
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBeTruthy();
  });

  it("rechaza con 403 a un usuario anónimo (OAuth configurado)", async () => {
    configureOAuth();
    currentUser = null;
    const res = await reportPost(jsonRequest({ sessionId: "sess-1" }));
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// POST /api/ai/chat
// ===========================================================================
describe("POST /api/ai/chat (cableado de la guarda de lectura)", () => {
  it("rechaza con 403 a un estudiante que no es dueño cuando adjunta sessionId", async () => {
    configureOAuth();
    currentUser = { email: "intruso@x.com", role: "STUDENT" };
    const res = await chatPost(
      jsonRequest({ message: "Hola", sessionId: "sess-1" })
    );
    expect(res.status).toBe(403);
  });

  it("devuelve 500 (no degrada en silencio) si loadSession falla al cargar", async () => {
    configureOAuth();
    currentUser = { email: "dueno@x.com", role: "STUDENT" };
    loadSessionImpl = async () => {
      throw new Error("fallo de base de datos");
    };
    const res = await chatPost(
      jsonRequest({ message: "Hola", sessionId: "sess-1" })
    );
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/knowledge
// ===========================================================================
describe("GET /api/knowledge (cableado de la guarda de personal)", () => {
  it("rechaza con 403 a un estudiante (rol no staff)", async () => {
    configureOAuth();
    currentUser = { email: "alumno@x.com", role: "STUDENT" };
    const res = await knowledgeGet(new Request("https://x/api/knowledge"));
    expect(res.status).toBe(403);
  });

  it("rechaza con 403 a un usuario anónimo (OAuth configurado)", async () => {
    configureOAuth();
    currentUser = null;
    const res = await knowledgeGet(new Request("https://x/api/knowledge"));
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// Página de resultados (server component)
// ===========================================================================
describe("Página /results/[sessionId] (cableado de la guarda de lectura)", () => {
  it("renderiza <AccessRestricted> para un estudiante que no es dueño", async () => {
    configureOAuth();
    currentUser = { email: "intruso@x.com", role: "STUDENT" };
    const element = await ResultsPage({
      params: Promise.resolve({ sessionId: "sess-1" }),
    });
    // El nodo devuelto debe ser el componente de acceso restringido, no el
    // perfil vocacional. Si se quita la guarda, la página mostraría el perfil.
    expect((element as { type?: unknown }).type).toBe(AccessRestricted);
    const props = (element as { props: { signedIn?: boolean; message?: string } })
      .props;
    expect(props.signedIn).toBe(true);
    expect(props.message).toBeTruthy();
  });
});
