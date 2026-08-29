// ===========================================================================
// Persistencia y lectura de sesiones de evaluación en Neon (solo runtime).
// Ninguna consulta se ejecuta al importar el módulo ni durante `next build`;
// todas usan el cliente perezoso de web/lib/db.ts.
// ===========================================================================

import { query } from "@/lib/db";
import type {
  AssessmentAnswer,
  CareerMatch,
  PsychometricScores,
  QualityMetric,
} from "@/lib/riasec/types";

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
}

/**
 * Inserta una fila en assessment_sessions y una fila por cada respuesta en
 * assessment_responses. Solo debe llamarse en tiempo de ejecución del servidor.
 */
export async function persistSession(input: PersistSessionInput): Promise<void> {
  const top = input.careerMatches[0] ?? null;

  await query(
    `INSERT INTO assessment_sessions (
        id, started_at, completed_at, is_valid, reliability_level,
        r_score, i_score, a_score, s_score, e_score, c_score,
        dominant_code, dominant_summary, warning_message,
        top_career_title, top_career_affinity,
        cohort_code, student_name, student_email, review_status
     ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16,
        $17, $18, $19, $20
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
    ]
  );

  for (const ans of input.answers) {
    await query(
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
            cohort_code, student_name, student_email, review_status
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
  };
}
