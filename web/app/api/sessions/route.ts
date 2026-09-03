import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { QUESTIONS, CAREERS } from "@/data/seed";
import {
  calculateScores,
  evaluateQuality,
  matchCareers,
  getDominantCode,
  getDominantProfileDescription,
} from "@/lib/riasec/engine";
import { persistSession, type StoredMethodScores } from "@/lib/sessions";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import { getMethod, normalizeMethodId } from "@/lib/methods/registry";
import type { MethodAnswer } from "@/lib/methods/types";
import type {
  AssessmentAnswer,
  DimensionCode,
  PsychometricScores,
  QualityMetric,
} from "@/lib/riasec/types";

// Fuerza el renderizado dinámico: nunca se ejecuta durante el build.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface IncomingAnswer {
  questionId: number;
  score: number;
  timeSpentMs: number;
}

interface CreateSessionBody {
  answers: IncomingAnswer[];
  cohortCode?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  startedAt?: number;
  methodId?: string | null;
}

const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

/** Puntajes neutros (0) para las columnas r/i/a/s/e/c en métodos no-RIASEC. */
const NEUTRAL_SCORES: PsychometricScores = {
  r: 0,
  i: 0,
  a: 0,
  s: 0,
  e: 0,
  c: 0,
};

/** Calidad neutra para métodos no-RIASEC (no aplican pares espejo/tiempos). */
const NEUTRAL_QUALITY: QualityMetric = {
  isValid: true,
  straightLiningDetected: false,
  averageResponseTimeMs: 0,
  speedTrapTriggered: false,
  mirrorConsistencyPercent: 100,
  reliabilityLevel: "Alta",
  warningMessage: null,
};

