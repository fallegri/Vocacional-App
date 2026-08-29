import AdminClient from "@/components/AdminClient";

export const metadata = {
  title: "Administración | OrientApp",
};

export default function AdminPage() {
  return (
    <main className="container container-wide">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Administración de Grupos</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Crea grupos de encuesta y comparte el código QR que lleva al test
          vocacional asignado a cada grupo. Cada QR abre la evaluación con el
          código de cohorte ya aplicado.
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
      <AdminClient />
    </main>
  );
}
