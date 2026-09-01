"use client";

import { useMemo, useState } from "react";
import type { SessionSummary } from "@/lib/sessions";
import {
  REVIEW_STATUS,
  type CohortGroup,
  type ReviewStatusCode,
} from "@/lib/riasec/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportTab =
  | "dashboard"
  | "usuario"
  | "area"
  | "grupo"
  | "fecha"
  | "carrera"
  | "metodo";

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

const ALL_METHODS = ["RIASEC", "CHASIDE", "TIPOV", "CIPR", "MAGDALENA"] as const;

const RIASEC_LABELS: Record<string, string> = {
  R: "Realista",
  I: "Investigador",
  A: "Artístico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

const CHASIDE_LABELS: Record<string, string> = {
  C: "Ciencias Biológicas",
  H: "Humanístico-Social",
  A: "Arte",
  S: "Servicios Sociales",
  I: "Intereses Gerenciales",
  D: "Defensa y Seguridad",
  E: "Económico-Empresarial",
};

// ---------------------------------------------------------------------------
// Helpers
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

function reviewLabel(status: string | null): string {
  if (!status) return REVIEW_STATUS.PENDING.displayName;
  return REVIEW_STATUS[status as ReviewStatusCode]?.displayName ?? status;
}

/** Horizontal CSS bar row: label | bar | value */
function CssBar({
  label,
  value,
  max,
  color,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          minWidth: 180,
          fontSize: 13,
          textAlign: "right",
          color: "var(--text-muted, #888)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          background: "var(--border, #e5e7eb)",
          borderRadius: 4,
          height: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color ?? "var(--accent, #2563eb)",
            borderRadius: 4,
            transition: "width 0.3s",
          }}
        />
      </div>
      <span style={{ minWidth: 50, fontSize: 13, fontWeight: 600 }}>
        {value}
        {suffix ? ` ${suffix}` : ""}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReportsClient({
  sessions,
  cohorts,
}: {
  sessions: SessionSummary[];
  cohorts: CohortGroup[];
}) {
  const [activeTab, setActiveTab] = useState<ReportTab>("dashboard");

  const lastUpdated = useMemo(() => new Date(), []);

  const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    { id: "usuario", label: "Por Usuario" },
    { id: "area", label: "Por Área" },
    { id: "grupo", label: "Por Grupo" },
    { id: "fecha", label: "Por Fecha" },
    { id: "carrera", label: "Por Carrera" },
    { id: "metodo", label: "Por Método" },
  ];

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Última actualización */}
      <div className="alert alert-warning" role="note" style={{ fontSize: 13 }}>
        Última actualización:{" "}
        {lastUpdated.toLocaleString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        . Los datos se cargan al abrir el panel. Recarga la página para
        obtener información actualizada.
      </div>

      {/* Sub-tab nav */}
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={activeTab === t.id ? "btn" : "btn btn-secondary"}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <DashboardTab sessions={sessions} cohorts={cohorts} />
      )}
      {activeTab === "usuario" && <UsuarioTab sessions={sessions} />}
      {activeTab === "area" && <AreaTab sessions={sessions} />}
      {activeTab === "grupo" && (
        <GrupoTab sessions={sessions} cohorts={cohorts} />
      )}
      {activeTab === "fecha" && <FechaTab sessions={sessions} />}
      {activeTab === "carrera" && <CarreraTab sessions={sessions} />}
      {activeTab === "metodo" && <MetodoTab sessions={sessions} />}
    </div>
  );
}

// ===========================================================================
// Dashboard tab
// ===========================================================================

