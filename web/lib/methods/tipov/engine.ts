// ===========================================================================
// Motor de puntuación TIPOV. Funciones puras (sin E/S).
// Calificación según skills/knowledge/test-tipov.md:
//   - Escala Likert-3: Me agrada (3), Me es indiferente (2), Me desagrada (1).
//   - Se suma el valor crudo de los ítems por dimensión; mayor suma = mayor
//     interés. El valor normalizado 0-100 = raw / (3 * cantidadDeItems) * 100.
// La redacción de los ítems (data.ts) es una adaptación original y fiel.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import type {
  MethodAnswer,
  MethodDimensionScore,
  MethodResult,
} from "@/lib/methods/types";
import {
  TIPOV_DIMENSIONS,
  TIPOV_DIMENSIONS_ORDER,
  TIPOV_QUESTIONS,
  type TipovDimension,
} from "@/lib/methods/tipov/data";

const MAX_LIKERT = 3;

/** Número de ítems por dimensión (según el banco). */
export function itemsPerDimension(): Record<TipovDimension, number> {
  const counts = {} as Record<TipovDimension, number>;
  for (const dim of TIPOV_DIMENSIONS_ORDER) counts[dim] = 0;
  for (const q of TIPOV_QUESTIONS) counts[q.dimension as TipovDimension] += 1;
  return counts;
}

/** Suma cruda por dimensión (ítems sin responder cuentan como 0). */
export function sumByDimension(
  answers: MethodAnswer[]
): Record<TipovDimension, number> {
  const answerMap = new Map<number, number>();
  for (const a of answers) answerMap.set(a.questionId, a.value);

  const sums = {} as Record<TipovDimension, number>;
  for (const dim of TIPOV_DIMENSIONS_ORDER) sums[dim] = 0;

  for (const q of TIPOV_QUESTIONS) {
    const value = answerMap.get(q.id);
    if (value == null) continue;
    sums[q.dimension as TipovDimension] += value;
  }
  return sums;
}

/** Calcula el resultado uniforme de TIPOV. */
export function scoreTipov(answers: MethodAnswer[]): MethodResult {
  const sums = sumByDimension(answers);
  const counts = itemsPerDimension();

  const dimensionScores: MethodDimensionScore[] = TIPOV_DIMENSIONS_ORDER.map(
    (dim) => {
      const raw = sums[dim];
      const maxPossible = MAX_LIKERT * counts[dim];
      const value = maxPossible > 0 ? (raw / maxPossible) * 100 : 0;
      return {
        code: dim,
        title: TIPOV_DIMENSIONS[dim].title,
        value,
        raw,
      };
    }
  );

  // Dimensiones dominantes por suma cruda (top 3), desempate por orden canónico.
  const ranked = [...TIPOV_DIMENSIONS_ORDER]
    .map((dim, index) => ({ dim, raw: sums[dim], index }))
    .sort((x, y) => (y.raw !== x.raw ? y.raw - x.raw : x.index - y.index));

  const totalRaw = TIPOV_DIMENSIONS_ORDER.reduce((acc, d) => acc + sums[d], 0);
  const dominantCodes = ranked.slice(0, 3).map((r) => r.dim);

  let dominantSummary: string;
  let interpretation: string;

  if (totalRaw === 0) {
    dominantSummary = "Sin respuestas registradas.";
    interpretation =
      "No se registraron respuestas, por lo que no es posible determinar tus intereses profesionales. Te sugerimos completar el cuestionario indicando qué actividades te agradan, te son indiferentes o te desagradan.";
  } else {
    const titles = dominantCodes.map((d) => TIPOV_DIMENSIONS[d].title);
    dominantSummary = titles.join(", ");
    interpretation =
      `Tus intereses profesionales más altos se concentran en las áreas de ${titles[0]}, ${titles[1]} y ${titles[2]}. ` +
      `Estas dimensiones reflejan las actividades que más te agradan y hacia las que conviene orientar tu exploración vocacional.`;
  }

  return {
    methodId: "TIPOV",
    dimensionScores,
    dominantCodes,
    dominantSummary,
    interpretation,
    raw: { sums, counts },
  };
}
