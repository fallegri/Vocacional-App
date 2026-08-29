import AdminClient from "@/components/AdminClient";
import { listCohorts } from "@/lib/actions/cohorts";
import { listSessions } from "@/lib/sessions";
import { isStaffAuthEnabled } from "@/lib/auth/staff";

// Fuerza el renderizado dinámico: los datos de Neon se leen solo en tiempo de
// ejecución, nunca durante `next build`. Las funciones de carga están además
// protegidas para devolver datos semilla / vacíos si no hay DATABASE_URL.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Administración | OrientApp",
};

export default async function AdminPage() {
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
        staffAuthEnabled={isStaffAuthEnabled()}
      />
    </main>
  );
}
