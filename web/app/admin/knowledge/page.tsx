import KnowledgeAdminClient from "@/components/KnowledgeAdminClient";
import AccessRestricted from "@/components/AccessRestricted";
import { isAuthConfigured } from "@/auth";
import { requireStaff } from "@/lib/auth/session";

export const metadata = {
  title: "Base de Conocimiento | OrientApp",
};

// Lee STAFF_ACCESS_TOKEN / la sesión en tiempo de ejecución; nunca en el build.
export const dynamic = "force-dynamic";

export default async function KnowledgeAdminPage() {
  // Con OAuth configurado exige sesión de personal; sin OAuth se muestra igual
  // que antes (modo demo / build sin variables de entorno).
  if (isAuthConfigured()) {
    const guard = await requireStaff();
    if (!guard.ok) {
      return (
        <AccessRestricted
          redirectTo="/admin/knowledge"
          signedIn={Boolean(guard.user)}
        />
      );
    }
  }

  return (
    <main className="container container-wide">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Base de Conocimiento (RAG)</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Gestiona los libros, investigaciones científicas y artículos que
          fundamentan las respuestas del Asesor y del Tutor IA. Cada documento se
          fragmenta e indexa con embeddings para búsqueda semántica y citación.
        </p>
      </div>
      <KnowledgeAdminClient />
    </main>
  );
}
