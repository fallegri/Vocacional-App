// ===========================================================================
// Persistencia y lectura de sesiones de evaluación en Neon (solo runtime).
// Ninguna consulta se ejecuta al importar el módulo ni durante `next build`;
// todas usan el cliente perezoso de web/lib/db.ts.
// ===========================================================================

import { query, withTransaction } from "@/lib/db";
import { normalizeMethodId } from "@/lib/methods/registry";
import type { MethodId, MethodResult } from "@/lib/methods/types";
import type {
  AssessmentAnswer,
  CareerMatch,
  PsychometricScores,
  QualityMetric,
} from "@/lib/riasec/types";

/**
 * Puntajes genéricos por método (para métodos distintos de RIASEC) que se
 * serializan en la columna JSON method_scores. Guardamos las dimensiones, los
 * códigos dominantes y la interpretación para poder renderizar los resultados
 * sin depender de las columnas r/i/a/s/e/c.
 */
export interface StoredMethodScores {
  dimensionScores: MethodResult["dimensionScores"];
  dominantCodes: string[];
  interpretation: string;
  /**
   * Datos crudos específicos del método para vistas especializadas.
   * P. ej. CHASIDE expone aquí los conteos por área de Interés y Aptitud para
   * poder graficar ambas dimensiones por separado. Opcional y retrocompatible:
   * las filas antiguas sin este campo se cargan como `raw: null`.
   */
  raw?: Record<string, unknown> | null;
}

export interface StoredSession {
  id: string;
  startedAt: number;
  completedAt: number | null;
  isValid: boolean;
  reliabilityLevel: string;
  scores: PsychometricScores;
  dominantCode: string;
  dominantSummary: string;
  warningMessage: string | null;
  topCareerTitle: string | null;
  topCareerAffinity: number | null;
  aiAnalysis: string | null;
  cohortCode: string | null;
  studentName: string | null;
  studentEmail: string | null;
  reviewStatus: string | null;
  /** Método vocacional usado (RIASEC por defecto para filas antiguas). */
  methodId: MethodId;
  /** Puntajes genéricos por dimensión para métodos distintos de RIASEC. */
  methodScores: StoredMethodScores | null;
}

export interface PersistSessionInput {
  id: string;
  startedAt: number;
  completedAt: number;
  quality: QualityMetric;
  scores: PsychometricScores;
  dominantCode: string;
  dominantSummary: string;
  careerMatches: CareerMatch[];
  answers: AssessmentAnswer[];
  cohortCode?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  /** Método vocacional usado (RIASEC por defecto). */
  methodId?: MethodId;
  /** Puntajes genéricos por dimensión para métodos distintos de RIASEC. */
  methodScores?: StoredMethodScores | null;
}

/**
 * Inserta una fila en assessment_sessions y una fila por cada respuesta en
 * assessment_responses. Solo debe llamarse en tiempo de ejecución del servidor.
 *
 * Ambas escrituras (la sesión y todas sus respuestas) se ejecutan dentro de una
 * ÚNICA transacción: si falla la inserción de cualquier respuesta se hace
 * ROLLBACK completo, de modo que nunca queda una sesión huérfana o con
 * respuestas incompletas detrás de un 201. La conexión se libera siempre
 * (ver withTransaction en lib/db.ts).
 *
 * Nota sobre `cohortCode`: se almacena tal cual lo envía el cliente y NO se
 * valida que la cohorte exista. Es intencional: la inscripción es abierta vía
 * QR (`/g/{CODIGO}`) y un estudiante puede completar el test aunque la cohorte
 * aún no esté sembrada en la base o se genere un QR sin conexión. El personal
 * filtra y audita las evaluaciones por cohorte en el panel de administración.
 */
