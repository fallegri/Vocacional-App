"use client";

import { useMemo, useState } from "react";
import QrCode from "@/components/QrCode";
import { createCohort } from "@/lib/actions/cohorts";
import { setUserRole } from "@/lib/actions/users";
import { buildCohortTestUrl, normalizeCohortCode } from "@/lib/qr";
import { DEFAULT_USERS } from "@/data/seed";
import {
  REVIEW_STATUS,
  USER_ROLES,
  type CohortGroup,
  type ReviewStatusCode,
  type UserRoleCode,
} from "@/lib/riasec/types";
import type { SessionSummary } from "@/lib/sessions";
import type { MethodId } from "@/lib/methods/types";
import type { AppUserSummary } from "@/lib/actions/users";

type TabKey = "evaluaciones" | "grupos" | "usuarios" | "reportes";

/** Métodos disponibles para asignar a un grupo (nombre visible en español). */
const METHOD_OPTIONS: Array<{ id: MethodId; name: string }> = [
  { id: "RIASEC", name: "RIASEC (Holland)" },
  { id: "CHASIDE", name: "CHASIDE" },
  { id: "TIPOV", name: "TIPOV" },
  { id: "CIPR", name: "CIP-R" },
  { id: "MAGDALENA", name: "Test Magdalena Contreras" },
];

const REVIEW_STATUS_CODES = Object.keys(REVIEW_STATUS) as ReviewStatusCode[];

/** Roles disponibles para asignar desde el panel de admin. */
const ROLE_OPTIONS: Array<{ code: UserRoleCode; label: string }> = [
  { code: "SUPER_ADMIN", label: "Admin Principal" },
  { code: "TEST_ADMIN", label: "Admin de Test" },
  { code: "PROFESOR", label: "Profesor" },
  { code: "REPORT_REVIEWER", label: "Revisor de Reportes" },
  { code: "STUDENT", label: "Estudiante" },
];

function formatDate(ms: number | null): string {
  if (!ms) return "Sin fecha";
  try {
    return new Date(ms).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Sin fecha";
  }
}

/**
 * Genera un código slug a partir de un texto libre.
 * Toma hasta los primeros 16 caracteres alfanuméricos (en mayúsculas),
 * reemplaza espacios y guiones con "_", elimina el resto y añade un sufijo
 * aleatorio de 4 caracteres para evitar colisiones.
 */
function slugifyCode(text: string): string {
  const base = text
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .slice(0, 16);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return base ? `${base}_${suffix}` : suffix;
}

