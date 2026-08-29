import KnowledgeAdminClient from "@/components/KnowledgeAdminClient";
import { isStaffAuthEnabled } from "@/lib/auth/staff";

export const metadata = {
  title: "Base de Conocimiento | OrientApp",
};

// Lee STAFF_ACCESS_TOKEN en tiempo de ejecución para decidir si mostrar el campo
// de token; nunca se evalúa durante el build.
export const dynamic = "force-dynamic";

export default function KnowledgeAdminPage() {
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
      <KnowledgeAdminClient staffAuthEnabled={isStaffAuthEnabled()} />
    </main>
  );
}
