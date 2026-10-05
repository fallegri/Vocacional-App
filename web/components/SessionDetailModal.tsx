"use client";

import { useEffect, useState } from "react";
import type { SessionSummary, SessionResponse } from "@/lib/sessions";
import { METHODS } from "@/lib/methods/registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuestionInfo = { text: string; dimension: string };

// ---------------------------------------------------------------------------
// Module-level lookups (pure data, no server deps — safe in client components)
// ---------------------------------------------------------------------------

/** Map<methodId, Map<questionId, QuestionInfo>> */
export const ALL_QUESTION_BANKS: Map<string, Map<number, QuestionInfo>> = (() => {
  const outer = new Map<string, Map<number, QuestionInfo>>();
  for (const mid of Object.keys(METHODS)) {
    const method = METHODS[mid as keyof typeof METHODS];
    const inner = new Map<number, QuestionInfo>();
    for (const q of method.questions) {
      inner.set(q.id, { text: q.text, dimension: q.dimension });
    }
    outer.set(mid, inner);
  }
  return outer;
})();

/** Map<methodId, Map<value, label>> */
export const ALL_SCALE_LABELS: Map<string, Map<number, string>> = (() => {
  const outer = new Map<string, Map<number, string>>();
  for (const mid of Object.keys(METHODS)) {
    const method = METHODS[mid as keyof typeof METHODS];
    const inner = new Map<number, string>();
    for (const opt of method.scale.options) {
      inner.set(opt.value, opt.label);
    }
    outer.set(mid, inner);
  }
  return outer;
})();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHOD_LABELS: Record<string, string> = {
  RIASEC: "RIASEC (Holland)",
  CHASIDE: "CHASIDE",
  TIPOV: "TIPOV",
  CIPR: "CIP-R",
  MAGDALENA: "Test Magdalena Contreras",
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function exportCsv(headers: string[], rows: string[][], filename: string): void {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateEs(ms: number | null): string {
  if (!ms) return "Sin fecha";
  try {
    return new Date(ms).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Sin fecha";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionDetailModal({
  session,
  onClose,
  staffToken,
}: {
  session: SessionSummary;
  onClose: () => void;
  staffToken?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<SessionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {};
    if (staffToken) headers["x-staff-token"] = staffToken;

    fetch(`/api/sessions/${encodeURIComponent(session.id)}/responses`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Error ${res.status}${text ? ": " + text : ""}`
          );
        }
        return res.json() as Promise<{ responses: SessionResponse[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setResponses(data.responses ?? []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las respuestas."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session.id, staffToken]);

  const handleExport = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const qBank = ALL_QUESTION_BANKS.get(session.methodId);
    const scaleLabels = ALL_SCALE_LABELS.get(session.methodId);

    exportCsv(
      [
        "Nº Pregunta",
        "Texto",
        "Dimensión",
        "Respuesta (valor)",
        "Respuesta (etiqueta)",
        "Tiempo (ms)",
      ],
      responses.map((r) => [
        String(r.questionId),
        qBank?.get(r.questionId)?.text ?? "Pregunta #" + r.questionId,
        r.dimensionCode,
        String(r.score),
        scaleLabels?.get(r.score) ?? String(r.score),
        String(r.timeSpentMs),
      ]),
      `reporte-respuestas-${session.id}-${dateStr}.csv`
    );
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const qBank = ALL_QUESTION_BANKS.get(session.methodId);
  const scaleLabels = ALL_SCALE_LABELS.get(session.methodId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de respuestas"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 16px",
        zIndex: 60,
        overflowY: "auto",
      }}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="card"
        style={{ maxWidth: 860, width: "100%", position: "relative" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            color: "var(--text-muted, #888)",
          }}
        >
          ×
        </button>

        {/* Header */}
        <h2 style={{ marginTop: 0, paddingRight: 32 }}>
          Respuestas de {session.studentName ?? "Estudiante OrientApp"}
        </h2>

        {/* Student info */}
        <div
          className="card card-muted"
          style={{ fontSize: 13, marginBottom: 16 }}
        >
          <div className="grid grid-2" style={{ gap: 8 }}>
            <div>
              <span className="muted">Nombre: </span>
              <strong>{session.studentName ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">Correo: </span>
              <strong>{session.studentEmail ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">Teléfono: </span>
              <strong>{session.studentPhone ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">Grupo: </span>
              <strong>{session.cohortCode ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">Método: </span>
              <strong>{METHOD_LABELS[session.methodId] ?? session.methodId}</strong>
            </div>
            <div>
              <span className="muted">Código dominante: </span>
              <strong>
                <span className="badge">{session.dominantCode || "—"}</span>
              </strong>
            </div>
            <div>
              <span className="muted">Fecha: </span>
              <strong>{formatDateEs(session.completedAt)}</strong>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <p className="muted" style={{ textAlign: "center", padding: "24px 0" }}>
            Cargando respuestas...
          </p>
        ) : error ? (
          <div className="alert alert-warning" role="alert">
            <strong>Error al cargar respuestas:</strong> {error}
          </div>
        ) : responses.length === 0 ? (
          <p className="muted">No se encontraron respuestas para esta sesión.</p>
        ) : (
          <>
            {/* Export button */}
            <div className="row" style={{ justifyContent: "flex-end", marginBottom: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExport}
              >
                Exportar respuestas CSV
              </button>
            </div>

            {/* Responses table */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    {["Nº", "Pregunta", "Dimensión", "Respuesta", "Tiempo (ms)"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "6px 8px",
                            borderBottom: "1px solid var(--border)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => {
                    const qText =
                      qBank?.get(r.questionId)?.text ??
                      "Pregunta #" + r.questionId;
                    const rLabel =
                      scaleLabels?.get(r.score) ?? String(r.score);
                    return (
                      <tr key={r.questionId}>
                        <td
                          style={{
                            padding: "6px 8px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.questionId}
                        </td>
                        <td style={{ padding: "6px 8px", maxWidth: 360 }}>
                          {qText}
                        </td>
                        <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                          <span className="badge">{r.dimensionCode}</span>
                        </td>
                        <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                          {r.score} — {rLabel}
                        </td>
                        <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                          {r.timeSpentMs} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
