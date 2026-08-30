import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// ===========================================================================
// Pruebas de CABLEADO (integración a nivel de ruta) de la autorización de
// LECTURA. A diferencia de read-access.test.ts (que prueba authorizeSessionRead
// en aislamiento), estas pruebas invocan la página REAL de resultados y
// verifican que rechaza a un llamador no-dueño / anónimo. Su objetivo es fallar
// en CI si alguien elimina la llamada a la guarda de esa superficie protegida
// (regresión que las pruebas unitarias de la política no detectan).
//
// Estrategia de mocks (misma que auth-roles/read-access):
//  - Mock mínimo de "next-auth", "next-auth/providers/google" y
//    "@/lib/auth/link-user" para poder importar @/auth sin arrastrar el runtime
//    de NextAuth al entorno node de Vitest.
//  - Mock de getCurrentUser (@/lib/auth/session) para inyectar el usuario. El
//    resto de @/lib/auth/session (y la lógica REAL de authorizeSessionRead,
//    isStaffRole, isAuthConfigured leyendo env) permanece real: si se quita una
//    guarda, la prueba correspondiente falla.
//  - Mock de @/lib/sessions (loadSession) para no tocar la base de datos.
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

import ResultsPage from "@/app/results/[sessionId]/page";
import AccessRestricted from "@/components/AccessRestricted";

const ENV_KEYS = [
  "AUTH_SECRET",
  "STAFF_ACCESS_TOKEN",
] as const;

const ORIGINAL: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) ORIGINAL[k] = process.env[k];

function configureOAuth() {
  process.env.AUTH_SECRET = "test-auth-secret";
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
