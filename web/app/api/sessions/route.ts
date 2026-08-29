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
import { persistSession } from "@/lib/sessions";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import type { AssessmentAnswer, DimensionCode } from "@/lib/riasec/types";

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
}

const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

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

  // Normaliza las respuestas contra el catálogo de preguntas semilla.
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

  const scores = calculateScores(answersMap, QUESTIONS);
  const quality = evaluateQuality(answersMap, QUESTIONS);
  const careerMatches = matchCareers(scores, CAREERS);
  const dominantCode = getDominantCode(scores, 3);
  const dominantSummary = getDominantProfileDescription(dominantCode);

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
      answers: Array.from(answersMap.values()),
      cohortCode: body.cohortCode ?? null,
      studentName: body.studentName ?? null,
      studentEmail: ownerEmail,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar la sesión.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
