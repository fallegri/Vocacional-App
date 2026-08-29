import CareersExplorer from "@/components/CareersExplorer";

export const metadata = {
  title: "Explorador de Carreras | OrientApp",
};

export default function CareersPage() {
  return (
    <main className="container container-wide">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Explorador de Carreras</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Conoce las 16 carreras del catálogo OrientApp: su área, descripción
          ocupacional, competencias clave y tendencias de futuro. Haz clic en
          una tarjeta para ver el detalle completo.
        </p>
      </div>
      <CareersExplorer />
    </main>
  );
}