export async function persistSession(input: PersistSessionInput): Promise<void> {
  const top = input.careerMatches[0] ?? null;

  await withTransaction(async (tx) => {
    await tx(
      `INSERT INTO assessment_sessions (
          id, started_at, completed_at, is_valid, reliability_level,
          r_score, i_score, a_score, s_score, e_score, c_score,
          dominant_code, dominant_summary, warning_message,
          top_career_title, top_career_affinity,
          cohort_code, student_name, student_email, review_status,
          method_id, method_scores
       ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16,
          $17, $18, $19, $20,
          $21, $22
       )
       ON CONFLICT (id) DO NOTHING`,
      [
        input.id,
        input.startedAt,
        input.completedAt,
        input.quality.isValid,
        input.quality.reliabilityLevel,
        input.scores.r,
        input.scores.i,
        input.scores.a,
        input.scores.s,
        input.scores.e,
        input.scores.c,
        input.dominantCode,
        input.dominantSummary,
        input.quality.warningMessage,
        top ? top.career.title : null,
        top ? top.affinityPercentage : null,
        input.cohortCode ?? null,
        input.studentName ?? null,
        input.studentEmail ?? null,
        "PENDING",
        input.methodId ?? "RIASEC",
        input.methodScores ? JSON.stringify(input.methodScores) : null,
      ]
    );

    for (const ans of input.answers) {
      await tx(
        `INSERT INTO assessment_responses (
            session_id, question_id, dimension_code, score, time_spent_ms, answered_at
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          input.id,
          ans.questionId,
          ans.dimension,
          ans.score,
          ans.timeSpentMs,
          input.completedAt,
        ]
      );
    }
  });
}

/**
 * Interpreta el valor de la columna method_scores (JSONB) de forma defensiva.
 * El controlador puede devolver un objeto ya parseado o una cadena JSON; ante
 * cualquier error o valor ausente devuelve null.
 */
function parseMethodScores(value: unknown): StoredMethodScores | null {
  if (value == null) return null;
  let obj: unknown = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof obj !== "object" || obj === null) return null;
  const candidate = obj as Partial<StoredMethodScores>;
  if (!Array.isArray(candidate.dimensionScores)) return null;
  return {
    dimensionScores: candidate.dimensionScores,
    dominantCodes: Array.isArray(candidate.dominantCodes)
      ? candidate.dominantCodes
      : [],
    interpretation:
      typeof candidate.interpretation === "string"
        ? candidate.interpretation
        : "",
    // Retrocompatible: filas antiguas sin `raw` se cargan como null.
    raw:
      candidate.raw != null &&
      typeof candidate.raw === "object" &&
      !Array.isArray(candidate.raw)
        ? (candidate.raw as Record<string, unknown>)
        : null,
  };
}

export interface SessionSummary {
  id: string;
  startedAt: number;
  completedAt: number | null;
  isValid: boolean;
  reliabilityLevel: string;
  scores: PsychometricScores;
  dominantCode: string;
  topCareerTitle: string | null;
  cohortCode: string | null;
  studentName: string | null;
  studentEmail: string | null;
  reviewerNotes: string | null;
  reviewStatus: string | null;
  /** Método vocacional usado (RIASEC por defecto para filas antiguas). */
  methodId: MethodId;
}

/**
 * Lista las sesiones de evaluación para el panel de administración.
 * Solo runtime. Si no hay DATABASE_URL o la consulta falla, devuelve [] para
 * que el panel funcione (y el build pase) sin base de datos activa.
 */
export async function listSessions(): Promise<SessionSummary[]> {
  let rows: Record<string, unknown>[] = [];
  try {
    rows = await query(
      `SELECT id, started_at, completed_at, is_valid, reliability_level,
              r_score, i_score, a_score, s_score, e_score, c_score,
              dominant_code, top_career_title,
              cohort_code, student_name, student_email,
              reviewer_notes, review_status, method_id
         FROM assessment_sessions
        ORDER BY COALESCE(completed_at, started_at) DESC
        LIMIT 500`
    );
  } catch {
    return [];
  }

  const num = (v: unknown): number => Number(v ?? 0);
  const str = (v: unknown): string | null => (v == null ? null : String(v));

  return rows.map((row) => ({
    id: String(row.id),
    startedAt: num(row.started_at),
    completedAt: row.completed_at == null ? null : num(row.completed_at),
    isValid: Boolean(row.is_valid),
    reliabilityLevel: String(row.reliability_level ?? ""),
    scores: {
      r: num(row.r_score),
      i: num(row.i_score),
      a: num(row.a_score),
      s: num(row.s_score),
      e: num(row.e_score),
      c: num(row.c_score),
    },
    dominantCode: String(row.dominant_code ?? ""),
    topCareerTitle: str(row.top_career_title),
    cohortCode: str(row.cohort_code),
    studentName: str(row.student_name),
    studentEmail: str(row.student_email),
    reviewerNotes: str(row.reviewer_notes),
    reviewStatus: str(row.review_status),
    methodId: normalizeMethodId(row.method_id),
  }));
}

/**
 * Guarda el dictamen del revisor (notas + estado de revisión) sobre una sesión.
 * Solo runtime. Devuelve el número de filas afectadas (0 si la sesión no existe).
 */
export async function updateSessionReview(
  sessionId: string,
  reviewerNotes: string,
  reviewStatus: string
): Promise<number> {
  const rows = await query(
    `UPDATE assessment_sessions
        SET reviewer_notes = $2, review_status = $3
      WHERE id = $1
      RETURNING id`,
    [sessionId, reviewerNotes, reviewStatus]
  );
  return rows.length;
}

/** Carga una sesión por id. Devuelve null si no existe. Solo runtime. */
export async function loadSession(
  sessionId: string
): Promise<StoredSession | null> {
  const rows = await query(
    `SELECT id, started_at, completed_at, is_valid, reliability_level,
            r_score, i_score, a_score, s_score, e_score, c_score,
            dominant_code, dominant_summary, warning_message,
            top_career_title, top_career_affinity, ai_analysis,
            cohort_code, student_name, student_email, review_status,
            method_id, method_scores
       FROM assessment_sessions
      WHERE id = $1
      LIMIT 1`,
    [sessionId]
  );

  const row = rows[0];
  if (!row) return null;

  const num = (v: unknown): number => Number(v ?? 0);
  const str = (v: unknown): string | null =>
    v == null ? null : String(v);

  return {
    id: String(row.id),
    startedAt: num(row.started_at),
    completedAt: row.completed_at == null ? null : num(row.completed_at),
    isValid: Boolean(row.is_valid),
    reliabilityLevel: String(row.reliability_level),
    scores: {
      r: num(row.r_score),
      i: num(row.i_score),
      a: num(row.a_score),
      s: num(row.s_score),
      e: num(row.e_score),
      c: num(row.c_score),
    },
    dominantCode: String(row.dominant_code),
    dominantSummary: String(row.dominant_summary),
    warningMessage: str(row.warning_message),
    topCareerTitle: str(row.top_career_title),
    topCareerAffinity:
      row.top_career_affinity == null ? null : num(row.top_career_affinity),
    aiAnalysis: str(row.ai_analysis),
    cohortCode: str(row.cohort_code),
    studentName: str(row.student_name),
    studentEmail: str(row.student_email),
    reviewStatus: str(row.review_status),
    methodId: normalizeMethodId(row.method_id),
    methodScores: parseMethodScores(row.method_scores),
  };
}
