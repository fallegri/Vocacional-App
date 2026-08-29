"use client";

import { useMemo, useState } from "react";
import QrCode from "@/components/QrCode";
import { createCohort } from "@/lib/actions/cohorts";
import {
  useStaffToken,
  STAFF_TOKEN_HEADER,
} from "@/components/useStaffToken";
import StaffTokenField from "@/components/StaffTokenField";
import { buildCohortTestUrl, normalizeCohortCode } from "@/lib/qr";
import { DEFAULT_USERS } from "@/data/seed";
import {
  REVIEW_STATUS,
  USER_ROLES,
  type CohortGroup,
  type ReviewStatusCode,
} from "@/lib/riasec/types";
import type { SessionSummary } from "@/lib/sessions";

type TabKey = "evaluaciones" | "cohortes" | "usuarios";

const REVIEW_STATUS_CODES = Object.keys(REVIEW_STATUS) as ReviewStatusCode[];

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

export default function AdminClient({
  initialCohorts,
  initialSessions,
  staffAuthEnabled,
}: {
  initialCohorts: CohortGroup[];
  initialSessions: SessionSummary[];
  staffAuthEnabled: boolean;
}) {
  const { token: staffToken, setToken: setStaffToken } = useStaffToken();
  // Selector de usuario/rol activo (la app Android no tiene auth real: siembra
  // usuarios y permite cambiar de rol). Se documenta que OAuth real queda fuera
  // de alcance (ver README / FEAT-005).
  const [activeUserId, setActiveUserId] = useState<string>(
    DEFAULT_USERS.find((u) => u.role === "SUPER_ADMIN")?.id ??
      DEFAULT_USERS[0]?.id ??
      ""
  );
  const activeUser =
    DEFAULT_USERS.find((u) => u.id === activeUserId) ?? DEFAULT_USERS[0];
  const activeRole = USER_ROLES[activeUser.role];
  const canManageCohorts =
    activeUser.role === "SUPER_ADMIN" || activeUser.role === "TEST_ADMIN";

  const [tab, setTab] = useState<TabKey>("evaluaciones");

  // ----- Estado de cohortes -----
  const [cohorts, setCohorts] = useState<CohortGroup[]>(initialCohorts);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
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

  // Base absoluta para los enlaces del QR (segura en SSR y en cliente).
  const origin = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const linkFor = (c: string) => buildCohortTestUrl(c, origin);

  const canSubmit = code.trim().length > 0 && title.trim().length > 0;

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!canSubmit) return;
    setPending(true);

    const normalized = normalizeCohortCode(code);
    const result = await createCohort({
      code: normalized,
      title: title.trim(),
      institution: institution.trim(),
      creatorName: activeUser.displayName,
      description: description.trim(),
      staffToken,
    });
    setPending(false);

    // Si el servidor rechaza por autorización (token de personal ausente o
    // inválido), NO generamos el QR: la operación no se realizó.
    const unauthorized =
      !result.ok &&
      typeof result.error === "string" &&
      /token de personal/i.test(result.error);

    if (unauthorized) {
      setError(
        `${result.error} Introduce el token de acceso del personal y vuelve a intentarlo.`
      );
      return;
    }

    if (!result.ok) {
      setError(
        `${result.error ?? "No se pudo guardar en la base de datos."} El código QR se generó de todas formas para su uso inmediato.`
      );
    } else {
      setNotice(`Grupo ${normalized} creado correctamente.`);
    }

    setCohorts((prev) => {
      if (prev.some((c) => c.code === normalized)) return prev;
      return [
        {
          code: normalized,
          title: title.trim(),
          institution: institution.trim(),
          creatorName: activeUser.displayName,
          isActive: true,
          description: description.trim(),
        },
        ...prev,
      ];
    });
    setJustCreated(normalized);
    setCode("");
    setTitle("");
    setInstitution("");
    setDescription("");
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
          ...(staffToken ? { [STAFF_TOKEN_HEADER]: staffToken } : {}),
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

  const reviewSession = sessions.find((s) => s.id === reviewSessionId) ?? null;

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Banner de rol + selector de usuario */}
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
                {activeUser.displayName}
              </div>
            </div>
          </div>
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
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          Selector de rol de demostración: la app aún no incluye autenticación
          real (OAuth queda fuera de alcance de esta etapa).
        </p>
      </div>

      {/* Token de personal (solo si el servidor lo exige) */}
      <StaffTokenField
        enabled={staffAuthEnabled}
        token={staffToken}
        setToken={setStaffToken}
      />

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
          className={tab === "cohortes" ? "btn" : "btn btn-secondary"}
          onClick={() => setTab("cohortes")}
        >
          Gestión de Cohortes
        </button>
        <button
          type="button"
          className={tab === "usuarios" ? "btn" : "btn btn-secondary"}
          onClick={() => setTab("usuarios")}
        >
          Directorio de Usuarios
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
                  Buscar por estudiante, correo o código RIASEC
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
                  Filtrar por cohorte
                </label>
                <select
                  id="admin-cohort-filter"
                  className="select"
                  value={cohortFilter}
                  onChange={(e) => setCohortFilter(e.target.value)}
                >
                  <option value="ALL">Todas las cohortes</option>
                  {cohorts.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
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
                un test o selecciona otra cohorte para ver los resultados.
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
                      <span className="badge">{s.cohortCode ?? "SIN COHORTE"}</span>
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
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          Carrera Top: {s.topCareerTitle ?? "Ver informe"}
                        </div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          Puntajes: R={Math.round(s.scores.r)}% I=
                          {Math.round(s.scores.i)}% A={Math.round(s.scores.a)}% S=
                          {Math.round(s.scores.s)}% E={Math.round(s.scores.e)}% C=
                          {Math.round(s.scores.c)}%
                        </div>
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

      {tab === "cohortes" ? (
        <div className="stack" style={{ gap: 20 }}>
          {canManageCohorts ? (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Crear nuevo grupo de encuesta</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Al crear un grupo se genera automáticamente un código QR que
                lleva al formulario del test vocacional asignado a ese grupo.
              </p>
              <form className="stack" onSubmit={handleCreate}>
                <div className="grid grid-2">
                  <div>
                    <label className="label" htmlFor="cohort-code">
                      Código único (ej. BIO-2026-C)
                    </label>
                    <input
                      id="cohort-code"
                      className="input"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ING-2026-A"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="cohort-title">
                      Nombre del grupo / curso
                    </label>
                    <input
                      id="cohort-title"
                      className="input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="6to A Ciencias"
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
                      value={activeUser.displayName}
                      disabled
                    />
                  </div>
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
              Tu rol ({activeRole.title}) puede consultar las cohortes y sus
              códigos QR, pero no crear nuevas.
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
          <h2 style={{ marginTop: 0 }}>Directorio de Usuarios</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Usuarios semilla del sistema. La autenticación real (OAuth) queda
            fuera de alcance de esta etapa.
          </p>
          <div className="stack" style={{ gap: 10 }}>
            {DEFAULT_USERS.map((u) => {
              const role = USER_ROLES[u.role];
              return (
                <article key={u.id} className="card card-muted">
                  <div
                    className="row spread"
                    style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}
                  >
                    <div className="row" style={{ gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 22 }}>{role.badgeIcon}</span>
                      <div>
                        <strong>{u.displayName}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="badge">{role.title}</span>
                      <div className="muted" style={{ fontSize: 11 }}>
                        {u.institution ?? "Sin institución"}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
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
