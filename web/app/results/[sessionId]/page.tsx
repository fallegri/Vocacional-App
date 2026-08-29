import Link from "next/link";
import RadarChart from "@/components/RadarChart";
import { loadSession } from "@/lib/sessions";
import { matchCareers } from "@/lib/riasec/engine";
import { CAREERS } from "@/data/seed";
import {
  DIMENSION_ORDER,
  DIMENSION_META,
  type DimensionCode,
  type PsychometricScores,
} from "@/lib/riasec/types";

// Solo renderizado dinámico: la sesión se lee de Neon en tiempo de ejecución.
export const dynamic = "force-dynamic";

function dimScore(scores: PsychometricScores, code: DimensionCode): number {
  switch (code) {
    case "R":
      return scores.r;
    case "I":
      return scores.i;
    case "A":
      return scores.a;
    case "S":
      return scores.s;
    case "E":
      return scores.e;
    case "C":
      return scores.c;
  }
}

function reliabilityClass(level: string): string {
  if (level === "Alta") return "alert alert-ok";
  if (level === "Moderada") return "alert alert-warning";
  return "alert alert-danger";
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  let session = null;
  let loadError: string | null = null;
  try {
    session = await loadSession(sessionId);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "No se pudo cargar la sesión.";
  }

  if (loadError) {
    return (
      <main className="container">
        <div className="alert alert-danger" role="alert">
          {loadError}
        </div>
        <p style={{ marginTop: 16 }}>
          <Link href="/assessment" className="btn btn-secondary">
            Volver a la evaluación
          </Link>
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="container">
        <div className="card center">
          <h1>Sesión no encontrada</h1>
          <p className="muted">
            No existe una evaluación con el identificador solicitado.
          </p>
          <Link href="/assessment" className="btn">
            Iniciar una nueva evaluación
          </Link>
        </div>
      </main>
    );
  }

  const matches = matchCareers(session.scores, CAREERS);

  return (
    <main className="container">
      <div className="row spread" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Tu Perfil Vocacional</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {session.studentName
              ? `Resultados de ${session.studentName}`
              : "Resultados del diagnóstico RIASEC"}
            {session.cohortCode ? ` · Grupo ${session.cohortCode}` : ""}
          </p>
        </div>
        <span className="badge">Código dominante: {session.dominantCode}</span>
      </div>

      {/* Confiabilidad y advertencia */}
      <div className={reliabilityClass(session.reliabilityLevel)} role="status">
        <strong>Confiabilidad: {session.reliabilityLevel}.</strong>{" "}
        {session.warningMessage
          ? session.warningMessage
          : "Las respuestas presentan una consistencia adecuada para el diagnóstico."}
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        {/* Radar */}
        <div className="card center">
          <h2 style={{ marginTop: 0 }}>Radar RIASEC</h2>
          <RadarChart scores={session.scores} />
        </div>

        {/* Dimensiones */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Dimensiones</h2>
          <div className="stack">
            {DIMENSION_ORDER.map((code) => {
              const meta = DIMENSION_META[code];
              const value = Math.round(dimScore(session!.scores, code));
              return (
                <div key={code}>
                  <div className="row spread" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>
                      <span style={{ color: meta.color }}>{code}</span> ·{" "}
                      {meta.title}
                    </span>
                    <span className="muted">{value}%</span>
                  </div>
                  <div className="row">
                    <div className="dimension-bar-track">
                      <div
                        className="dimension-bar-fill"
                        style={{
                          width: `${value}%`,
                          background: meta.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Perfil dominante */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Perfil dominante</h2>
        <p style={{ marginBottom: 0 }}>{session.dominantSummary}</p>
      </div>

      {/* Ranking de carreras */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Carreras con mayor afinidad</h2>
        <div className="stack">
          {matches.map((m) => (
            <div
              key={m.career.id}
              className="card card-muted"
              style={{ padding: 14 }}
            >
              <div className="row spread">
                <div>
                  <strong>{m.career.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {m.career.areaName}
                  </div>
                </div>
                <div className="center">
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {Math.round(m.affinityPercentage)}%
                  </div>
                  <span className="badge">{m.matchLevel}</span>
                </div>
              </div>
              <div className="progress-track" style={{ marginTop: 10 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round(m.affinityPercentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="center" style={{ marginTop: 16 }}>
          <Link href="/careers" className="btn btn-secondary">
            Explorar todas las carreras
          </Link>
        </div>
      </div>
    </main>
  );
}
