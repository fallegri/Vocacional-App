// ===========================================================================
// Utilidades compartidas para los componentes de reportes.
//
// Este módulo es importado tanto por ReportsClient.tsx como por
// SessionDetailModal.tsx para evitar definiciones duplicadas y la
// dependencia circular que existía cuando SessionDetailModal exportaba datos
// y ReportsClient los reimportaba.
//
// Solo contiene código puro (sin dependencias de servidor): es seguro usarlo
// en componentes cliente ("use client").
// ===========================================================================

import { METHODS } from "@/lib/methods/registry";

// ---------------------------------------------------------------------------
// Etiquetas de métodos
// ---------------------------------------------------------------------------

export const METHOD_LABELS: Record<string, string> = {
  RIASEC: "RIASEC (Holland)",
  CHASIDE: "CHASIDE",
  TIPOV: "TIPOV",
  CIPR: "CIP-R",
  MAGDALENA: "Test Magdalena Contreras",
};

// ---------------------------------------------------------------------------
// Bancos de preguntas y etiquetas de escala
// ---------------------------------------------------------------------------

export type QuestionInfo = { text: string; dimension: string };

/** Map<methodId, Map<questionId, QuestionInfo>> construido una sola vez. */
export const ALL_QUESTION_BANKS: Map<string, Map<number, QuestionInfo>> =
  (() => {
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

/** Map<methodId, Map<value, label>> construido una sola vez. */
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
// Exportación CSV
// ---------------------------------------------------------------------------

export function exportCsv(
  headers: string[],
  rows: string[][],
  filename: string
): void {
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

// ---------------------------------------------------------------------------
// Formato de fecha
// ---------------------------------------------------------------------------

export function formatDateEs(ms: number | null): string {
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
