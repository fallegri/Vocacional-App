import AiSettingsClient from "@/components/AiSettingsClient";
import AccessRestricted from "@/components/AccessRestricted";
import { getAiConfigView } from "@/lib/actions/ai-config";
import { isAuthConfigured } from "@/auth";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "Ajustes de IA | OrientApp",
};

// Lee la configuración (env y/o ai_config) en tiempo de ejecución.
export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  // Con OAuth configurado exige SUPER_ADMIN o TEST_ADMIN (misma regla que
  // saveAiConfig). Sin OAuth se preserva el comportamiento previo (modo demo).
  if (isAuthConfigured()) {
    const guard = await requireRole(["SUPER_ADMIN", "TEST_ADMIN"]);
    if (!guard.ok) {
      return (
        <AccessRestricted
          redirectTo="/admin/ai-settings"
          signedIn={Boolean(guard.user)}
        />
      );
    }
  }

  const initial = await getAiConfigView();

  return (
    <main className="container">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Ajustes de IA</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Configura el proveedor compatible con la API de OpenAI que impulsa el
          Asesor y el Tutor IA. Estado actual:{" "}
          <strong>{initial.configured ? "Configurado" : "Sin configurar"}</strong>.
        </p>
      </div>
      <AiSettingsClient initial={initial} />
    </main>
  );
}
