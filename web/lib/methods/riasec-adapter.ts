// ===========================================================================
// Adaptador de RIASEC al contrato genérico VocationalMethod.
// Envuelve el motor existente (web/lib/riasec/engine.ts), los tipos
// (web/lib/riasec/types.ts) y el banco de ítems (web/data/seed.ts QUESTIONS)
// SIN modificarlos. Delega la puntuación en calculateScores/getDominantCode/
// getDominantProfileDescription, y expone los PsychometricScores en `raw`
// para que la persistencia específica de RIASEC (columnas r/i/a/s/e/c) siga
// funcionando.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import {
  calculateScores,
  getDominantCode,
  getDominantProfileDescription,
} from "@/lib/riasec/engine";
import {
  DIMENSION_META,
  DIMENSION_ORDER,
  type AssessmentAnswer,
  type DimensionCode,
  type PsychometricScores,
} from "@/lib/riasec/types";
import { QUESTIONS } from "@/data/seed";
import type {
  MethodAnswer,
  MethodDimension,
  MethodDimensionScore,
  MethodQuestion,
  MethodResult,
  ResponseScale,
  VocationalMethod,
} from "@/lib/methods/types";

const RIASEC_SCALE: ResponseScale = {
  kind: "LIKERT_5",
  options: [
    { value: 1, label: "Nada" },
    { value: 2, label: "Poco" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "Bastante" },
    { value: 5, label: "Mucho" },
  ],
};

const RIASEC_DIMENSIONS: MethodDimension[] = DIMENSION_ORDER.map((code) => {
  const meta = DIMENSION_META[code];
  return {
    code: meta.code,
    title: meta.title,
    shortDesc: meta.shortDesc,
    color: meta.color,
  };
});

const RIASEC_QUESTIONS: MethodQuestion[] = QUESTIONS.map((q) => ({
  id: q.id,
  dimension: q.dimension,
  text: q.text,
  category: q.category,
}));

function getScore(scores: PsychometricScores, code: DimensionCode): number {
  switch (code) {
    case "R":
      return scores.r;
    case "I":
      return scores.i;
    case "A":
      return scores.a;
    case "S":
      return scores.s;
    case "E":
      return scores.e;
    case "C":
      return scores.c;
  }
}

/** Convierte respuestas genéricas al mapa que espera calculateScores. */
function toAnswerMap(
  answers: MethodAnswer[]
): Map<number, AssessmentAnswer> {
  const map = new Map<number, AssessmentAnswer>();
  for (const a of answers) {
    const question = QUESTIONS.find((q) => q.id === a.questionId);
    if (!question) continue;
    map.set(a.questionId, {
      questionId: a.questionId,
      dimension: question.dimension,
      score: a.value,
      timeSpentMs: 3000,
    });
  }
  return map;
}

function scoreRiasec(answers: MethodAnswer[]): MethodResult {
  const answerMap = toAnswerMap(answers);
  const scores = calculateScores(answerMap, QUESTIONS);
  const dominantCode = getDominantCode(scores, 3);

  const dimensionScores: MethodDimensionScore[] = DIMENSION_ORDER.map(
    (code) => {
      const value = getScore(scores, code);
      return {
        code,
        title: DIMENSION_META[code].title,
        value,
        raw: value,
      };
    }
  );

  return {
    methodId: "RIASEC",
    dimensionScores,
    dominantCodes: dominantCode.split(""),
    dominantSummary: dominantCode,
    interpretation: getDominantProfileDescription(dominantCode),
    // PsychometricScores para la persistencia específica de RIASEC.
    raw: { scores },
  };
}

export const RIASEC_METHOD: VocationalMethod = {
  id: "RIASEC",
  name: "RIASEC (Modelo de Holland)",
  shortDescription:
    "Diagnóstico vocacional basado en los seis tipos de personalidad de Holland (Realista, Investigador, Artístico, Social, Emprendedor y Convencional).",
  origin:
    "Modelo hexagonal de John Holland; instrumento portado desde la aplicación original con 60 reactivos y pares espejo de control.",
  dimensions: RIASEC_DIMENSIONS,
  questions: RIASEC_QUESTIONS,
  scale: RIASEC_SCALE,
  score: scoreRiasec,
};
