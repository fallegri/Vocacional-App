import Link from "next/link";
import RadarChart from "@/components/RadarChart";
import AiReportClient from "@/components/AiReportClient";
import AccessRestricted from "@/components/AccessRestricted";
import {
  loadSession,
  type StoredSession,
  type StoredMethodScores,
} from "@/lib/sessions";
import { authorizeSessionRead } from "@/lib/auth/read-access";
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

  // Autorización de lectura: en modo demo (sin OAuth) se preserva el acceso
  // abierto; con OAuth configurado, solo el dueño (por correo) o el personal
  // (staff) pueden ver los resultados.
  const readAuth = await authorizeSessionRead(session);
  if (!readAuth.ok) {
    // Un visitante con sesión que NO es dueño (ni personal) recibe el mensaje
    // específico de propiedad que ya produjo la guarda ("No tienes permisos
    // para ver los resultados de esta evaluación."), en lugar del texto genérico
    // orientado al área de administración. Un visitante sin sesión conserva el
    // texto por defecto con el botón de inicio de sesión.
    const isNonOwner = Boolean(readAuth.user);
    return (
      <AccessRestricted
        redirectTo={`/results/${sessionId}`}
        signedIn={isNonOwner}
        title={isNonOwner ? "Resultados no disponibles" : "Acceso restringido"}
        message={isNonOwner ? readAuth.error : undefined}
      />
    );
  }

  // ---------------------------------------------------------------------
  // Métodos distintos de RIASEC: vista de resultados genérica en español
  // construida a partir de method_scores (sin radar/carreras/AI RIASEC).
  // ---------------------------------------------------------------------
  if (session.methodId !== "RIASEC") {
    return (
      <GenericMethodResults session={session} sessionId={sessionId} />
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

      {/* Informe del Asesor IA (bajo demanda, fundamentado en la base de conocimiento) */}
      <div className="card" style={{ marginTop: 16 }}>
        <AiReportClient sessionId={session.id} initialAnalysis={session.aiAnalysis} />
        <div className="center" style={{ marginTop: 16 }}>
          <Link
            href={`/tutor?session=${encodeURIComponent(session.id)}`}
            className="btn btn-secondary"
          >
            Conversar con el Tutor IA
          </Link>
        </div>
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

/**
 * Vista de resultados genérica para métodos distintos de RIASEC (CHASIDE,
 * TIPOV). Se construye desde method_scores: barras por dimensión, áreas
 * dominantes e interpretación. Para CHASIDE muestra la comparación
 * Interés-vs-Aptitud usando los conteos crudos por área.
 */
function GenericMethodResults({
  session,
  sessionId,
}: {
  session: StoredSession;
  sessionId: string;
}) {
  const ms = session.methodScores;

  if (!ms || ms.dimensionScores.length === 0) {
    return (
      <main className="container">
        <div className="row spread" style={{ marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0 }}>Tu Perfil Vocacional</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Método: {session.methodId}
              {session.cohortCode ? ` · Grupo ${session.cohortCode}` : ""}
            </p>
          </div>
          <span className="badge" data-testid="method-badge">
            Método: {session.methodId}
          </span>
        </div>
        <div className="alert alert-warning" role="status">
          No hay puntajes por dimensión disponibles para esta evaluación.
        </div>
        <p style={{ marginTop: 16 }}>
          <Link href="/assessment" className="btn btn-secondary">
            Iniciar una nueva evaluación
          </Link>
        </p>
      </main>
    );
  }

  const isChaside = session.methodId === "CHASIDE";

  // CHASIDE guarda por área dos entradas (Interés y Aptitud) diferenciadas por
  // el sufijo del código (p. ej. "C-INTERES" / "C-APTITUD"). Si el motor usa
  // otra convención, se muestran igualmente todas las dimensiones como barras.
  const sorted = [...ms.dimensionScores].sort((a, b) => b.value - a.value);

  return (
    <main className="container">
      <div className="row spread" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Tu Perfil Vocacional</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {session.studentName
              ? `Resultados de ${session.studentName}`
              : `Resultados del test ${session.methodId}`}
            {session.cohortCode ? ` · Grupo ${session.cohortCode}` : ""}
          </p>
        </div>
        <span className="badge" data-testid="method-badge">
          Método: {session.methodId}
        </span>
      </div>

      {session.dominantCode ? (
        <div className="alert alert-ok" role="status">
          <strong>Áreas dominantes: {session.dominantCode}.</strong>{" "}
          {ms.dominantCodes.length > 0
            ? `Perfil destacado en: ${ms.dominantCodes.join(", ")}.`
            : ""}
        </div>
      ) : null}

      {/* Barras por dimensión */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Puntajes por dimensión</h2>
        <div className="stack">
          {sorted.map((dim) => {
            const value = Math.round(dim.value);
            return (
              <div key={dim.code}>
                <div className="row spread" style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>
                    <span>{dim.code}</span> · {dim.title}
                  </span>
                  <span className="muted">
                    {value}%
                    {typeof dim.raw === "number"
                      ? ` (${dim.raw} pts)`
                      : ""}
                  </span>
                </div>
                <div className="row">
                  <div className="dimension-bar-track">
                    <div
                      className="dimension-bar-fill"
                      style={{ width: `${value}%`, background: "#4F46E5" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isChaside ? (
        <ChasideInteresAptitud ms={ms} dimensionTitles={sorted} />
      ) : null}

      {/* Interpretación */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Interpretación</h2>
        <p style={{ marginBottom: 0 }}>
          {ms.interpretation || session.dominantSummary || "Sin interpretación disponible."}
        </p>
      </div>

      <div className="card center" style={{ marginTop: 16 }}>
        <Link
          href={`/tutor?session=${encodeURIComponent(sessionId)}`}
          className="btn btn-secondary"
        >
          Conversar con el Tutor IA
        </Link>
      </div>
    </main>
  );
}

/** Máximos por área del test CHASIDE (según su calificación). */
const CHASIDE_INTERES_MAX = 10;
const CHASIDE_APTITUD_MAX = 4;

/**
 * Extrae de forma defensiva los conteos crudos por área de Interés y Aptitud
 * guardados en `method_scores.raw` para CHASIDE. Devuelve null si el dato no
 * existe (filas antiguas) o no tiene la forma esperada.
 */
function parseChasideCounts(
  raw: Record<string, unknown> | null | undefined
): { interes: Record<string, number>; aptitud: Record<string, number> } | null {
  if (!raw || typeof raw !== "object") return null;
  const interes = raw.interes;
  const aptitud = raw.aptitud;
  const isCountMap = (v: unknown): v is Record<string, number> =>
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v as Record<string, unknown>).every(
      (n) => typeof n === "number"
    );
  if (!isCountMap(interes) || !isCountMap(aptitud)) return null;
  return { interes, aptitud };
}

/**
 * Panel "Interés vs. Aptitud" de CHASIDE. A diferencia de las barras
 * combinadas por dimensión, aquí se grafican POR SEPARADO el conteo de Interés
 * (máx. 10) y el de Aptitud (máx. 4) de cada área, que es la lectura propia del
 * instrumento. Si no hay conteos crudos disponibles (sesiones antiguas), se
 * muestra un aviso en lugar de repetir las barras combinadas.
 */
function ChasideInteresAptitud({
  ms,
  dimensionTitles,
}: {
  ms: StoredMethodScores;
  dimensionTitles: StoredMethodScores["dimensionScores"];
}) {
  const counts = parseChasideCounts(ms.raw);
  const titleByCode = new Map(
    dimensionTitles.map((d) => [d.code, d.title] as const)
  );

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Interés vs. Aptitud</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        CHASIDE evalúa por separado tus <strong>intereses</strong> (máx. 10 por
        área) y tus <strong>aptitudes</strong> (máx. 4 por área). Un perfil
        alineado muestra interés y aptitud altos en las mismas áreas.
      </p>

      {!counts ? (
        <div className="alert alert-warning" role="status">
          No hay conteos separados de interés y aptitud disponibles para esta
          evaluación.
        </div>
      ) : (
        <div className="stack">
          {[...dimensionTitles]
            .map((d) => ({
              code: d.code,
              title: titleByCode.get(d.code) ?? d.code,
              interes: counts.interes[d.code] ?? 0,
              aptitud: counts.aptitud[d.code] ?? 0,
            }))
            .sort((a, b) => b.interes - a.interes || b.aptitud - a.aptitud)
            .map((row) => {
              const interesPct = Math.round(
                (row.interes / CHASIDE_INTERES_MAX) * 100
              );
              const aptitudPct = Math.round(
                (row.aptitud / CHASIDE_APTITUD_MAX) * 100
              );
              return (
                <div key={`chaside-ia-${row.code}`}>
                  <div
                    className="row spread"
                    style={{ marginBottom: 4, fontWeight: 600 }}
                  >
                    <span>
                      {row.code} · {row.title}
                    </span>
                  </div>
                  {/* Interés */}
                  <div
                    className="row spread"
                    style={{ marginBottom: 2, fontSize: 13 }}
                  >
                    <span className="muted">Interés</span>
                    <span className="muted">
                      {row.interes}/{CHASIDE_INTERES_MAX}
                    </span>
                  </div>
                  <div className="row" style={{ marginBottom: 8 }}>
                    <div className="dimension-bar-track">
                      <div
                        className="dimension-bar-fill"
                        style={{ width: `${interesPct}%`, background: "#4F46E5" }}
                      />
                    </div>
                  </div>
                  {/* Aptitud */}
                  <div
                    className="row spread"
                    style={{ marginBottom: 2, fontSize: 13 }}
                  >
                    <span className="muted">Aptitud</span>
                    <span className="muted">
                      {row.aptitud}/{CHASIDE_APTITUD_MAX}
                    </span>
                  </div>
                  <div className="row">
                    <div className="dimension-bar-track">
                      <div
                        className="dimension-bar-fill"
                        style={{ width: `${aptitudPct}%`, background: "#16A34A" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