export default function AdminClient({
  initialCohorts,
  initialSessions,
  initialUsers,
  currentUser,
}: {
  initialCohorts: CohortGroup[];
  initialSessions: SessionSummary[];
  /** Lista inicial de usuarios del sistema (puede estar vacía). */
  initialUsers: AppUserSummary[];
  /**
   * Identidad real del usuario autenticado (email + rol) cuando la auth está
   * configurada. En modo demo (sin credenciales) es null y se muestra el
   * selector de rol de prueba heredado.
   */
  currentUser: { email: string; role: UserRoleCode } | null;
}) {
  // Selector de usuario/rol de PRUEBA: solo se usa en modo demo (sin auth).
  // Cuando hay sesión real (currentUser), la identidad y el rol vienen del
  // servidor y este selector no se muestra.
  const [activeUserId, setActiveUserId] = useState<string>(
    DEFAULT_USERS.find((u) => u.role === "SUPER_ADMIN")?.id ??
      DEFAULT_USERS[0]?.id ??
      ""
  );
  const demoUser =
    DEFAULT_USERS.find((u) => u.id === activeUserId) ?? DEFAULT_USERS[0];

  // Identidad efectiva: la sesión real si existe, si no el usuario de prueba.
  const effectiveRole: UserRoleCode = currentUser?.role ?? demoUser?.role ?? "STUDENT";
  const effectiveName = currentUser?.email ?? demoUser?.displayName ?? "";
  const activeRole = USER_ROLES[effectiveRole];
  const canManageCohorts =
    effectiveRole === "SUPER_ADMIN" || effectiveRole === "TEST_ADMIN";
  const canManageUsers = effectiveRole === "SUPER_ADMIN";

  const [tab, setTab] = useState<TabKey>("evaluaciones");

  // ----- Estado de grupos (cohortes) -----
  const [cohorts, setCohorts] = useState<CohortGroup[]>(initialCohorts);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
  const [methodId, setMethodId] = useState<MethodId>("RIASEC");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  // ----- Estado de evaluaciones -----
  const [sessions, setSessions] = useState<SessionSummary[]>(initialSessions);
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("ALL");

  // ----- Estado del diálogo de dictamen -----
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<ReviewStatusCode>("PENDING");
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // ----- Estado de gestión de usuarios -----
  const [users, setUsers] = useState<AppUserSummary[]>(initialUsers);
  // Por fila: guardamos el rol seleccionado en el dropdown (draft).
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRoleCode>>({});
  const [userSaving, setUserSaving] = useState<Record<string, boolean>>({});
  const [userErrors, setUserErrors] = useState<Record<string, string | null>>({});
  const [userNotices, setUserNotices] = useState<Record<string, string | null>>({});

  // ----- Estado de reportes -----
  const [selectedReportCohort, setSelectedReportCohort] = useState<string>("ALL");

  // Base absoluta para los enlaces del QR (segura en SSR y en cliente).
  const origin = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const linkFor = (c: string) => buildCohortTestUrl(c, origin);

  // El formulario puede enviarse siempre que haya título (el código se puede
  // dejar vacío y se genera automáticamente).
  const canSubmit = title.trim().length > 0;

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const matchesCohort =
        cohortFilter === "ALL"
          ? true
          : (s.cohortCode ?? "").toUpperCase() === cohortFilter.toUpperCase();
      const matchesSearch =
        q.length === 0
          ? true
          : (s.studentName ?? "").toLowerCase().includes(q) ||
            (s.studentEmail ?? "").toLowerCase().includes(q) ||
            s.dominantCode.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q);
      return matchesCohort && matchesSearch;
    });
  }, [sessions, cohortFilter, search]);

  const totalCount = filteredSessions.length;
  const validCount = filteredSessions.filter((s) => s.isValid).length;
  const pendingCount = filteredSessions.filter(
    (s) => s.reviewStatus === "PENDING" || !s.reviewerNotes
  ).length;

  // ----- Cómputos para pestaña Reportes -----
  const generalReportStats = useMemo(() => {
    const byMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byCode: Record<string, number> = {};

    for (const s of sessions) {
      // Por método
      const mid = s.methodId ?? "DESCONOCIDO";
      byMethod[mid] = (byMethod[mid] ?? 0) + 1;

      // Por estado de revisión
      const st = s.reviewStatus ?? "PENDING";
      byStatus[st] = (byStatus[st] ?? 0) + 1;

      // Por código dominante
      if (s.dominantCode) {
        byCode[s.dominantCode] = (byCode[s.dominantCode] ?? 0) + 1;
      }
    }

    const top5Codes = Object.entries(byCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total: sessions.length, byMethod, byStatus, top5Codes };
  }, [sessions]);

  const groupReportData = useMemo(() => {
    const filtered =
      selectedReportCohort === "ALL"
        ? sessions
        : sessions.filter(
            (s) =>
              (s.cohortCode ?? "").toUpperCase() ===
              selectedReportCohort.toUpperCase()
          );

    // Código dominante más frecuente en el grupo
    const codeFreq: Record<string, number> = {};
    for (const s of filtered) {
      if (s.dominantCode) {
        codeFreq[s.dominantCode] = (codeFreq[s.dominantCode] ?? 0) + 1;
      }
    }
    const topCode =
      Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return { filtered, topCode, total: filtered.length };
  }, [sessions, selectedReportCohort]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!canSubmit) return;
    setPending(true);

    // Si el código está vacío, auto-generamos un slug desde el título.
    const rawCode = code.trim();
    const resolvedCode = rawCode
      ? normalizeCohortCode(rawCode)
      : slugifyCode(title.trim());

    const result = await createCohort({
      code: resolvedCode,
      title: title.trim(),
      institution: institution.trim(),
      creatorName: effectiveName,
      description: description.trim(),
      methodId,
    });
    setPending(false);

    // Si el servidor rechaza por autorización (sesión de personal ausente o
    // rol insuficiente), NO generamos el QR: la operación no se realizó.
    const unauthorized =
      !result.ok &&
      typeof result.error === "string" &&
      /(iniciar sesión|permisos suficientes|token de personal)/i.test(
        result.error
      );

    if (unauthorized) {
      setError(result.error ?? "No estás autorizado para crear grupos.");
      return;
    }

    if (!result.ok) {
      setError(
        `${result.error ?? "No se pudo guardar en la base de datos."} El código QR se generó de todas formas para su uso inmediato.`
      );
    } else {
      setNotice(`Grupo ${resolvedCode} creado correctamente.`);
    }

    setCohorts((prev) => {
      if (prev.some((c) => c.code === resolvedCode)) return prev;
      return [
        {
          code: resolvedCode,
          title: title.trim(),
          institution: institution.trim(),
          creatorName: effectiveName,
          isActive: true,
          description: description.trim(),
          methodId,
        },
        ...prev,
      ];
    });
    setJustCreated(resolvedCode);
    setCode("");
    setTitle("");
    setInstitution("");
    setDescription("");
    setMethodId("RIASEC");
  };

  const openReview = (s: SessionSummary) => {
    setReviewSessionId(s.id);
    setNotesDraft(s.reviewerNotes ?? "");
    setStatusDraft(
      (REVIEW_STATUS_CODES.includes(s.reviewStatus as ReviewStatusCode)
        ? s.reviewStatus
        : "PENDING") as ReviewStatusCode
    );
    setReviewError(null);
  };

  const closeReview = () => {
    setReviewSessionId(null);
    setReviewPending(false);
    setReviewError(null);
  };

  const saveReview = async () => {
    if (!reviewSessionId) return;
    setReviewPending(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/sessions/${reviewSessionId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewerNotes: notesDraft.trim(),
          reviewStatus: statusDraft,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "No se pudo guardar el dictamen.");
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.id === reviewSessionId
            ? {
                ...s,
                reviewerNotes: notesDraft.trim(),
                reviewStatus: statusDraft,
              }
            : s
        )
      );
      closeReview();
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "No se pudo guardar el dictamen."
      );
      setReviewPending(false);
    }
  };

  const getRoleDraft = (user: AppUserSummary): UserRoleCode =>
    roleDrafts[user.id] ?? user.role;

  const exportGroupCsv = () => {
    const rows = groupReportData.filtered;
    const cohortLabel =
      selectedReportCohort === "ALL" ? "todos" : selectedReportCohort;
    const dateStr = new Date().toISOString().slice(0, 10);

    const headers = ["Nombre", "Correo", "Método", "Código Dominante", "Fecha", "Estado"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      headers.map(escape).join(","),
      ...rows.map((s) =>
        [
          s.studentName ?? "",
          s.studentEmail ?? "",
          METHOD_OPTIONS.find((m) => m.id === s.methodId)?.name ?? s.methodId ?? "",
          s.dominantCode ?? "",
          s.completedAt ? new Date(s.completedAt).toLocaleDateString("es-ES") : "",
          s.reviewStatus
            ? (REVIEW_STATUS[s.reviewStatus as ReviewStatusCode]?.displayName ?? s.reviewStatus)
            : REVIEW_STATUS.PENDING.displayName,
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${cohortLabel}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };  const handleRoleChange = (userId: string, role: UserRoleCode) => {
    setRoleDrafts((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (user: AppUserSummary) => {
    const newRole = getRoleDraft(user);
    setUserSaving((prev) => ({ ...prev, [user.id]: true }));
    setUserErrors((prev) => ({ ...prev, [user.id]: null }));
    setUserNotices((prev) => ({ ...prev, [user.id]: null }));

    const result = await setUserRole(user.email, newRole);

    setUserSaving((prev) => ({ ...prev, [user.id]: false }));
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      // Limpiar el draft al guardar correctamente.
      setRoleDrafts((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setUserNotices((prev) => ({
        ...prev,
        [user.id]: `Rol actualizado a "${USER_ROLES[newRole].title}".`,
      }));
    } else {
      setUserErrors((prev) => ({
        ...prev,
        [user.id]: result.error ?? "No se pudo actualizar el rol.",
      }));
    }
  };

  const reviewSession = sessions.find((s) => s.id === reviewSessionId) ?? null;

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Banner de rol + (en modo demo) selector de usuario de prueba */}
      <div className="card">
        <div className="row spread" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>{activeRole.badgeIcon}</span>
            <div>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <strong>{activeRole.title}</strong>
                {activeRole.isStaff ? (
                  <span className="badge">STAFF</span>
                ) : null}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {effectiveName}
              </div>
            </div>
          </div>
          {currentUser ? null : (
            <div>
              <label className="label" htmlFor="active-user">
                Actuar como (perfil de prueba)
              </label>
              <select
                id="active-user"
                className="select"
                value={activeUserId}
                onChange={(e) => setActiveUserId(e.target.value)}
              >
                {DEFAULT_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {USER_ROLES[u.role].title} · {u.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          {currentUser
            ? "Sesión iniciada con credenciales. Tu rol determina las operaciones permitidas."
            : "Selector de rol de demostración: la autenticación con credenciales no está configurada en este entorno."}
        </p>
      </div>

      {/* Pestañas */}
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={tab === "evaluaciones" ? "btn" : "btn btn-secondary"}
          onClick={() => setTab("evaluaciones")}
        >
          Evaluaciones &amp; Auditoría
        </button>
        <button
          type="button"
          className={tab === "grupos" ? "btn" : "btn btn-secondary"}
          onClick={() => setTab("grupos")}
        >
          Gestión de Grupos
        </button>
        <button
          type="button"
          className={tab === "usuarios" ? "btn" : "btn btn-secondary"}
          onClick={() => setTab("usuarios")}
        >
          Usuarios
        </button>
        <button
          type="button"
          className={tab === "reportes" ? "btn" : "btn btn-secondary"}
          onClick={() => setTab("reportes")}
        >
          Reportes
        </button>
      </div>

      {tab === "evaluaciones" ? (
        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="grid grid-3" style={{ marginBottom: 14 }}>
              <div className="card card-muted center">
                <div className="muted" style={{ fontSize: 12 }}>
                  Evaluaciones
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {totalCount}
                </div>
              </div>
              <div className="card card-muted center">
                <div className="muted" style={{ fontSize: 12 }}>
                  Válidas / Alta Confiab.
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--accent-strong)",
                  }}
                >
                  {validCount}
                </div>
              </div>
              <div className="card card-muted center">
                <div className="muted" style={{ fontSize: 12 }}>
                  Pendientes Dictamen
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--warning)",
                  }}
                >
                  {pendingCount}
                </div>
              </div>
            </div>

            <div className="grid grid-2">
              <div>
                <label className="label" htmlFor="admin-search">
                  Buscar por estudiante, correo o código
                </label>
                <input
                  id="admin-search"
                  className="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ej. María, gmail.com, RIA…"
                />
              </div>
              <div>
                <label className="label" htmlFor="admin-cohort-filter">
                  Filtrar por grupo
                </label>
                <select
                  id="admin-cohort-filter"
                  className="select"
                  value={cohortFilter}
                  onChange={(e) => setCohortFilter(e.target.value)}
                >
                  <option value="ALL">Todos los grupos</option>
                  {cohorts.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.title ? `${c.title} (${c.code})` : c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="card center">
              <p className="muted" style={{ margin: 0 }}>
                No se encontraron evaluaciones con los filtros actuales. Realiza
                un test o selecciona otro grupo para ver los resultados.
              </p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {filteredSessions.map((s) => {
                const reviewLabel = s.reviewStatus
                  ? REVIEW_STATUS[s.reviewStatus as ReviewStatusCode]
                      ?.displayName ?? s.reviewStatus
                  : REVIEW_STATUS.PENDING.displayName;
                return (
                  <article
                    key={s.id}
                    className="card"
                    data-testid={`admin-session-${s.id}`}
                  >
                    <div
                      className="row spread"
                      style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}
                    >
                      <div>
                        <strong>
                          {s.studentName ?? "Estudiante OrientApp"}
                        </strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {s.studentEmail ?? "Sin correo registrado"}
                        </div>
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        <span
                          className="chip"
                          data-testid="session-method-badge"
                        >
                          Método: {s.methodId}
                        </span>
                        <span className="badge">
                          {s.cohortCode ?? "SIN GRUPO"}
                        </span>
                      </div>
                    </div>

                    <div
                      className="row"
                      style={{ gap: 10, alignItems: "center", marginTop: 10 }}
                    >
                      <span
                        className="badge"
                        style={{ fontSize: 13, fontWeight: 800 }}
                      >
                        {s.dominantCode || "—"}
                      </span>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        {s.methodId === "RIASEC" ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                              Carrera Top: {s.topCareerTitle ?? "Ver informe"}
                            </div>
                            <div className="muted" style={{ fontSize: 11 }}>
                              Puntajes: R={Math.round(s.scores.r)}% I=
                              {Math.round(s.scores.i)}% A={Math.round(s.scores.a)}% S=
                              {Math.round(s.scores.s)}% E={Math.round(s.scores.e)}% C=
                              {Math.round(s.scores.c)}%
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                              Áreas dominantes: {s.dominantCode || "—"}
                            </div>
                            <div className="muted" style={{ fontSize: 11 }}>
                              Test {s.methodId}: consulta el diagnóstico para ver
                              los puntajes por dimensión.
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          className="chip"
                          style={{
                            color: s.isValid
                              ? "var(--accent-strong)"
                              : "var(--warning)",
                          }}
                        >
                          {s.reliabilityLevel || "—"}
                        </span>
                        <div className="muted" style={{ fontSize: 10 }}>
                          {formatDate(s.completedAt ?? s.startedAt)}
                        </div>
                      </div>
                    </div>

                    {s.reviewerNotes ? (
                      <div
                        className="card card-muted"
                        style={{ marginTop: 10 }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700 }}>
                          Dictamen del revisor ({reviewLabel}):
                        </div>
                        <div style={{ fontSize: 12 }}>{s.reviewerNotes}</div>
                      </div>
                    ) : null}

                    <div
                      className="row"
                      style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openReview(s)}
                      >
                        {s.reviewerNotes ? "Editar dictamen" : "Añadir dictamen"}
                      </button>
                      <a
                        className="btn"
                        href={`/results/${encodeURIComponent(s.id)}`}
                      >
                        Ver diagnóstico
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "grupos" ? (
        <div className="stack" style={{ gap: 20 }}>
          {canManageCohorts ? (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Crear nuevo grupo</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Al crear un grupo se genera automáticamente un código QR que
                lleva al formulario del test vocacional asignado a ese grupo.
              </p>
              <form className="stack" onSubmit={handleCreate}>
                <div className="grid grid-2">
                  <div>
                    <label className="label" htmlFor="cohort-title">
                      Nombre del grupo
                    </label>
                    <input
                      id="cohort-title"
                      className="input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="6to A Ciencias · Evento 1 · Colegio San Martín"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="cohort-code">
                      Código del grupo (opcional, se genera automáticamente si se deja vacío)
                    </label>
                    <input
                      id="cohort-code"
                      className="input"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Se genera desde el nombre si no se especifica"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="cohort-institution">
                      Institución educativa
                    </label>
                    <input
                      id="cohort-institution"
                      className="input"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Colegio Nacional San Martín"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="cohort-creator">
                      Creador / responsable
                    </label>
                    <input
                      id="cohort-creator"
                      className="input"
                      value={effectiveName}
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="cohort-method">
                    Método de evaluación asignado
                  </label>
                  <select
                    id="cohort-method"
                    className="select"
                    data-testid="cohort-method-select"
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value as MethodId)}
                  >
                    {METHOD_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
                    El código QR del grupo llevará directamente a este test.
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor="cohort-description">
                    Descripción u observaciones (opcional)
                  </label>
                  <textarea
                    id="cohort-description"
                    className="textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {error ? (
                  <div className="alert alert-warning" role="alert">
                    {error}
                  </div>
                ) : null}
                {notice ? (
                  <div className="alert alert-ok" role="status">
                    {notice}
                  </div>
                ) : null}
                <button
                  type="submit"
                  className="btn"
                  disabled={!canSubmit || pending}
                >
                  {pending ? "Creando grupo…" : "Crear grupo y generar QR"}
                </button>
              </form>
            </div>
          ) : (
            <div className="alert alert-warning" role="note">
              Tu rol ({activeRole.title}) puede consultar los grupos y sus
              códigos QR, pero no crear nuevos.
            </div>
          )}

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Grupos y códigos QR</h2>
            <div className="grid grid-2">
              {cohorts.map((c) => (
                <article
                  key={c.code}
                  className="card card-muted"
                  data-testid="cohort-qr-card"
                  style={{
                    border:
                      justCreated === c.code
                        ? "1px solid var(--accent)"
                        : undefined,
                  }}
                >
                  <div
                    className="row spread"
                    style={{ alignItems: "flex-start" }}
                  >
                    <div>
                      <span className="badge">{c.code}</span>
                      <h3 style={{ margin: "8px 0 2px" }}>{c.title}</h3>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {c.institution || "Sin institución"}
                      </div>
                      <span
                        className="chip"
                        data-testid="cohort-method-badge"
                        style={{ marginTop: 6, display: "inline-block" }}
                      >
                        Método: {c.methodId ?? "RIASEC"}
                      </span>
                    </div>
                  </div>
                  <div className="center" style={{ marginTop: 12 }}>
                    <QrCode
                      value={linkFor(c.code)}
                      downloadName={`qr-${c.code}`}
                    />
                  </div>
                  <p
                    className="muted"
                    style={{ fontSize: 12, wordBreak: "break-all" }}
                  >
                    {linkFor(c.code)}
                  </p>
                  <a
                    className="btn btn-secondary"
                    href={`/g/${encodeURIComponent(c.code)}`}
                  >
                    Abrir formulario del grupo
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "usuarios" ? (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Usuarios del sistema</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {canManageUsers
              ? "Como administrador principal puedes cambiar el rol de cualquier usuario registrado. Los cambios se guardan en la base de datos."
              : "Lista de usuarios registrados. Solo el administrador principal puede cambiar roles."}
          </p>

          {users.length === 0 ? (
            <div className="alert alert-warning" role="note">
              No hay usuarios registrados en la base de datos o la base de datos
              no está disponible. Ejecuta{" "}
              <code>npm run db:seed</code> para crear el administrador inicial.
            </div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {users.map((u) => {
                const roleMeta = USER_ROLES[u.role];
                const draft = getRoleDraft(u);
                const isDirty = draft !== u.role;
                const saving = userSaving[u.id] ?? false;
                const userError = userErrors[u.id] ?? null;
                const userNotice = userNotices[u.id] ?? null;
                return (
                  <article key={u.id} className="card card-muted">
                    <div
                      className="row spread"
                      style={{
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div className="row" style={{ gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 22 }}>{roleMeta.badgeIcon}</span>
                        <div>
                          <strong>{u.displayName}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {u.email}
                          </div>
                          <div className="muted" style={{ fontSize: 11 }}>
                            Verificado:{" "}
                            {u.emailVerifiedAt ? (
                              <span style={{ color: "var(--accent-strong)" }}>Sí</span>
                            ) : (
                              <span style={{ color: "var(--warning)" }}>No</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="row"
                        style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}
                      >
                        {canManageUsers ? (
                          <>
                            <select
                              className="select"
                              value={draft}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value as UserRoleCode)
                              }
                              disabled={saving}
                              style={{ minWidth: 180 }}
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.code} value={opt.code}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn"
                              disabled={!isDirty || saving}
                              onClick={() => handleSaveRole(u)}
                            >
                              {saving ? "Guardando…" : "Guardar"}
                            </button>
                          </>
                        ) : (
                          <span className="badge">{roleMeta.title}</span>
                        )}
                      </div>
                    </div>
                    {userError ? (
                      <div
                        className="alert alert-warning"
                        role="alert"
                        style={{ marginTop: 8 }}
                      >
                        {userError}
                      </div>
                    ) : null}
                    {userNotice ? (
                      <div
                        className="alert alert-ok"
                        role="status"
                        style={{ marginTop: 8 }}
                      >
                        {userNotice}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "reportes" ? (
        <div className="stack" style={{ gap: 20 }}>
          {/* Reporte General */}
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Reporte General</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Resumen de todas las evaluaciones registradas en el sistema.
            </p>

            {/* Totales */}
            <div className="card card-muted center" style={{ marginBottom: 16 }}>
              <div className="muted" style={{ fontSize: 12 }}>Total de evaluaciones</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{generalReportStats.total}</div>
            </div>

            <div className="grid grid-2" style={{ gap: 16 }}>
              {/* Por método */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Por Método</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>Método</th>
                      <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>Cantidad</th>
                      <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(generalReportStats.byMethod).map(([mid, count]) => {
                      const pct =
                        generalReportStats.total > 0
                          ? ((count / generalReportStats.total) * 100).toFixed(1)
                          : "0.0";
                      const methodName =
                        METHOD_OPTIONS.find((m) => m.id === mid)?.name ?? mid;
                      return (
                        <tr key={mid}>
                          <td style={{ padding: "4px 8px" }}>{methodName}</td>
                          <td style={{ padding: "4px 8px", textAlign: "right" }}>{count}</td>
                          <td style={{ padding: "4px 8px", textAlign: "right" }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Por estado de revisión */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Por Estado</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>Estado</th>
                      <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(generalReportStats.byStatus).map(([st, count]) => {
                      const label =
                        REVIEW_STATUS[st as ReviewStatusCode]?.displayName ?? st;
                      return (
                        <tr key={st}>
                          <td style={{ padding: "4px 8px" }}>{label}</td>
                          <td style={{ padding: "4px 8px", textAlign: "right" }}>{count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 5 códigos dominantes */}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Top 5 Códigos Dominantes</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>Código</th>
                    <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {generalReportStats.top5Codes.map(([code, count]) => (
                    <tr key={code}>
                      <td style={{ padding: "4px 8px" }}>
                        <span className="badge">{code}</span>
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right" }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reporte por Grupo */}
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Reporte por Grupo</h2>

            <div style={{ marginBottom: 14 }}>
              <label className="label" htmlFor="report-cohort-select">
                Seleccionar grupo
              </label>
              <select
                id="report-cohort-select"
                className="select"
                value={selectedReportCohort}
                onChange={(e) => setSelectedReportCohort(e.target.value)}
              >
                <option value="ALL">Todos los grupos</option>
                {cohorts.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.title ? `${c.title} (${c.code})` : c.code}
                  </option>
                ))}
              </select>
            </div>

            {groupReportData.total === 0 ? (
              <div className="card card-muted center">
                <p className="muted" style={{ margin: 0 }}>
                  No hay evaluaciones para el grupo seleccionado.
                </p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Nombre</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Correo</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Método</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Código Dominante</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Fecha</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupReportData.filtered.map((s) => {
                        const methodName =
                          METHOD_OPTIONS.find((m) => m.id === s.methodId)?.name ?? s.methodId ?? "—";
                        const statusLabel = s.reviewStatus
                          ? (REVIEW_STATUS[s.reviewStatus as ReviewStatusCode]?.displayName ?? s.reviewStatus)
                          : REVIEW_STATUS.PENDING.displayName;
                        return (
                          <tr key={s.id}>
                            <td style={{ padding: "6px 8px" }}>{s.studentName ?? "—"}</td>
                            <td style={{ padding: "6px 8px", fontSize: 12 }}>{s.studentEmail ?? "—"}</td>
                            <td style={{ padding: "6px 8px" }}>{methodName}</td>
                            <td style={{ padding: "6px 8px" }}>
                              <span className="badge">{s.dominantCode || "—"}</span>
                            </td>
                            <td style={{ padding: "6px 8px", fontSize: 12 }}>
                              {formatDate(s.completedAt ?? s.startedAt)}
                            </td>
                            <td style={{ padding: "6px 8px", fontSize: 12 }}>{statusLabel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Resumen del grupo */}
                <div className="card card-muted" style={{ marginTop: 14 }}>
                  <div className="row" style={{ gap: 20, flexWrap: "wrap" }}>
                    <div>
                      <div className="muted" style={{ fontSize: 12 }}>Total evaluaciones</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{groupReportData.total}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 12 }}>Código dominante más frecuente</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        <span className="badge">{groupReportData.topCode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button type="button" className="btn" onClick={exportGroupCsv}>
                    Exportar CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Diálogo de dictamen del revisor */}
      {reviewSession ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dictamen del revisor"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={closeReview}
        >
          <div
            className="card"
            style={{ maxWidth: 520, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Dictamen del revisor</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              {reviewSession.studentName ?? "Estudiante OrientApp"} ·{" "}
              {reviewSession.dominantCode || "—"}
            </p>
            <div className="stack" style={{ gap: 12 }}>
              <div>
                <label className="label" htmlFor="review-status">
                  Estado de revisión
                </label>
                <select
                  id="review-status"
                  className="select"
                  value={statusDraft}
                  onChange={(e) =>
                    setStatusDraft(e.target.value as ReviewStatusCode)
                  }
                >
                  {REVIEW_STATUS_CODES.map((k) => (
                    <option key={k} value={k}>
                      {REVIEW_STATUS[k].displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="review-notes">
                  Notas / dictamen pedagógico
                </label>
                <textarea
                  id="review-notes"
                  className="textarea"
                  rows={5}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Observaciones del orientador sobre esta evaluación…"
                />
              </div>
              {reviewError ? (
                <div className="alert alert-danger" role="alert">
                  {reviewError}
                </div>
              ) : null}
              <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeReview}
                  disabled={reviewPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={saveReview}
                  disabled={reviewPending}
                >
                  {reviewPending ? "Guardando…" : "Guardar dictamen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