export async function POST(request: Request) {
  let body: CreateSessionBody;
  try {
    body = (await request.json()) as CreateSessionBody;
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido (JSON esperado)." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return NextResponse.json(
      { error: "Debes enviar al menos una respuesta." },
      { status: 400 }
    );
  }

  // Método elegido por el usuario/cohorte. Cualquier valor desconocido o
  // ausente vuelve al método por defecto (RIASEC).
  const methodId = normalizeMethodId(body.methodId);

  // --- Datos comunes a persistir; se rellenan según el método elegido. ---
  let scores: PsychometricScores = NEUTRAL_SCORES;
  let quality: QualityMetric = NEUTRAL_QUALITY;
  let careerMatches: ReturnType<typeof matchCareers> = [];
  let dominantCode = "";
  let dominantSummary = "";
  let answersToPersist: AssessmentAnswer[] = [];
  let methodScores: StoredMethodScores | null = null;

  if (methodId === "RIASEC") {
    // ------------------------------------------------------------------
    // Camino RIASEC: equivalente byte a byte al comportamiento anterior.
    // ------------------------------------------------------------------
    const answersMap = new Map<number, AssessmentAnswer>();
    for (const raw of body.answers) {
      const question = QUESTION_BY_ID.get(raw.questionId);
      if (!question) continue;
      const score = Math.round(Number(raw.score));
      if (!Number.isFinite(score) || score < 1 || score > 5) continue;
      const answer: AssessmentAnswer = {
        questionId: question.id,
        dimension: question.dimension as DimensionCode,
        score,
        timeSpentMs: Math.max(0, Math.trunc(Number(raw.timeSpentMs) || 0)),
      };
      answersMap.set(question.id, answer);
    }

    if (answersMap.size === 0) {
      return NextResponse.json(
        { error: "Ninguna respuesta válida fue recibida." },
        { status: 400 }
      );
    }

    scores = calculateScores(answersMap, QUESTIONS);
    quality = evaluateQuality(answersMap, QUESTIONS);
    careerMatches = matchCareers(scores, CAREERS);
    dominantCode = getDominantCode(scores, 3);
    dominantSummary = getDominantProfileDescription(dominantCode);
    answersToPersist = Array.from(answersMap.values());
  } else {
    // ------------------------------------------------------------------
    // Métodos genéricos (CHASIDE, TIPOV): validan contra el banco de ítems
    // y la escala del método, ejecutan su score() puro y guardan los
    // puntajes por dimensión en method_scores (r/i/a/s/e/c quedan en 0).
    // ------------------------------------------------------------------
    const method = getMethod(methodId);
    const questionById = new Map(method.questions.map((q) => [q.id, q]));
    const allowedValues = new Set(method.scale.options.map((o) => o.value));

    const methodAnswers: MethodAnswer[] = [];
    const responseAnswers: AssessmentAnswer[] = [];
    const seen = new Set<number>();
    for (const raw of body.answers) {
      const question = questionById.get(raw.questionId);
      if (!question) continue;
      if (seen.has(raw.questionId)) continue;
      const value = Number(raw.score);
      if (!Number.isFinite(value) || !allowedValues.has(value)) continue;
      seen.add(raw.questionId);
      methodAnswers.push({ questionId: question.id, value });
      responseAnswers.push({
        questionId: question.id,
        // Reutilizamos la tabla de respuestas guardando el código de dimensión
        // del método (no es un DimensionCode RIASEC, pero la columna es TEXT).
        dimension: question.dimension as DimensionCode,
        score: value,
        timeSpentMs: Math.max(0, Math.trunc(Number(raw.timeSpentMs) || 0)),
      });
    }

    if (methodAnswers.length === 0) {
      return NextResponse.json(
        { error: "Ninguna respuesta válida fue recibida." },
        { status: 400 }
      );
    }

    const result = method.score(methodAnswers);
    dominantCode = result.dominantCodes.join("");
    dominantSummary = result.dominantSummary;
    answersToPersist = responseAnswers;
    methodScores = {
      dimensionScores: result.dimensionScores,
      dominantCodes: result.dominantCodes,
      interpretation: result.interpretation,
      // Datos crudos del método (p. ej. conteos Interés/Aptitud de CHASIDE)
      // para las vistas especializadas de resultados.
      raw: result.raw ?? null,
    };
  }

  // Propiedad de la sesión (clave de lectura por correo). Reglas:
  //  - STUDENT autenticado: la propiedad se fija SIEMPRE a su correo autenticado
  //    y se ignora el `studentEmail` del cliente. Así un estudiante no puede
  //    suplantar la propiedad de otra persona (no falsificable).
  //  - Personal (staff) autenticado: puede administrar el test por cuenta de un
  //    estudiante (proctoring), por lo que se respeta el `studentEmail` enviado
  //    por el cliente para asignar al verdadero dueño. Si no envía ninguno, se
  //    deja sin dueño (null) y la sesión queda visible solo para personal.
  //  - Anónimo / modo demo (sin OAuth): se conserva el valor del cliente.
  const currentUser = await getCurrentUser();
  let ownerEmail: string | null;
  if (!currentUser) {
    ownerEmail = body.studentEmail ?? null;
  } else if (isStaffRole(currentUser.role)) {
    // Proctor: el correo del estudiante lo aporta el cliente (formulario staff).
    ownerEmail = body.studentEmail ?? null;
  } else {
    // Estudiante autenticado: propiedad no falsificable = su propio correo.
    ownerEmail = currentUser.email;
  }

  const id = randomUUID();
  const completedAt = Date.now();
  const startedAt =
    typeof body.startedAt === "number" && body.startedAt > 0
      ? body.startedAt
      : completedAt;

  // Determina el estado de revisión inicial:
  //   - Sesión de grupo (con cohortCode): COMPLETED (resultados inmediatos y
  //     accesibles sin cuenta para el estudiante que acaba de completar el test)
  //   - Estudiante individual autenticado (sin cohortCode): PENDING_AUTHORIZATION
  //   - Demás casos (anónimo sin cohorte, staff): PENDING
  const isIndividualStudent =
    !body.cohortCode &&
    currentUser !== null &&
    !isStaffRole(currentUser.role);
  const reviewStatus = body.cohortCode
    ? "COMPLETED"
    : isIndividualStudent
      ? "PENDING_AUTHORIZATION"
      : "PENDING";

  try {
    await persistSession({
      id,
      startedAt,
      completedAt,
      quality,
      scores,
      dominantCode,
      dominantSummary,
      careerMatches,
      answers: answersToPersist,
      cohortCode: body.cohortCode ?? null,
      studentName: body.studentName ?? null,
      studentEmail: ownerEmail,
      methodId,
      methodScores,
      reviewStatus,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar la sesión.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    { id, requiresAuthorization: reviewStatus === "PENDING_AUTHORIZATION" },
    { status: 201 }
  );
}
