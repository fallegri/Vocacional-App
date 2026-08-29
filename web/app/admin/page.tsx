import AdminClient from "@/components/AdminClient";
import AccessRestricted from "@/components/AccessRestricted";
import { listCohorts } from "@/lib/actions/cohorts";
import { listSessions } from "@/lib/sessions";
import { isAuthConfigured } from "@/auth";
import { requireStaff } from "@/lib/auth/session";

// Fuerza el renderizado dinámico: los datos de Neon se leen solo en tiempo de
// ejecución, nunca durante `next build`. Las funciones de carga están además
// protegidas para devolver datos semilla / vacíos si no hay DATABASE_URL.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Administración | OrientApp",
};

export default async function AdminPage() {
  // Con OAuth configurado, exige una sesión de personal (staff). En modo demo
  // (sin OAuth) se preserva el comportamiento previo: la página se renderiza.
  const authConfigured = isAuthConfigured();
  let currentUser: { email: string; role: import("@/lib/riasec/types").UserRoleCode } | null =
    null;
  if (authConfigured) {
    const guard = await requireStaff();
    if (!guard.ok) {
      return <AccessRestricted redirectTo="/admin" signedIn={Boolean(guard.user)} />;
    }
    currentUser = { email: guard.user!.email, role: guard.user!.role };
  }

  const [cohorts, sessions] = await Promise.all([
    listCohorts(),
    listSessions(),
  ]);

  return (
    <main className="container container-wide">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Panel de Administración</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Audita evaluaciones, gestiona grupos de encuesta con sus códigos QR y
          consulta el directorio de usuarios. Cada QR abre el test vocacional
          con el código de cohorte ya aplicado.
        </p>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <a className="btn btn-secondary" href="/admin/knowledge">
            Base de Conocimiento (RAG)
          </a>
          <a className="btn btn-secondary" href="/admin/ai-settings">
            Ajustes de IA
          </a>
        </div>
      </div>
      <AdminClient
        initialCohorts={cohorts}
        initialSessions={sessions}
        currentUser={currentUser}
      />
    </main>
  );
}
