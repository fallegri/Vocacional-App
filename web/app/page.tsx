import Link from "next/link";
import { DIMENSION_ORDER, DIMENSION_META } from "@/lib/riasec/types";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <span className="badge">Diagnóstico Vocacional RIASEC · Holland</span>
        <h1>
          Descubre tu vocación con <span>OrientApp</span>
        </h1>
        <p>
          Responde 60 reactivos científicos y obtén un perfil vocacional
          completo: tus 6 dimensiones RIASEC, tu código dominante y las carreras
          con mayor afinidad para tu futuro profesional.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/assessment" className="btn">
            Iniciar Evaluación
          </Link>
          <Link href="/careers" className="btn btn-secondary">
            Explorar Carreras
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Las 6 dimensiones del modelo RIASEC</h2>
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {DIMENSION_ORDER.map((code) => {
            const meta = DIMENSION_META[code];
            return (
              <article key={code} className="card">
                <div className="row">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: meta.color,
                      color: "#fff",
                      fontWeight: 800,
                    }}
                  >
                    {code}
                  </span>
                  <div>
                    <strong>{meta.title}</strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {meta.adjective}
                    </div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
                  {meta.shortDesc}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="grid grid-2">
          <article className="card">
            <h3>¿Cómo funciona?</h3>
            <ol className="muted" style={{ paddingLeft: 18, margin: 0 }}>
              <li>Ingresa (opcionalmente) el código de tu grupo o cohorte.</li>
              <li>Responde los 60 reactivos en una escala del 1 al 5.</li>
              <li>
                El motor psicométrico calcula tus puntajes y valida la
                confiabilidad de tus respuestas.
              </li>
              <li>
                Recibes tu radar hexagonal, perfil dominante y ranking de
                carreras afines.
              </li>
            </ol>
          </article>
          <article className="card">
            <h3>Para instituciones y orientadores</h3>
            <p className="muted">
              Crea grupos de encuesta con un código único y comparte un{" "}
              <strong>código QR</strong> que lleva directamente al test
              vocacional asignado a ese grupo. Ideal para colegios,
              universidades y gabinetes psicopedagógicos.
            </p>
            <Link href="/admin" className="btn btn-secondary">
              Ir a Administración
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