function DashboardTab({
  sessions,
  cohorts,
}: {
  sessions: SessionSummary[];
  cohorts: CohortGroup[];
}) {
  const now = useMemo(() => Date.now(), []);

  const stats = useMemo(() => {
    const week = now - 7 * 24 * 60 * 60 * 1000;
    const month = now - 30 * 24 * 60 * 60 * 1000;
    const thisWeek = sessions.filter(
      (s) => s.completedAt != null && s.completedAt >= week
    ).length;
    const thisMonth = sessions.filter(
      (s) => s.completedAt != null && s.completedAt >= month
    ).length;
    const validCount = sessions.filter((s) => s.isValid).length;
    const fiabilidad =
      sessions.length > 0
        ? Math.round((validCount / sessions.length) * 100)
        : 0;
    return { total: sessions.length, thisWeek, thisMonth, fiabilidad };
  }, [sessions, now]);

  const codeDistribution = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const s of sessions) {
      if (s.dominantCode) {
        freq[s.dominantCode] = (freq[s.dominantCode] ?? 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [sessions]);

  const riasecAvgs = useMemo(() => {
    const rs = sessions.filter((s) => s.methodId === "RIASEC");
    if (rs.length === 0) return null;
    const sum = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };
    for (const s of rs) {
      sum.r += s.scores.r;
      sum.i += s.scores.i;
      sum.a += s.scores.a;
      sum.s += s.scores.s;
      sum.e += s.scores.e;
      sum.c += s.scores.c;
    }
    const n = rs.length;
    return {
      R: Math.round(sum.r / n),
      I: Math.round(sum.i / n),
      A: Math.round(sum.a / n),
      S: Math.round(sum.s / n),
      E: Math.round(sum.e / n),
      C: Math.round(sum.c / n),
    };
  }, [sessions]);

  const groupComparison = useMemo(() => {
    // Build a set of cohort codes that appear in sessions
    const cohortCodes = new Set(
      sessions.map((s) => s.cohortCode ?? "SIN GRUPO")
    );
    return Array.from(cohortCodes).map((cc) => {
      const group = sessions.filter(
        (s) => (s.cohortCode ?? "SIN GRUPO") === cc
      );
      // Most frequent dominant code
      const codeFreq: Record<string, number> = {};
      for (const s of group) {
        if (s.dominantCode)
          codeFreq[s.dominantCode] = (codeFreq[s.dominantCode] ?? 0) + 1;
      }
      const topCode =
        Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      // Most frequent career (RIASEC only)
      const careerFreq: Record<string, number> = {};
      for (const s of group.filter((s) => s.methodId === "RIASEC")) {
        const c = s.topCareerTitle ?? "(sin carrera)";
        careerFreq[c] = (careerFreq[c] ?? 0) + 1;
      }
      const topCareer =
        Object.entries(careerFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      // Find cohort title
      const cohortMeta = cohorts.find((c) => c.code === cc);
      const label = cohortMeta
        ? `${cohortMeta.title} (${cc})`
        : cc;
      return { cc, label, count: group.length, topCode, topCareer };
    });
  }, [sessions, cohorts]);

  const maxCode = codeDistribution[0]?.[1] ?? 1;

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Print button */}
      <div className="row spread" style={{ alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Dashboard de Reportes</h2>
        {/* @media print styles can be added to globals.css for a clean PDF output */}
        <button
          type="button"
          className="btn"
          onClick={() => window.print()}
        >
          Imprimir / Guardar como PDF
        </button>
      </div>

      {/* 4 summary stat cards */}
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div className="card card-muted center">
          <div className="muted" style={{ fontSize: 12 }}>
            Total Evaluaciones
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div className="card card-muted center">
          <div className="muted" style={{ fontSize: 12 }}>
            Esta Semana
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--accent-strong)",
            }}
          >
            {stats.thisWeek}
          </div>
        </div>
        <div className="card card-muted center">
          <div className="muted" style={{ fontSize: 12 }}>
            Este Mes
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.thisMonth}</div>
        </div>
        <div className="card card-muted center">
          <div className="muted" style={{ fontSize: 12 }}>
            Fiabilidad Promedio
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color:
                stats.fiabilidad >= 70
                  ? "var(--accent-strong)"
                  : "var(--warning)",
            }}
          >
            {stats.fiabilidad}%
          </div>
        </div>
      </div>

      {/* Dominant Code Distribution */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Distribución de Códigos Dominantes</h3>
        {codeDistribution.length === 0 ? (
          <p className="muted">Sin datos.</p>
        ) : (
          codeDistribution.map(([code, count]) => (
            <CssBar
              key={code}
              label={code}
              value={count}
              max={maxCode}
              color="var(--accent, #2563eb)"
            />
          ))
        )}
      </div>

      {/* RIASEC Dimension Averages */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Promedios de Dimensiones RIASEC</h3>
        {riasecAvgs === null ? (
          <p className="muted">No hay sesiones RIASEC registradas.</p>
        ) : (
          (["R", "I", "A", "S", "E", "C"] as const).map((dim) => (
            <CssBar
              key={dim}
              label={`${dim} - ${RIASEC_LABELS[dim]}`}
              value={riasecAvgs[dim]}
              max={100}
              suffix="%"
            />
          ))
        )}
      </div>

      {/* Group Comparison */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Comparación por Grupo</h3>
        {groupComparison.length === 0 ? (
          <p className="muted">No hay grupos registrados.</p>
        ) : (
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
                  {[
                    "Grupo",
                    "Sesiones",
                    "Código más frecuente",
                    "Carrera más frecuente (RIASEC)",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupComparison.map((g) => (
                  <tr key={g.cc}>
                    <td style={{ padding: "6px 8px" }}>{g.label}</td>
                    <td style={{ padding: "6px 8px" }}>{g.count}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span className="badge">{g.topCode}</span>
                    </td>
                    <td style={{ padding: "6px 8px" }}>{g.topCareer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Por Usuario tab
// ===========================================================================

function UsuarioTab({ sessions }: { sessions: SessionSummary[] }) {
  const [userSearch, setUserSearch] = useState("");

  const filtered = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        (s.studentName ?? "").toLowerCase().includes(q) ||
        (s.studentEmail ?? "").toLowerCase().includes(q) ||
        (s.cohortCode ?? "").toLowerCase().includes(q)
    );
  }, [sessions, userSearch]);

  const handleExport = () => {
    exportCsv(
      [
        "Nombre",
        "Correo",
        "Grupo",
        "Método",
        "Código Dominante",
        "Carrera Top",
        "Fecha",
        "Fiabilidad",
        "Estado",
      ],
      filtered.map((s) => [
        s.studentName ?? "",
        s.studentEmail ?? "",
        s.cohortCode ?? "",
        METHOD_LABELS[s.methodId] ?? s.methodId,
        s.dominantCode ?? "",
        s.methodId === "RIASEC" ? (s.topCareerTitle ?? "") : "",
        s.completedAt
          ? new Date(s.completedAt).toLocaleDateString("es-ES")
          : "",
        s.isValid ? "Alta" : "Baja",
        reviewLabel(s.reviewStatus),
      ]),
      `reporte-usuarios-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reporte por Usuario</h2>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          Exportar CSV
        </button>
      </div>
      <div>
        <label className="label" htmlFor="user-search">
          Buscar
        </label>
        <input
          id="user-search"
          className="input"
          placeholder="Buscar por nombre, correo o grupo…"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
      </div>
      {filtered.length === 0 ? (
        <p className="muted">No se encontraron evaluaciones.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr>
                {[
                  "Nombre",
                  "Correo",
                  "Grupo",
                  "Método",
                  "Código Dominante",
                  "Carrera Top",
                  "Fecha",
                  "Fiabilidad",
                  "Estado",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: "6px 8px" }}>
                    {s.studentName ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>
                    {s.studentEmail ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {s.cohortCode ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {METHOD_LABELS[s.methodId] ?? s.methodId}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span className="badge">{s.dominantCode || "—"}</span>
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {s.methodId === "RIASEC"
                      ? (s.topCareerTitle ?? "—")
                      : "—"}
                  </td>
                  <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                    {formatDateEs(s.completedAt)}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      color: s.isValid
                        ? "var(--accent-strong)"
                        : "var(--warning)",
                    }}
                  >
                    {s.isValid ? "Alta" : "Baja"}
                  </td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>
                    {reviewLabel(s.reviewStatus)}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <a
                      className="btn btn-secondary"
                      href={`/results/${encodeURIComponent(s.id)}`}
                      style={{ fontSize: 12, padding: "2px 8px" }}
                    >
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Por Área tab
// ===========================================================================

/** Methods where the dominant code is a sequence of per-dimension letters */
const LETTER_METHODS = new Set(["RIASEC", "CHASIDE"]);

/** Build a letter-frequency map for methods that use per-dimension letter codes */
function buildLetterFreq(
  sessions: SessionSummary[],
): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const s of sessions) {
    const code = s.dominantCode ?? "";
    for (const ch of code.split("")) {
      if (ch.trim()) freq[ch] = (freq[ch] ?? 0) + 1;
    }
  }
  return freq;
}

/** Build a whole-code frequency map for methods where codes are not letter-per-dimension */
function buildCodeFreq(
  sessions: SessionSummary[],
): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const s of sessions) {
    const code = s.dominantCode ?? "";
    if (code.trim()) freq[code] = (freq[code] ?? 0) + 1;
  }
  return freq;
}

/** Return the display label for a letter belonging to a specific method */
function areaLabelForMethod(letter: string, method: string): string {
  if (method === "RIASEC") {
    return `${letter} - ${RIASEC_LABELS[letter] ?? letter}`;
  }
  if (method === "CHASIDE") {
    return `${letter} - ${CHASIDE_LABELS[letter] ?? letter}`;
  }
  return letter;
}

/** One section of bars for a given method inside the "All methods" view */
function AreaMethodSection({
  methodId,
  sessions,
}: {
  methodId: string;
  sessions: SessionSummary[];
}) {
  const isLetterMethod = LETTER_METHODS.has(methodId);
  const freq = isLetterMethod
    ? buildLetterFreq(sessions)
    : buildCodeFreq(sessions);
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  const max = entries[0]?.[1] ?? 1;
  const total = entries.reduce((s, [, c]) => s + c, 0);

  return (
    <div className="card card-muted" style={{ marginBottom: 12 }}>
      <h4 style={{ marginTop: 0, marginBottom: 10 }}>
        {METHOD_LABELS[methodId] ?? methodId}
        <span className="muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
          ({sessions.length} sesión{sessions.length !== 1 ? "es" : ""}, {total} ocurrencias)
        </span>
      </h4>
      {entries.map(([key, count]) => (
        <CssBar
          key={key}
          label={
            isLetterMethod
              ? areaLabelForMethod(key, methodId)
              : key
          }
          value={count}
          max={max}
        />
      ))}
    </div>
  );
}

function AreaTab({ sessions }: { sessions: SessionSummary[] }) {
  const [areaMethodFilter, setAreaMethodFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (areaMethodFilter === "ALL") return sessions;
    return sessions.filter((s) => s.methodId === areaMethodFilter);
  }, [sessions, areaMethodFilter]);

  // For single-method view: compute freq data
  const singleMethodData = useMemo(() => {
    if (areaMethodFilter === "ALL") return null;
    const isLetterMethod = LETTER_METHODS.has(areaMethodFilter);
    const freq = isLetterMethod
      ? buildLetterFreq(filtered)
      : buildCodeFreq(filtered);
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [areaMethodFilter, filtered]);

  // For ALL view: sessions grouped by method
  const byMethod = useMemo(() => {
    if (areaMethodFilter !== "ALL") return null;
    return ALL_METHODS.map((mid) => ({
      methodId: mid,
      sessions: sessions.filter((s) => s.methodId === mid),
    })).filter((g) => g.sessions.length > 0);
  }, [areaMethodFilter, sessions]);

  // Export helper — collects data from current view
  const handleExport = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows: string[][] = [];

    if (areaMethodFilter === "ALL") {
      for (const { methodId, sessions: ms } of byMethod ?? []) {
        const isLetterMethod = LETTER_METHODS.has(methodId);
        const freq = isLetterMethod
          ? buildLetterFreq(ms)
          : buildCodeFreq(ms);
        const total = Object.values(freq).reduce((s, c) => s + c, 0);
        for (const [key, count] of Object.entries(freq).sort(
          (a, b) => b[1] - a[1],
        )) {
          const fullName = isLetterMethod
            ? (methodId === "RIASEC"
                ? (RIASEC_LABELS[key] ?? key)
                : (CHASIDE_LABELS[key] ?? key))
            : key;
          const pct =
            total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";
          rows.push([
            METHOD_LABELS[methodId] ?? methodId,
            key,
            fullName,
            String(count),
            pct,
          ]);
        }
      }
      exportCsv(
        ["Método", "Área / Código", "Nombre Completo", "Cantidad", "Porcentaje"],
        rows,
        `reporte-area-todos-${dateStr}.csv`,
      );
    } else {
      const isLetterMethod = LETTER_METHODS.has(areaMethodFilter);
      const data = singleMethodData ?? [];
      const total = data.reduce((s, [, c]) => s + c, 0);
      for (const [key, count] of data) {
        const fullName = isLetterMethod
          ? (areaMethodFilter === "RIASEC"
              ? (RIASEC_LABELS[key] ?? key)
              : (CHASIDE_LABELS[key] ?? key))
          : key;
        const pct =
          total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";
        rows.push([key, fullName, String(count), pct]);
      }
      exportCsv(
        ["Área / Código", "Nombre Completo", "Cantidad", "Porcentaje"],
        rows,
        `reporte-area-${areaMethodFilter.toLowerCase()}-${dateStr}.csv`,
      );
    }
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reporte por Área de Interés</h2>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          Exportar CSV
        </button>
      </div>
      <div>
        <label className="label" htmlFor="area-method-filter">
          Filtrar por método
        </label>
        <select
          id="area-method-filter"
          className="select"
          value={areaMethodFilter}
          onChange={(e) => setAreaMethodFilter(e.target.value)}
        >
          <option value="ALL">Todos los métodos</option>
          {ALL_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {areaMethodFilter === "ALL" ? (
        /* ALL view: one section per method so labels never collide */
        byMethod && byMethod.length > 0 ? (
          <div>
            {byMethod.map(({ methodId, sessions: ms }) => (
              <AreaMethodSection key={methodId} methodId={methodId} sessions={ms} />
            ))}
          </div>
        ) : (
          <p className="muted">Sin datos para el filtro seleccionado.</p>
        )
      ) : (
        /* Single-method view */
        singleMethodData && singleMethodData.length > 0 ? (
          <div>
            {singleMethodData.map(([key, count]) => (
              <CssBar
                key={key}
                label={
                  LETTER_METHODS.has(areaMethodFilter)
                    ? areaLabelForMethod(key, areaMethodFilter)
                    : key
                }
                value={count}
                max={singleMethodData[0]?.[1] ?? 1}
              />
            ))}
          </div>
        ) : (
          <p className="muted">Sin datos para el filtro seleccionado.</p>
        )
      )}
    </div>
  );
}

// ===========================================================================
// Por Grupo tab
// ===========================================================================

function GrupoTab({
  sessions,
  cohorts,
}: {
  sessions: SessionSummary[];
  cohorts: CohortGroup[];
}) {
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (selectedGroup === "ALL") return sessions;
    return sessions.filter(
      (s) => (s.cohortCode ?? "").toUpperCase() === selectedGroup.toUpperCase()
    );
  }, [sessions, selectedGroup]);

  const groupStats = useMemo(() => {
    const codeFreq: Record<string, number> = {};
    const careerFreq: Record<string, number> = {};
    for (const s of filtered) {
      if (s.dominantCode)
        codeFreq[s.dominantCode] = (codeFreq[s.dominantCode] ?? 0) + 1;
      if (s.methodId === "RIASEC" && s.topCareerTitle) {
        careerFreq[s.topCareerTitle] =
          (careerFreq[s.topCareerTitle] ?? 0) + 1;
      }
    }
    const topCode =
      Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const topCareer =
      Object.entries(careerFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const fiabilidad =
      filtered.length > 0
        ? Math.round(
            (filtered.filter((s) => s.isValid).length / filtered.length) * 100
          )
        : 0;
    return { topCode, topCareer, fiabilidad };
  }, [filtered]);

  const riasecAvgs = useMemo(() => {
    const rs = filtered.filter((s) => s.methodId === "RIASEC");
    if (rs.length === 0) return null;
    const sum = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };
    for (const s of rs) {
      sum.r += s.scores.r;
      sum.i += s.scores.i;
      sum.a += s.scores.a;
      sum.s += s.scores.s;
      sum.e += s.scores.e;
      sum.c += s.scores.c;
    }
    const n = rs.length;
    return {
      R: Math.round(sum.r / n),
      I: Math.round(sum.i / n),
      A: Math.round(sum.a / n),
      S: Math.round(sum.s / n),
      E: Math.round(sum.e / n),
      C: Math.round(sum.c / n),
    };
  }, [filtered]);

  const handleExport = () => {
    const cohortLabel =
      selectedGroup === "ALL" ? "todos" : selectedGroup.toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    exportCsv(
      [
        "Nombre",
        "Correo",
        "Método",
        "Código Dominante",
        "Carrera Top",
        "Fecha",
        "Fiabilidad",
        "Estado",
      ],
      filtered.map((s) => [
        s.studentName ?? "",
        s.studentEmail ?? "",
        METHOD_LABELS[s.methodId] ?? s.methodId,
        s.dominantCode ?? "",
        s.methodId === "RIASEC" ? (s.topCareerTitle ?? "") : "",
        s.completedAt
          ? new Date(s.completedAt).toLocaleDateString("es-ES")
          : "",
        s.isValid ? "Alta" : "Baja",
        reviewLabel(s.reviewStatus),
      ]),
      `reporte-grupo-${cohortLabel}-${dateStr}.csv`
    );
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reporte por Grupo</h2>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          Exportar CSV
        </button>
      </div>
      <div>
        <label className="label" htmlFor="grupo-select">
          Seleccionar grupo
        </label>
        <select
          id="grupo-select"
          className="select"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="ALL">Todos los grupos</option>
          {cohorts.map((c) => (
            <option key={c.code} value={c.code}>
              {c.title ? `${c.title} (${c.code})` : c.code}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="muted">No hay evaluaciones para el grupo seleccionado.</p>
      ) : (
        <>
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
                  {[
                    "Nombre",
                    "Correo",
                    "Método",
                    "Código Dominante",
                    "Carrera Top",
                    "Fecha",
                    "Fiabilidad",
                    "Estado",
                  ].map((h) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: "6px 8px" }}>
                      {s.studentName ?? "—"}
                    </td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>
                      {s.studentEmail ?? "—"}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {METHOD_LABELS[s.methodId] ?? s.methodId}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <span className="badge">{s.dominantCode || "—"}</span>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {s.methodId === "RIASEC"
                        ? (s.topCareerTitle ?? "—")
                        : "—"}
                    </td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                      {formatDateEs(s.completedAt)}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        color: s.isValid
                          ? "var(--accent-strong)"
                          : "var(--warning)",
                      }}
                    >
                      {s.isValid ? "Alta" : "Baja"}
                    </td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>
                      {reviewLabel(s.reviewStatus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div className="card card-muted">
            <div className="row" style={{ gap: 24, flexWrap: "wrap" }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Total evaluaciones
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {filtered.length}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Código más frecuente
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <span className="badge">{groupStats.topCode}</span>
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Carrera más frecuente (RIASEC)
                </div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {groupStats.topCareer}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Fiabilidad promedio
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color:
                      groupStats.fiabilidad >= 70
                        ? "var(--accent-strong)"
                        : "var(--warning)",
                  }}
                >
                  {groupStats.fiabilidad}%
                </div>
              </div>
            </div>
          </div>

          {/* RIASEC dimension averages for the group */}
          {riasecAvgs && (
            <div className="card card-muted">
              <h4 style={{ marginTop: 0, marginBottom: 10 }}>
                Promedios RIASEC del grupo
              </h4>
              {(["R", "I", "A", "S", "E", "C"] as const).map((dim) => (
                <CssBar
                  key={dim}
                  label={`${dim} - ${RIASEC_LABELS[dim]}`}
                  value={riasecAvgs[dim]}
                  max={100}
                  suffix="%"
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ===========================================================================
// Por Fecha tab
// ===========================================================================

function FechaTab({ sessions }: { sessions: SessionSummary[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (s.completedAt == null) return false;
      if (dateFrom) {
        const from = new Date(dateFrom).getTime();
        if (s.completedAt < from) return false;
      }
      if (dateTo) {
        // End of dateTo day
        const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
        if (s.completedAt > to) return false;
      }
      return true;
    });
  }, [sessions, dateFrom, dateTo]);

  // Compute sessions per day
  const perDay = useMemo(() => {
    const dayFreq: Record<string, number> = {};
    for (const s of filtered) {
      if (s.completedAt == null) continue;
      const day = new Date(s.completedAt).toISOString().slice(0, 10);
      dayFreq[day] = (dayFreq[day] ?? 0) + 1;
    }
    return Object.entries(dayFreq).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const maxPerDay = perDay.length > 0 ? Math.max(...perDay.map(([, c]) => c)) : 1;

  const handleExport = () => {
    exportCsv(
      [
        "Nombre",
        "Correo",
        "Grupo",
        "Método",
        "Código Dominante",
        "Fecha",
        "Estado",
      ],
      filtered.map((s) => [
        s.studentName ?? "",
        s.studentEmail ?? "",
        s.cohortCode ?? "",
        METHOD_LABELS[s.methodId] ?? s.methodId,
        s.dominantCode ?? "",
        s.completedAt
          ? new Date(s.completedAt).toLocaleDateString("es-ES")
          : "",
        reviewLabel(s.reviewStatus),
      ]),
      `reporte-fecha-${dateFrom || "inicio"}-${dateTo || "hoy"}.csv`
    );
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reporte por Fecha</h2>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-2" style={{ gap: 12 }}>
        <div>
          <label className="label" htmlFor="fecha-from">
            Desde
          </label>
          <input
            id="fecha-from"
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="fecha-to">
            Hasta
          </label>
          <input
            id="fecha-to"
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="muted" style={{ fontSize: 13 }}>
        {filtered.length} evaluación{filtered.length !== 1 ? "es" : ""} en el
        rango seleccionado
      </div>

      {/* Timeline bar chart */}
      {perDay.length > 0 && (
        <div className="card card-muted">
          <h4 style={{ marginTop: 0 }}>Evaluaciones por día</h4>
          {perDay.map(([day, count]) => (
            <CssBar key={day} label={day} value={count} max={maxPerDay} />
          ))}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="muted">No hay evaluaciones en el rango seleccionado.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr>
                {["Nombre", "Grupo", "Método", "Código Dominante", "Fecha"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: "6px 8px" }}>
                    {s.studentName ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {s.cohortCode ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {METHOD_LABELS[s.methodId] ?? s.methodId}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span className="badge">{s.dominantCode || "—"}</span>
                  </td>
                  <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                    {formatDateEs(s.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Por Carrera tab
// ===========================================================================

function CarreraTab({ sessions }: { sessions: SessionSummary[] }) {
  const riasecSessions = useMemo(
    () => sessions.filter((s) => s.methodId === "RIASEC"),
    [sessions]
  );

  const careerData = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const s of riasecSessions) {
      if (!s.topCareerTitle) continue;
      freq[s.topCareerTitle] = (freq[s.topCareerTitle] ?? 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [riasecSessions]);

  const maxCareer = careerData[0]?.[1] ?? 1;
  const total = riasecSessions.length;

  const handleExport = () => {
    exportCsv(
      ["Carrera", "Cantidad", "Porcentaje"],
      careerData.map(([career, count]) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";
        return [career, String(count), pct];
      }),
      `reporte-carrera-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reporte por Carrera</h2>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          Exportar CSV
        </button>
      </div>
      <div className="alert alert-warning" role="note" style={{ fontSize: 13 }}>
        Solo aplica a sesiones RIASEC ({riasecSessions.length} sesión
        {riasecSessions.length !== 1 ? "es" : ""} encontradas).
      </div>
      {careerData.length === 0 ? (
        <p className="muted">No hay datos de carrera registrados.</p>
      ) : (
        <div>
          {careerData.map(([career, count]) => {
            const pct =
              total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={career}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    minWidth: 220,
                    fontSize: 13,
                    textAlign: "right",
                    color: "var(--text-muted, #888)",
                  }}
                >
                  {career}
                </span>
                <div
                  style={{
                    flex: 1,
                    background: "var(--border, #e5e7eb)",
                    borderRadius: 4,
                    height: 16,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(count / maxCareer) * 100}%`,
                      height: "100%",
                      background: "var(--accent, #2563eb)",
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ minWidth: 80, fontSize: 13, fontWeight: 600 }}>
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Por Método tab
// ===========================================================================

function MetodoTab({ sessions }: { sessions: SessionSummary[] }) {
  const methodData = useMemo(() => {
    return ALL_METHODS.map((mid) => {
      const group = sessions.filter((s) => s.methodId === mid);
      const fiabilidad =
        group.length > 0
          ? Math.round(
              (group.filter((s) => s.isValid).length / group.length) * 100
            )
          : 0;
      const codeFreq: Record<string, number> = {};
      for (const s of group) {
        if (s.dominantCode)
          codeFreq[s.dominantCode] = (codeFreq[s.dominantCode] ?? 0) + 1;
      }
      const top3 = Object.entries(codeFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code]) => code);
      const pct =
        sessions.length > 0
          ? ((group.length / sessions.length) * 100).toFixed(1)
          : "0.0";
      return { mid, label: METHOD_LABELS[mid] ?? mid, count: group.length, pct, fiabilidad, top3 };
    });
  }, [sessions]);

  const handleExport = () => {
    exportCsv(
      [
        "Método",
        "Cantidad",
        "Porcentaje",
        "Fiabilidad Promedio",
        "Top Código 1",
        "Top Código 2",
        "Top Código 3",
      ],
      methodData.map((m) => [
        m.label,
        String(m.count),
        m.pct + "%",
        m.fiabilidad + "%",
        m.top3[0] ?? "",
        m.top3[1] ?? "",
        m.top3[2] ?? "",
      ]),
      `reporte-metodos-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reporte por Método</h2>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          Exportar CSV
        </button>
      </div>
      <div className="grid grid-2" style={{ gap: 12 }}>
        {methodData.map((m) => (
          <div key={m.mid} className="card card-muted">
            <div className="row spread" style={{ alignItems: "flex-start" }}>
              <strong style={{ fontSize: 15 }}>{m.label}</strong>
              <span className="badge">{m.pct}%</span>
            </div>
            <div
              className="grid grid-2"
              style={{ gap: 8, marginTop: 10, fontSize: 13 }}
            >
              <div>
                <div className="muted" style={{ fontSize: 11 }}>
                  Evaluaciones
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{m.count}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>
                  Fiabilidad
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color:
                      m.fiabilidad >= 70
                        ? "var(--accent-strong)"
                        : "var(--warning)",
                  }}
                >
                  {m.fiabilidad}%
                </div>
              </div>
            </div>
            {m.top3.length > 0 ? (
              <div style={{ marginTop: 10 }}>
                <div className="muted" style={{ fontSize: 11 }}>
                  Top códigos
                </div>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  {m.top3.map((code) => (
                    <span key={code} className="badge">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                Sin evaluaciones registradas.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
