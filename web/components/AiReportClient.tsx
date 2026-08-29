"use client";

import { useState } from "react";

interface Props {
  sessionId: string;
  initialAnalysis?: string | null;
}

export default function AiReportClient({ sessionId, initialAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(
    initialAnalysis ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grounded, setGrounded] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as {
        analysis?: string;
        error?: string;
        grounded?: boolean;
      };
      if (!res.ok || !data.analysis) {
        setError(data.error ?? "No se pudo generar el informe.");
      } else {
        setAnalysis(data.analysis);
        setGrounded(Boolean(data.grounded));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="row spread" style={{ alignItems: "center" }}>
        <h2 style={{ marginTop: 0 }}>Informe del Asesor IA</h2>
        <button className="btn" onClick={() => void generate()} disabled={loading}>
          {loading
            ? "Generando…"
            : analysis
              ? "Regenerar informe"
              : "Generar informe con IA"}
        </button>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Diagnóstico vocacional profesional generado por IA y fundamentado en la
        base de conocimiento (libros e investigaciones) cuando hay fuentes
        relevantes.
      </p>

      {error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : null}

      {analysis ? (
        <>
          {grounded ? (
            <div className="badge" style={{ marginBottom: 8 }}>
              Fundamentado en fuentes de conocimiento
            </div>
          ) : null}
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{analysis}</div>
        </>
      ) : (
        <p className="muted">
          Aún no se ha generado el informe. Pulsa el botón para crearlo.
        </p>
      )}
    </div>
  );
}
